import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useDashboardStatus } from './useDashboardStatus';
import { useSpreadsheetRefresh } from './useSpreadsheetRefresh';
import { 
  calculateStatsFromTransactions, 
  filterTransferTransactions, 
  DashboardStats 
} from '../utils/dashboardStats';

export const useDashboard = () => {
  const { userData, updateSpreadsheetInfo } = usePersonalFinanceStore();
  const { status: dashboardStatus, isLoading: statusLoading, error: statusError } = useDashboardStatus();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [hideTransfer, setHideTransfer] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create spreadsheet refresh hook with callbacks
  const { 
    refreshFromSpreadsheet, 
    isRefreshing, 
    error: refreshError 
  } = useSpreadsheetRefresh({
    onSuccess: (data) => {
      console.log('✅ Spreadsheet refresh successful:', data);
      // Stats will be calculated by the useEffect below when userData updates
      setError(null);
    },
    onError: (errorMessage) => {
      console.error('❌ Spreadsheet refresh failed:', errorMessage);
      setError(errorMessage);
    }
  });

  // Derived state
  const filteredTransactions = useMemo(() => {
    return filterTransferTransactions(userData.transactions || [], hideTransfer);
  }, [userData.transactions, hideTransfer]);

  const spreadsheetLinked = dashboardStatus?.hasSpreadsheet || false;
  const spreadsheetUrl = dashboardStatus?.spreadsheetUrl || null;
  const isFirstTimeUser = !spreadsheetLinked && filteredTransactions.length === 0;

  // Sync spreadsheet info from API to store when available
  useEffect(() => {
    if (dashboardStatus?.spreadsheetId && dashboardStatus?.spreadsheetUrl) {
      console.log('🔗 Syncing spreadsheet info to store:', {
        spreadsheetId: dashboardStatus.spreadsheetId,
        spreadsheetUrl: dashboardStatus.spreadsheetUrl
      });
      updateSpreadsheetInfo(dashboardStatus.spreadsheetId, dashboardStatus.spreadsheetUrl);
    }
  }, [dashboardStatus?.spreadsheetId, dashboardStatus?.spreadsheetUrl, updateSpreadsheetInfo]);

  // Calculate stats from local data when appropriate
  useEffect(() => {
    if (!spreadsheetLinked && filteredTransactions.length > 0) {
      console.log('📊 Calculating stats from local data:', filteredTransactions.length, 'transactions');
      const calculatedStats = calculateStatsFromTransactions(filteredTransactions);
      setDashboardStats(calculatedStats);
    } else if (!spreadsheetLinked && filteredTransactions.length === 0) {
      // No spreadsheet and no local data = clear stats
      setDashboardStats(null);
    } else if (spreadsheetLinked && userData.transactions && userData.transactions.length > 0) {
      // Spreadsheet is linked and we have data - calculate stats from all data
      const allFilteredTransactions = filterTransferTransactions(userData.transactions, hideTransfer);
      const calculatedStats = calculateStatsFromTransactions(allFilteredTransactions);
      setDashboardStats(calculatedStats);
    }
  }, [spreadsheetLinked, filteredTransactions, userData.transactions, hideTransfer]);

  // Auto-refresh from spreadsheet when linked
  useEffect(() => {
    if (spreadsheetUrl && !isRefreshing) {
      console.log('🔄 Auto-refreshing from linked spreadsheet...');
      refreshFromSpreadsheet(spreadsheetUrl);
    }
  }, [spreadsheetUrl, spreadsheetLinked]); // Also depend on spreadsheetLinked to refresh when dashboard mounts

  // Force refresh when dashboard mounts if spreadsheet is linked but no local data
  useEffect(() => {
    if (spreadsheetLinked && spreadsheetUrl && (!userData.transactions || userData.transactions.length === 0) && !isRefreshing) {
      console.log('🔄 Dashboard mounted with spreadsheet but no local data - forcing refresh...');
      refreshFromSpreadsheet(spreadsheetUrl);
    }
  }, []); // Only run on mount

  // Handle manual refresh
  const handleRefreshData = useCallback(async () => {
    if (!spreadsheetUrl) {
      setError('No spreadsheet linked to refresh from');
      return;
    }
    
    await refreshFromSpreadsheet(spreadsheetUrl);
  }, [spreadsheetUrl, refreshFromSpreadsheet]);

  // Combined error state
  const combinedError = error || refreshError || statusError;

  return {
    // Data
    dashboardStats,
    filteredTransactions,
    
    // State
    isFirstTimeUser,
    spreadsheetLinked,
    spreadsheetUrl,
    hideTransfer,
    
    // Loading states
    isLoading: statusLoading || isRefreshing,
    isRefreshing,
    
    // Error state
    error: combinedError,
    
    // Actions
    setHideTransfer,
    handleRefreshData,
    clearError: () => setError(null)
  };
}; 