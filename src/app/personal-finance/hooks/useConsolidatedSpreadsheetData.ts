import { useDashboardQuery } from './useDashboardQuery';

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
  
  // Loading and error states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  handleRefreshData: () => Promise<any>;
}

/**
 * Consolidated hook that provides all spreadsheet data from a single source
 * This replaces multiple individual hooks (useSavingsData, useBaseCurrency, etc.)
 * to eliminate redundant API calls and improve performance
 */
export const useConsolidatedSpreadsheetData = (monthlyAverageExpenses?: number): ConsolidatedSpreadsheetData => {
  const dashboardQuery = useDashboardQuery();
  
  // Extract data from the consolidated query
  const spreadsheetData = dashboardQuery.spreadsheetData;
  
  // Calculate runway if we have both savings and expense data
  const savingsData = spreadsheetData?.savings ? {
    netAssetValue: spreadsheetData.savings.latestNetAssetValue,
    quarter: spreadsheetData.savings.latestQuarter,
    formattedValue: spreadsheetData.savings.formattedValue,
    runway: monthlyAverageExpenses && monthlyAverageExpenses > 0 
      ? Math.round(spreadsheetData.savings.latestNetAssetValue / monthlyAverageExpenses)
      : 0
  } : null;

  return {
    // Transaction data
    transactions: spreadsheetData?.transactions || [],
    transactionCount: spreadsheetData?.transactionCount || 0,
    dateRange: spreadsheetData?.dateRange || null,
    
    // Config data
    baseCurrency: spreadsheetData?.config?.baseCurrency || null,
    
    // Savings data with calculated runway
    savingsData,
    
    // Sheet info
    availableSheets: spreadsheetData?.availableSheets || [],
    
    // Loading and error states from dashboard query
    isLoading: dashboardQuery.isLoading,
    isRefreshing: dashboardQuery.isRefreshing,
    error: dashboardQuery.error,
    
    // Actions
    handleRefreshData: dashboardQuery.handleRefreshData
  };
}; 