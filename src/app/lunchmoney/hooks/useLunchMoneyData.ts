import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Transaction, Category, DateRange } from '../components/types';

const TRAINING_POLL_INTERVAL = 5000; // 5 seconds
const TRAINING_TOAST_ID = 'training-toast'; // Constant for toast ID

// Define return type for the hook
interface UseLunchMoneyDataReturn {
  // State
  dateRange: DateRange;
  pendingDateRange: DateRange;
  statusFilter: 'uncleared' | 'cleared';
  isApplyingDates: boolean;
  isTrainingInBackground: boolean;
  // Data & Status
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  transactionError: Error | null;
  countsData: { reviewedCount: number; unreviewedCount: number; trainedCount: number } | undefined;
  isLoadingCounts: boolean;
  countsError: Error | null;
  categories: (string | Category)[];
  isLoadingCategories: boolean;
  categoriesError: Error | null;
  lastTrainedTimestamp: string | null;
  isLoadingTimestamp: boolean;
  timestampError: Error | null;
  // Functions
  handleDateRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyDateFilter: () => void;
  setStatusFilter: (filter: 'uncleared' | 'cleared') => void;
  startBackgroundTraining: (expectedCount: number) => void;
  stopBackgroundTraining: () => void;
}

export function useLunchMoneyData(): UseLunchMoneyDataReturn {
  // === State ===
  const [statusFilter, setStatusFilter] = useState<'uncleared' | 'cleared'>('uncleared');
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>(() => ({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth()-5, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  }));
  const [dateRange, setDateRange] = useState<DateRange>(() => pendingDateRange);
  const [isApplyingDates, setIsApplyingDates] = useState(false);

  // Polling State
  const [isTrainingInBackground, setIsTrainingInBackground] = useState(false);
  const [expectedTrainCount, setExpectedTrainCount] = useState(0); 

  // === Fetch Functions ===
  const fetchTransactionsWithDates = useCallback(async (dates: DateRange, filter: 'uncleared' | 'cleared'): Promise<Transaction[]> => {
    console.log('[Hook] Fetching transactions with dates:', dates, 'Status Filter:', filter);
    const params = new URLSearchParams({
      start_date: dates.startDate,
      end_date: dates.endDate,
      status: filter,
    });
    const response = await fetch(`/api/lunch-money/transactions?${params}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch transactions');
    }
    const data = await response.json();
    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error('Received invalid data format from server');
    }
    // Basic sanitization and sorting (can be expanded)
    let formattedTransactions = data.transactions.map((tx: any) => ({
      ...tx,
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)),
      // Add other sanitizations as needed
    })).sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log(`[Hook] Fetched ${formattedTransactions.length} transactions.`);
    return formattedTransactions;
  }, []);

  const fetchTotalCounts = useCallback(async (dates: DateRange): Promise<{ reviewedCount: number; unreviewedCount: number; trainedCount: number }> => {
    console.log("[Hook Counts Fetch Fn] Fetching counts for:", dates);
    const params = new URLSearchParams({
      start_date: dates.startDate,
      end_date: dates.endDate,
    });
    const response = await fetch(`/api/lunch-money/transaction-counts?${params}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Counts API Error (${response.status})`);
    }
    const data = await response.json();
    const counts = {
      reviewedCount: data.clearedCount || 0,
      unreviewedCount: data.unclearedCount || 0,
      trainedCount: data.trainedCount || 0,
    };
    console.log("[Hook Counts Fetch Fn] Fetched:", counts);
    return counts;
  }, []);

  const fetchCategories = useCallback(async (): Promise<(string | Category)[]> => {
    console.log("[Hook] Fetching categories...");
    const response = await fetch('/api/lunch-money/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch Lunch Money categories');
    }
    const data = await response.json();
    console.log("[Hook] Fetched categories.");
    return data.categories || [];
  }, []);

  const fetchLastTrainedTimestamp = useCallback(async (): Promise<string | null> => {
    console.log("[Hook] Fetching last trained timestamp...");
    const response = await fetch('/api/classify/last-trained');
    if (!response.ok) {
      console.warn(`[Hook] Failed to fetch last trained timestamp: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log("[Hook] Fetched timestamp:", data.lastTrainedAt);
    return data.lastTrainedAt || null;
  }, []);

  // === Queries ===
  const { 
    data: transactions = [], // Default to empty array
    isLoading: isLoadingTransactions, 
    error: transactionError 
  } = useQuery<Transaction[], Error>({
    queryKey: ['lunchMoneyTransactions', dateRange, statusFilter],
    queryFn: () => fetchTransactionsWithDates(dateRange, statusFilter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData, 
  });

  const { 
    data: countsData, 
    isLoading: isLoadingCounts, 
    error: countsError 
  } = useQuery({
    queryKey: ['lunchMoneyTransactionCounts', dateRange], // Include dateRange
    queryFn: () => fetchTotalCounts(dateRange),
    refetchInterval: isTrainingInBackground ? TRAINING_POLL_INTERVAL : false, 
    refetchIntervalInBackground: true, 
    refetchOnWindowFocus: true, 
    staleTime: 60 * 1000, 
  });

  useEffect(() => {
    if (!isLoadingTransactions && !isLoadingCounts) {
        setIsApplyingDates(false);
    }
  }, [isLoadingTransactions, isLoadingCounts]);

  const { 
    data: categories = [], // Default to empty array
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useQuery<(string | Category)[], Error>({
    queryKey: ['lunchMoneyCategories'],
    queryFn: fetchCategories,
    staleTime: Infinity, // Categories rarely change
    refetchOnWindowFocus: false,
  });

  const { 
    data: lastTrainedTimestamp = null, // Default to null
    isLoading: isLoadingTimestamp, 
    error: timestampError 
  } = useQuery<string | null, Error>({
    queryKey: ['lastTrainedTimestamp'],
    queryFn: fetchLastTrainedTimestamp,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // === Polling Effect ===
  useEffect(() => {
    if (!isTrainingInBackground) return; // Only run if polling

    if (countsError) {
      console.error('[Hook Counts Effect Error]', countsError);
      setIsTrainingInBackground(false);
      setExpectedTrainCount(0);
      toast.error(`Error fetching counts during training: ${countsError.message}. Please refresh manually.`, { id: TRAINING_TOAST_ID });
    } else if (countsData) {
      console.log(`[Hook Counts Effect Success] Counts: Trained=${countsData.trainedCount}, Reviewed=${countsData.reviewedCount}. Polling: ${isTrainingInBackground}`);
      if (countsData.trainedCount >= expectedTrainCount) {
        console.log(`[Hook Counts Effect Success] Training target met (${countsData.trainedCount}/${expectedTrainCount}). Stopping poll.`);
        setIsTrainingInBackground(false);
        setExpectedTrainCount(0); 
        toast.success('Training complete! Transactions labeled.', { id: TRAINING_TOAST_ID });
        // REMOVED: Tagging logic - backend should handle this ideally
      } else {
         // Update loading toast with progress
         console.log(`[Hook Counts Effect Success] Training still in progress (${countsData.trainedCount}/${expectedTrainCount}). Updating toast.`);
         toast.loading(`Training in progress... ${countsData.trainedCount}/${expectedTrainCount} labeled. This may take several minutes.`, { id: TRAINING_TOAST_ID });
      }
    }
  // Add dependencies for the effect
  }, [countsData, countsError, isTrainingInBackground, expectedTrainCount]); 

  // === Callback Functions ===
  const handleDateRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingDateRange(prev => ({ ...prev, [name]: value }));
  }, []);

  const applyDateFilter = useCallback(() => {
    console.log("[Hook] Applying date filter:", pendingDateRange);
    setIsApplyingDates(true);
    setDateRange(pendingDateRange); // This triggers the transaction and counts queries via their queryKey
  }, [pendingDateRange]);

  const startBackgroundTraining = useCallback((expectedCount: number) => {
      console.log(`[Hook] Starting background training. Expecting ${expectedCount} trained.`);
      setExpectedTrainCount(expectedCount);
      setIsTrainingInBackground(true);
      toast.loading(`Starting training for ${expectedCount} reviewed transactions...`, { id: TRAINING_TOAST_ID });
  }, []);

  const stopBackgroundTraining = useCallback(() => {
    console.log("[Hook] Manually stopping background training polling.");
    setIsTrainingInBackground(false);
    setExpectedTrainCount(0);
    toast.dismiss(TRAINING_TOAST_ID);
  }, []);

  // === Return Values ===
  return {
    dateRange,
    pendingDateRange,
    statusFilter,
    isApplyingDates,
    isTrainingInBackground,
    transactions,
    isLoadingTransactions,
    transactionError,
    countsData,
    isLoadingCounts,
    countsError,
    categories,
    isLoadingCategories,
    categoriesError,
    lastTrainedTimestamp,
    isLoadingTimestamp,
    timestampError,
    handleDateRangeChange,
    applyDateFilter,
    setStatusFilter,
    startBackgroundTraining,
    stopBackgroundTraining,
  };
} 