import { useState, useCallback } from 'react';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useRateLimit } from './useRateLimit';

interface SpreadsheetRefreshOptions {
  onSuccess?: (data: { transactionCount: number; dateRange: any }) => void;
  onError?: (error: string) => void;
}

export const useSpreadsheetRefresh = ({ onSuccess, onError }: SpreadsheetRefreshOptions = {}) => {
  const { getValidAccessToken } = useIncrementalAuth();
  const { processTransactionData, userData } = usePersonalFinanceStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { executeWithRateLimit } = useRateLimit({
    cooldownMs: 10000, // 10 second cooldown
    onRateLimited: () => {
      console.log('⏱️ Spreadsheet refresh rate limited');
    }
  });

  const extractSpreadsheetId = useCallback((url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }, []);

  const refreshFromSpreadsheet = useCallback(
    async (spreadsheetUrl: string) => {
      const result = await executeWithRateLimit(async () => {
        setIsRefreshing(true);
        setError(null);
        
        try {
          // Get access token
          const accessToken = await getValidAccessToken();
          
          if (!accessToken) {
            throw new Error('Google Sheets access expired. Please use "Link Sheet" to reconnect.');
          }

          // Extract spreadsheet ID
          const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
          if (!spreadsheetId) {
            throw new Error('Invalid spreadsheet URL');
          }

          // Fetch data from spreadsheet
          const response = await fetch('/api/sheets/read-expense-detail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ 
              spreadsheetId,
              baseCurrency: 'USD' // Default fallback, ideally this should come from user settings
            })
          });

          const spreadsheetData = await response.json();

          if (!response.ok) {
            throw new Error(spreadsheetData.error || 'Failed to read from Google Sheets');
          }

          if (spreadsheetData.transactions && spreadsheetData.transactions.length > 0) {
            // Update store with fresh spreadsheet data
            processTransactionData(spreadsheetData.transactions);
            
            const dateRange = {
              oldest: spreadsheetData.transactions.reduce((oldest: any, t: any) => 
                new Date(t.date) < new Date(oldest.date) ? t : oldest
              )?.date,
              newest: spreadsheetData.transactions.reduce((newest: any, t: any) => 
                new Date(t.date) > new Date(newest.date) ? t : newest
              )?.date
            };

            const result = {
              transactionCount: spreadsheetData.transactions.length,
              dateRange
            };

            console.log(`✅ Refreshed ${spreadsheetData.transactions.length} transactions`);
            onSuccess?.(result);
            return result;
          } else {
            throw new Error('No transaction data found in the spreadsheet');
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to refresh data from spreadsheet';
          setError(errorMessage);
          onError?.(errorMessage);
          
          // Return existing data if available as fallback
          if (userData.transactions && userData.transactions.length > 0) {
            return {
              transactionCount: userData.transactions.length,
              dateRange: null,
              fallback: true
            };
          }
          
          throw error;
        } finally {
          setIsRefreshing(false);
        }
      }, 'Spreadsheet refresh');

      return result;
    },
    [executeWithRateLimit, getValidAccessToken, extractSpreadsheetId, processTransactionData, userData.transactions, onSuccess, onError]
  );

  return {
    refreshFromSpreadsheet,
    isRefreshing,
    error,
    clearError: () => setError(null)
  };
}; 