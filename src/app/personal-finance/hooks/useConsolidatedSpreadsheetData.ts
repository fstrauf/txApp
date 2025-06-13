import { useDashboardQuery } from './useDashboardQuery';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useMemo } from 'react';

interface ConsolidatedSpreadsheetData {
  // Transaction data
  transactions: any[];
  transactionCount: number;
  dateRange: { oldest: string; newest: string } | null;
  
  // Config data (base currency)
  baseCurrency: string | null;
  
  // Savings data (runway calculation)
  savingsData: {
    netAssetValue: number;
    quarter: string;
    formattedValue: string;
    runway: number; // calculated based on monthly expenses
  } | null;
  
  // Sheet info
  availableSheets: string[];
  spreadsheetName?: string;
  
  // Loading and error states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Data freshness indicators
  isUsingCachedData: boolean;
  hasExpiredToken: boolean;
  lastDataRefresh: Date | null;
  
  // Actions
  handleRefreshData: () => Promise<any>;
}

/**
 * Consolidated hook that provides all spreadsheet data from a single source
 * This replaces multiple individual hooks (useSavingsData, useBaseCurrency, etc.)
 * to eliminate redundant API calls and improve performance.
 * 
 * Provides unified error handling and fallback strategies for expired tokens.
 * Now includes cached savings data fallback for runway calculation.
 */
export const useConsolidatedSpreadsheetData = (monthlyAverageExpenses?: number): ConsolidatedSpreadsheetData => {
  const dashboardQuery = useDashboardQuery();
  const { userData, updateSavingsSheetData } = usePersonalFinanceStore();
  
  // Extract data from the consolidated query
  const spreadsheetData = dashboardQuery.spreadsheetData;
  
  // Determine if we have an expired token scenario
  const hasExpiredToken = useMemo(() => {
    return dashboardQuery.error && (
      dashboardQuery.error.includes('expired') || 
      dashboardQuery.error.includes('401') || 
      dashboardQuery.error.includes('Invalid or expired Google access token') ||
      dashboardQuery.error.includes('Google Sheets access expired')
    );
  }, [dashboardQuery.error]);

  // Determine if we're using cached data (have local transactions but no fresh spreadsheet data)
  const isUsingCachedData = useMemo(() => {
    return Boolean(hasExpiredToken && (
      (userData.transactions && userData.transactions.length > 0) ||
      userData.savingsSheetData
    ));
  }, [hasExpiredToken, userData.transactions, userData.savingsSheetData]);

  // Cache fresh savings data when available
  useMemo(() => {
    if (spreadsheetData?.savings && !hasExpiredToken) {
      updateSavingsSheetData(spreadsheetData.savings);
    }
  }, [spreadsheetData?.savings, hasExpiredToken, updateSavingsSheetData]);

  // Calculate runway using fresh data OR cached data as fallback
  const savingsData = useMemo(() => {
    // Prefer fresh data from API
    const freshSavingsData = spreadsheetData?.savings;
    // Fallback to cached data when token is expired
    const cachedSavingsData = userData.savingsSheetData;
    
    const savingsSource = freshSavingsData || cachedSavingsData;
    
    if (!savingsSource) return null;
    
    return {
      netAssetValue: savingsSource.latestNetAssetValue,
      quarter: savingsSource.latestQuarter,
      formattedValue: savingsSource.formattedValue,
      runway: monthlyAverageExpenses && monthlyAverageExpenses > 0 
        ? Math.round(savingsSource.latestNetAssetValue / monthlyAverageExpenses)
        : 0
    };
  }, [spreadsheetData?.savings, userData.savingsSheetData, monthlyAverageExpenses]);

  // Enhanced error message that provides context about cached data
  const enhancedError = useMemo(() => {
    if (!dashboardQuery.error) return null;
    
    if (hasExpiredToken) {
      if (isUsingCachedData) {
        return `${dashboardQuery.error} (showing cached data)`;
      } else {
        return `${dashboardQuery.error} (no cached data available)`;
      }
    }
    
    return dashboardQuery.error;
  }, [dashboardQuery.error, hasExpiredToken, isUsingCachedData]);

  return {
    // Transaction data - prefer fresh data, fallback to cached
    transactions: spreadsheetData?.transactions || userData.transactions || [],
    transactionCount: spreadsheetData?.transactionCount || userData.transactions?.length || 0,
    dateRange: spreadsheetData?.dateRange || null,
    
    // Config data
    baseCurrency: spreadsheetData?.config?.baseCurrency || null,
    
    // Savings data with calculated runway (now supports cached fallback)
    savingsData,
    
    // Sheet info
    availableSheets: spreadsheetData?.availableSheets || [],
    spreadsheetName: spreadsheetData?.spreadsheetName,
    
    // Loading and error states from dashboard query
    isLoading: dashboardQuery.isLoading,
    isRefreshing: dashboardQuery.isRefreshing,
    error: enhancedError,
    
    // Data freshness indicators
    isUsingCachedData,
    hasExpiredToken: Boolean(hasExpiredToken),
    lastDataRefresh: userData.lastDataRefresh ? new Date(userData.lastDataRefresh) : null,
    
    // Actions
    handleRefreshData: dashboardQuery.handleRefreshData
  };
}; 