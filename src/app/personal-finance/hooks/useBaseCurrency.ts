'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { extractCurrencyCode } from '@/lib/currency';

export const useBaseCurrency = () => {
  const { userData, updateBaseCurrency } = usePersonalFinanceStore();
  const { getValidAccessToken } = useIncrementalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get base currency from store, with fallback to USD
  const baseCurrency = userData.baseCurrency || 'USD';

  // Load base currency from spreadsheet
  const loadBaseCurrencyFromSpreadsheet = useCallback(async () => {
    if (!userData.spreadsheetId) {
      console.log('No spreadsheet ID available for base currency loading');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get valid access token');
      }

      const response = await fetch('/api/sheets/read-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          spreadsheetId: userData.spreadsheetId,
          range: 'Config!B2:B2', // Base currency is stored in Config tab, cell B2
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Config tab not found in spreadsheet');
          return; // Don't treat this as an error
        }
        throw new Error(`Failed to read base currency: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.values && data.values[0] && data.values[0][0]) {
        const rawCurrency = String(data.values[0][0]).trim();
        const currencyCode = extractCurrencyCode(rawCurrency);
        
        if (currencyCode && currencyCode !== baseCurrency) {
          console.log(`Updating base currency from spreadsheet: ${baseCurrency} → ${currencyCode}`);
          updateBaseCurrency(currencyCode);
        }
      }
    } catch (error: any) {
      console.error('Error loading base currency from spreadsheet:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [userData.spreadsheetId, getValidAccessToken, baseCurrency, updateBaseCurrency]);

  // Auto-load base currency when spreadsheet ID changes
  useEffect(() => {
    if (userData.spreadsheetId) {
      loadBaseCurrencyFromSpreadsheet();
    }
  }, [userData.spreadsheetId, loadBaseCurrencyFromSpreadsheet]);

  return {
    baseCurrency,
    isLoading,
    error,
    loadBaseCurrencyFromSpreadsheet,
    updateBaseCurrency,
  };
}; 