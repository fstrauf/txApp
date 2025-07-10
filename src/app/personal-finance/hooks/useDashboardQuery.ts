'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { useAuthenticationBarrier } from './useAuthenticationBarrier';
import { 
  calculateStatsFromTransactions, 
  calculateStatsWithRunway,
  filterTransferTransactions, 
  DashboardStats 
} from '../utils/dashboardStats';

interface DashboardStatusData {
  spreadsheetUrl: string | null;
  spreadsheetId: string | null;
  lastDataRefresh: Date | null;
  emailRemindersEnabled: boolean;
  hasSpreadsheet: boolean;
  stats: any;
}

interface AssetAllocation {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

interface SpreadsheetData {
  transactions: any[];
  transactionCount: number;
  dateRange: {
    oldest: string;
    newest: string;
  } | null;
  config?: {
    baseCurrency?: string;
  };
  savings?: {
    latestNetAssetValue: number;
    latestQuarter: string;
    formattedValue: string;
    totalEntries: number;
  };
  assets?: {
    totalValue: number;
    totalAssets: number;
    latestQuarter: string;
    allocation: AssetAllocation[];
    assets: any[];
    quarters: string[];
  };
  availableSheets: string[];
  spreadsheetName?: string;
}

// Dashboard status query
const fetchDashboardStatus = async (): Promise<DashboardStatusData> => {
  const response = await fetch('/api/dashboard/status');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch dashboard status: ${response.statusText}`);
  }
  
  return response.json();
};

// Combined spreadsheet data query - reads all sheets at once
const fetchSpreadsheetData = async (
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetData> => {
  const response = await fetch('/api/sheets/read-all-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ spreadsheetId })
  });

  const result = await response.json();
  
  if (!response.ok) {
    // For detailed error responses, throw the full error object as JSON string
    if (result.errorType && (result.details || result.suggestions)) {
      throw new Error(JSON.stringify(result));
    }
    
    // Handle specific Google Sheets API errors (legacy)
    if (response.status === 401) {
      throw new Error('Google Sheets access expired. Please reconnect your account.');
    }
    
    // Handle format compatibility errors (422 status)
    if (response.status === 422) {
      throw new Error(JSON.stringify(result));
    }
    
    throw new Error(result.error || 'Failed to read from Google Sheets');
  }

  const data = result.data;
  
  // Calculate date range for transactions if available
  let dateRange = null;
  if (data.transactions && data.transactions.length > 0) {
    dateRange = {
      oldest: data.transactions.reduce((oldest: any, t: any) => 
        new Date(t.date) < new Date(oldest.date) ? t : oldest
      )?.date,
      newest: data.transactions.reduce((newest: any, t: any) => 
        new Date(t.date) > new Date(newest.date) ? t : newest
      )?.date
    };
  }

  return {
    transactions: data.transactions || [],
    transactionCount: data.transactionCount || 0,
    dateRange,
    config: data.config,
    savings: data.savings,
    assets: data.assets,
    availableSheets: data.availableSheets || [],
    spreadsheetName: data.spreadsheetName
  };
};

export const useDashboardQuery = () => {
  const { isAuthenticated, isReady } = useAuthenticationBarrier();
  const { userData, processTransactionData, updateSpreadsheetInfo, updateSavingsSheetData } = usePersonalFinanceStore();
  const { getValidAccessToken } = useIncrementalAuth();
  const queryClient = useQueryClient();
  
  const [hideTransfer, setHideTransfer] = useState<boolean>(true);

  // Use ref to track if we've processed initial data to prevent loops
  const hasProcessedInitialData = useRef(false);

  // Dashboard status query - only enabled when auth is ready and stable
  const {
    data: dashboardStatus,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useQuery<DashboardStatusData, Error>({
    queryKey: ['dashboardStatus'],
    queryFn: fetchDashboardStatus,
    enabled: isReady && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('expired') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Extract spreadsheet info with stable values
  const spreadsheetId = dashboardStatus?.spreadsheetId;
  const spreadsheetUrl = dashboardStatus?.spreadsheetUrl;
  const spreadsheetLinked = dashboardStatus?.hasSpreadsheet || false;

  // Spreadsheet data query - only enabled when auth is ready and we have a linked spreadsheet
  const {
    data: spreadsheetData,
    isLoading: isSpreadsheetLoading,
    error: spreadsheetError,
    refetch: refetchSpreadsheet,
    isRefetching: isRefetchingSpreadsheet
  } = useQuery<SpreadsheetData, Error>({
    queryKey: ['spreadsheetData', spreadsheetId],
    queryFn: async () => {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Google Sheets access expired. Please use "Link Sheet" to reconnect.');
      }
      if (!spreadsheetId) {
        throw new Error('No spreadsheet ID available');
      }
      return fetchSpreadsheetData(accessToken, spreadsheetId);
    },
    enabled: isReady && isAuthenticated && spreadsheetLinked && !!spreadsheetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('expired') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Manual refresh mutation with better error handling
  const refreshMutation = useMutation<SpreadsheetData, Error, void>({
    mutationFn: async () => {
      if (!spreadsheetId) {
        throw new Error('No spreadsheet linked to refresh from');
      }
      
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Google Sheets access expired. Please use "Link Sheet" to reconnect.');
      }
      
      return fetchSpreadsheetData(accessToken, spreadsheetId);
    },
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['spreadsheetData', spreadsheetId], data);
      
      // Process the transaction data in the store
      if (data.transactions && data.transactions.length > 0) {
        processTransactionData(data.transactions);
      }
      
      // Cache savings data when available
      if (data.savings) {
        updateSavingsSheetData(data.savings);
      }
    },
    onError: (error) => {
      console.error('❌ Error refreshing spreadsheet data:', error);
    }
  });

  // Process data only once when it first arrives and auth is ready
  useEffect(() => {
    if (!isReady) return;
    
    if (spreadsheetData?.transactions && !hasProcessedInitialData.current) {
      processTransactionData(spreadsheetData.transactions);
      hasProcessedInitialData.current = true;
    }
    
    // Cache savings data when available
    if (spreadsheetData?.savings) {
      updateSavingsSheetData(spreadsheetData.savings);
    }
  }, [isReady, !!spreadsheetData?.transactions?.length, spreadsheetData?.savings?.latestNetAssetValue]);

  // Update spreadsheet info only when auth is ready and values change
  useEffect(() => {
    if (!isReady) return;
    
    if (dashboardStatus?.spreadsheetId && dashboardStatus?.spreadsheetUrl) {
      updateSpreadsheetInfo(dashboardStatus.spreadsheetId, dashboardStatus.spreadsheetUrl);
    }
  }, [isReady, dashboardStatus?.spreadsheetId, dashboardStatus?.spreadsheetUrl]);

  // Calculate filtered transactions and stats
  const filteredTransactions = useMemo(() => {
    return filterTransferTransactions(userData.transactions || [], hideTransfer);
  }, [userData.transactions, hideTransfer]);

  const dashboardStats = useMemo((): DashboardStats | null => {
    if (filteredTransactions.length === 0) {
      return null;
    }
    // Use the new unified calculation that includes runway from cached savings data
    return calculateStatsWithRunway(filteredTransactions, userData.savingsSheetData);
  }, [filteredTransactions, userData.savingsSheetData]);

  const isFirstTimeUser = !isAuthenticated || !spreadsheetLinked;

  // Manual refresh handler
  const handleRefreshData = useCallback(async () => {
    if (!spreadsheetLinked) {
      throw new Error('No spreadsheet linked to refresh from');
    }
    return refreshMutation.mutateAsync();
  }, [spreadsheetLinked, refreshMutation]);

  // Combined loading state
  const isLoading = !isReady || isStatusLoading || (spreadsheetLinked && isSpreadsheetLoading);
  const isRefreshing = refreshMutation.isPending || isRefetchingSpreadsheet;

  // Combined error state with fallback handling
  const error = useMemo(() => {
    // Don't show refresh errors if we have successful data and the user isn't actively refreshing
    if (refreshMutation.error && !refreshMutation.isPending) {
      // Only show refresh errors if we don't have any data at all
      if (!dashboardStats && !userData.transactions?.length && !spreadsheetData) {
        return refreshMutation.error.message;
      }
      // Don't show refresh errors when we have working data
      return null;
    }
    
    // Show spreadsheet errors but mention fallback if we have local data
    if (spreadsheetError) {
      const baseError = spreadsheetError.message;
      if (userData.transactions && userData.transactions.length > 0) {
        return `${baseError} (showing cached data)`;
      }
      return baseError;
    }
    
    if (statusError) {
      return statusError.message;
    }
    
    return null;
  }, [refreshMutation.error, refreshMutation.isPending, spreadsheetError, statusError, userData.transactions, dashboardStats, spreadsheetData]);

  return {
    // Data
    dashboardStats,
    filteredTransactions,
    spreadsheetData,
    assetsData: spreadsheetData?.assets || null,
    
    // State
    isFirstTimeUser,
    spreadsheetLinked,
    spreadsheetUrl,
    hideTransfer,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Error state
    error,
    
    // Actions
    setHideTransfer,
    handleRefreshData,
    refetchStatus,
    refetchSpreadsheet,
    clearError: () => {
      // Reset mutation errors
      refreshMutation.reset();
      
      // Cancel any pending queries to avoid race conditions
      queryClient.cancelQueries({ queryKey: ['spreadsheetData'] });
      queryClient.cancelQueries({ queryKey: ['dashboardStatus'] });
      
      // Invalidate queries to clear errors and remove data
      queryClient.invalidateQueries({ queryKey: ['spreadsheetData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStatus'] });
      
      // Remove all query data to force a fresh state
      queryClient.removeQueries({ queryKey: ['spreadsheetData'] });
      queryClient.removeQueries({ queryKey: ['dashboardStatus'] });
    }
  };
}; 