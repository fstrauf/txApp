import { useState, useEffect, useMemo } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

interface RawSavingsData {
  netAssetValue: number;
  quarter: string;
  formattedValue: string;
}

interface SavingsData extends RawSavingsData {
  runway: number; // in months
}

interface UseSavingsDataReturn {
  savingsData: SavingsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSavingsData = (monthlyAverageExpenses?: number): UseSavingsDataReturn => {
  const [rawSavingsData, setRawSavingsData] = useState<RawSavingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData } = usePersonalFinanceStore();
  const { getValidAccessToken } = useIncrementalAuth();

  const fetchSavingsData = async () => {
    if (!userData.spreadsheetId) {
      setError('No spreadsheet linked');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Google Sheets access expired. Please reconnect your account.');
      }

      const response = await fetch('/api/sheets/read-savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ spreadsheetId: userData.spreadsheetId })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch savings data');
      }

      // Store raw data without runway calculation
      setRawSavingsData({
        netAssetValue: result.data.latestNetAssetValue,
        quarter: result.data.latestQuarter,
        formattedValue: result.data.formattedValue
      });

    } catch (err: any) {
      console.error('Error fetching savings data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate savings data with runway using useMemo
  const savingsData = useMemo((): SavingsData | null => {
    if (!rawSavingsData) return null;
    
    // Calculate runway if we have monthly expenses
    let runway = 0;
    if (monthlyAverageExpenses && monthlyAverageExpenses > 0) {
      runway = Math.round(rawSavingsData.netAssetValue / monthlyAverageExpenses);
    }

    return {
      ...rawSavingsData,
      runway
    };
  }, [rawSavingsData, monthlyAverageExpenses]);

  useEffect(() => {
    if (userData.spreadsheetId) {
      fetchSavingsData();
    }
  }, [userData.spreadsheetId]); // Only refetch when spreadsheet changes, not when expenses change

  return {
    savingsData,
    isLoading,
    error,
    refetch: fetchSavingsData
  };
}; 