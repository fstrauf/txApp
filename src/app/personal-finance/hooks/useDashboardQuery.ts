'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
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
    // Handle specific Google Sheets API errors
    if (response.status === 401) {
      throw new Error('Google Sheets access expired. Please reconnect your account.');
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
    availableSheets: data.availableSheets || [],
    spreadsheetName: data.spreadsheetName
  };
};

export const useDashboardQuery = () => {
  const { data: session } = useSession();
  const { userData, processTransactionData, updateSpreadsheetInfo, updateSavingsSheetData } = usePersonalFinanceStore();
  const { getValidAccessToken } = useIncrementalAuth();
  const queryClient = useQueryClient();
  
  const [hideTransfer, setHideTransfer] = useState<boolean>(true);
  const isAuthenticated = !!session?.user?.id;

  // Dashboard status query
  const {
    data: dashboardStatus,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useQuery<DashboardStatusData, Error>({
    queryKey: ['dashboardStatus'],
    queryFn: fetchDashboardStatus,
    enabled: isAuthenticated,
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

  // Extract spreadsheet info
  const spreadsheetId = dashboardStatus?.spreadsheetId;
  const spreadsheetUrl = dashboardStatus?.spreadsheetUrl;
  const spreadsheetLinked = dashboardStatus?.hasSpreadsheet || false;

  // Spreadsheet data query - only enabled when we have a spreadsheet
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
    enabled: isAuthenticated && spreadsheetLinked && !!spreadsheetId,
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
      if (data.transactions) {
        processTransactionData(data.transactions);
      }
      
      // Cache savings data when available
      if (data.savings) {
        updateSavingsSheetData(data.savings);
      }
      
      console.log('✅ Successfully refreshed spreadsheet data:', {
        transactionCount: data.transactionCount,
        dateRange: data.dateRange,
        hasSavingsData: !!data.savings
      });
    },
    onError: (error) => {
      console.error('❌ Error refreshing spreadsheet data:', error);
    }
  });

  // Update store when spreadsheet data changes
  useEffect(() => {
    if (spreadsheetData?.transactions) {
      processTransactionData(spreadsheetData.transactions);
    }
    // Cache savings data when available
    if (spreadsheetData?.savings) {
      updateSavingsSheetData(spreadsheetData.savings);
    }
  }, [spreadsheetData?.transactions, spreadsheetData?.savings, processTransactionData, updateSavingsSheetData]);

  // Update spreadsheet info in store when status changes
  useEffect(() => {
    if (dashboardStatus?.spreadsheetId && dashboardStatus?.spreadsheetUrl) {
      updateSpreadsheetInfo(dashboardStatus.spreadsheetId, dashboardStatus.spreadsheetUrl);
    }
  }, [dashboardStatus?.spreadsheetId, dashboardStatus?.spreadsheetUrl, updateSpreadsheetInfo]);

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
  const isLoading = isStatusLoading || (spreadsheetLinked && isSpreadsheetLoading);
  const isRefreshing = refreshMutation.isPending || isRefetchingSpreadsheet;

  // Combined error state with fallback handling
  const error = useMemo(() => {
    // Prioritize refresh errors as they're more actionable
    if (refreshMutation.error) {
      return refreshMutation.error.message;
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
  }, [refreshMutation.error, spreadsheetError, statusError, userData.transactions]);

  return {
    // Data
    dashboardStats,
    filteredTransactions,
    spreadsheetData,
    
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
      refreshMutation.reset();
      queryClient.removeQueries({ queryKey: ['spreadsheetData'], type: 'inactive' });
    }
  };
}; 