import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

  // Use refs to prevent unnecessary re-calculations and cascading effects
  const hasInitialized = useRef(false);
  const lastSpreadsheetUrl = useRef<string | null>(null);
  const lastTransactionCount = useRef(0);
  const lastHideTransfer = useRef(hideTransfer);

  // Create spreadsheet refresh hook with callbacks
  const { 
    refreshFromSpreadsheet, 
    isRefreshing, 
    error: refreshError 
  } = useSpreadsheetRefresh({
    onSuccess: (data) => {
      console.log('✅ Spreadsheet refresh successful:', data);
      setError(null);
      // Stats will be recalculated by the effect below
    },
    onError: (errorMessage) => {
      console.error('❌ Spreadsheet refresh failed:', errorMessage);
      setError(errorMessage);
    }
  });

  // Derived state with stable memoization
  const filteredTransactions = useMemo(() => {
    return filterTransferTransactions(userData.transactions || [], hideTransfer);
  }, [userData.transactions, hideTransfer]);

  const spreadsheetLinked = dashboardStatus?.hasSpreadsheet || false;
  const spreadsheetUrl = dashboardStatus?.spreadsheetUrl || null;
  const isFirstTimeUser = !spreadsheetLinked && filteredTransactions.length === 0;

  // Single consolidated effect to handle all dashboard initialization and updates
  useEffect(() => {
    const initializeAndUpdate = async () => {
      try {
        // 1. Sync spreadsheet info when available (only if changed)
        if (dashboardStatus?.spreadsheetId && dashboardStatus?.spreadsheetUrl) {
          console.log('🔗 Syncing spreadsheet info to store:', {
            spreadsheetId: dashboardStatus.spreadsheetId,
            spreadsheetUrl: dashboardStatus.spreadsheetUrl
          });
          updateSpreadsheetInfo(dashboardStatus.spreadsheetId, dashboardStatus.spreadsheetUrl);
        }

        // 2. Calculate stats when needed (only if data actually changed)
        const currentTransactionCount = filteredTransactions.length;
        const hasDataChanged = 
          currentTransactionCount !== lastTransactionCount.current ||
          hideTransfer !== lastHideTransfer.current;

        if (hasDataChanged) {
          if (!spreadsheetLinked && currentTransactionCount > 0) {
            console.log('📊 Calculating stats from local data:', currentTransactionCount, 'transactions');
            const calculatedStats = calculateStatsFromTransactions(filteredTransactions);
            setDashboardStats(calculatedStats);
          } else if (!spreadsheetLinked && currentTransactionCount === 0) {
            // No spreadsheet and no local data = clear stats
            setDashboardStats(null);
          } else if (spreadsheetLinked && userData.transactions && userData.transactions.length > 0) {
            // Spreadsheet is linked and we have data - calculate stats from all data
            const allFilteredTransactions = filterTransferTransactions(userData.transactions, hideTransfer);
            const calculatedStats = calculateStatsFromTransactions(allFilteredTransactions);
            setDashboardStats(calculatedStats);
          }

          // Update refs to track changes
          lastTransactionCount.current = currentTransactionCount;
          lastHideTransfer.current = hideTransfer;
        }

        // 3. Handle spreadsheet refresh logic (only when needed and not already refreshing)
        if (spreadsheetUrl && !isRefreshing) {
          const urlChanged = spreadsheetUrl !== lastSpreadsheetUrl.current;
          const needsInitialRefresh = spreadsheetLinked && 
            (!userData.transactions || userData.transactions.length === 0) && 
            !hasInitialized.current;

          if (urlChanged || needsInitialRefresh) {
            console.log('🔄 Refreshing from spreadsheet:', urlChanged ? 'URL changed' : 'Initial refresh');
            await refreshFromSpreadsheet(spreadsheetUrl);
            lastSpreadsheetUrl.current = spreadsheetUrl;
          }
        }

        hasInitialized.current = true;

      } catch (error) {
        console.error('Dashboard update error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeAndUpdate();

  }, [
    // Only depend on what we actually need to react to
    dashboardStatus?.spreadsheetId,
    dashboardStatus?.spreadsheetUrl,
    filteredTransactions.length,
    hideTransfer,
    spreadsheetLinked,
    spreadsheetUrl,
    userData.transactions?.length,
    isRefreshing
  ]);

  // Handle manual refresh - memoized to prevent unnecessary re-renders
  const handleRefreshData = useCallback(async () => {
    if (!spreadsheetUrl) {
      setError('No spreadsheet linked to refresh from');
      return;
    }
    
    await refreshFromSpreadsheet(spreadsheetUrl);
  }, [spreadsheetUrl, refreshFromSpreadsheet]);

  // Clear error callback
  const clearError = useCallback(() => setError(null), []);

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
    clearError
  };
}; 