import { useState, useEffect, useCallback, useMemo } from 'react';
import { eachDayOfInterval, subMonths, format, parse } from 'date-fns';
import { Transaction, DateRange, Category } from '../types';
import { useToast } from './use-toast';
import { useQuery, QueryKey, useQueryClient } from '@tanstack/react-query';

// Define type for status filter
type StatusFilter = 'cleared' | 'uncleared';

// Date filter state
export interface DateFilterState {
  startDate: string;
  endDate: string;
  isPreviousMonth: boolean;
  isCurrentMonth: boolean;
  isCustomRange: boolean;
}

// Define QueryKey type if needed for clarity, or use inline
type TransactionQueryKey = [string, string, string, StatusFilter];

// Type for the counts API response (adjust as needed)
interface TransactionCounts {
  clearedCount: number;
  unclearedCount: number;
  trainedCount: number;
}

export function useTransactionData() {
  const { showError } = useToast();
  const queryClient = useQueryClient(); // Get client instance if needed later for invalidation/updates
  
  // === State Management ===
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    
    return {
      startDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      isPreviousMonth: false,
      isCurrentMonth: false,
      isCustomRange: true
    };
  });
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('uncleared');
  
  // Client-side filtering/sorting state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // === TanStack Query for Transactions ===
  const transactionQueryKey: TransactionQueryKey = ['lunchMoneyTransactions', dateFilter.startDate, dateFilter.endDate, statusFilter];

  const fetchLunchMoneyTransactions = async ({ queryKey }: { queryKey: QueryKey }): Promise<{ transactions: Transaction[] }> => {
    const [, startDate, endDate, status] = queryKey as TransactionQueryKey; 
    console.log(`[QueryFn] Fetching transactions: ${startDate} to ${endDate}, status: ${status}`);
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate, status });
    const response = await fetch(`/api/lunch-money/transactions?${params}`);
    if (!response.ok) {
      let errorMsg = `Failed to fetch transactions (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) { /* Ignore JSON parsing error */ }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.transactions)) {
      throw new Error('Invalid transaction data format received');
    }
    const processedTransactions = data.transactions.map((tx: any) => ({
      ...tx,
      id: tx.id?.toString() || `generated-${Math.random()}`,
      lunchMoneyId: tx.lunchMoneyId?.toString() || tx.id?.toString() || `generated-${Math.random()}`,
      amount: Number(tx.amount || 0),
      tags: Array.isArray(tx.tags) ? tx.tags : [],
      date: tx.date || new Date().toISOString(), 
      description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : (tx.description || ''),
      originalData: tx.originalData ? { 
          ...tx.originalData,
          id: tx.originalData.id?.toString(),
          lunch_money_id: tx.originalData.lunch_money_id?.toString(),
          category_id: tx.originalData.category_id?.toString(),
       } : null,
       is_income: tx.is_income ?? false,
       category: tx.category ?? null,
       predictedCategory: tx.predictedCategory ?? null,
       notes: tx.notes ?? null,
       status: tx.status ?? 'uncleared',
       lunchMoneyCategory: tx.originalData?.category_name ?? null,
    }));
    return { transactions: processedTransactions };
  };

  const {
    data: rawTransactionsData,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions
  } = useQuery<
    { transactions: Transaction[] },
    Error
  >({
    queryKey: transactionQueryKey,
    queryFn: fetchLunchMoneyTransactions,
    enabled: !!dateFilter.startDate && !!dateFilter.endDate,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Handle error side-effect (toast) using useEffect
  useEffect(() => {
    if (isErrorTransactions && errorTransactions) {
      console.error("[useEffect based on useQuery error] Error fetching transactions:", errorTransactions);
      showError(errorTransactions.message);
    }
  }, [isErrorTransactions, errorTransactions, showError]);

  // Use memoized processed transactions from query data
  const allTransactions = useMemo(() => rawTransactionsData?.transactions || [], [rawTransactionsData]);

  // === TanStack Query for Categories ===
  const categoriesQueryKey = ['lunchMoneyCategories'];

  const fetchLunchMoneyCategories = async (): Promise<{ categories: Category[] }> => {
    console.log("[QueryFn] Fetching categories");
    const response = await fetch('/api/lunch-money/categories');
    if (!response.ok) {
      let errorMsg = `Failed to fetch categories (${response.status})`;
      try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* Ignore */ }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.categories)) {
      throw new Error('Invalid category data format received');
    }
    // Optional: Process categories if needed, e.g., ensure IDs are strings
    // const processedCategories = data.categories.map(cat => ({ ...cat, id: cat.id.toString() }));
    // return { categories: processedCategories };
    return data; 
  };

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: errorCategories
  } = useQuery<{ categories: Category[] }, Error>({ // useQuery for categories
    queryKey: categoriesQueryKey,
    queryFn: fetchLunchMoneyCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });

  // Handle category error side-effect
  useEffect(() => {
    if (isErrorCategories && errorCategories) {
      console.error("[useQuery] Error fetching categories:", errorCategories);
      showError(`Failed to load categories: ${errorCategories.message}`);
    }
  }, [isErrorCategories, errorCategories, showError]);

  // Use memoized categories from query data
  const categories = useMemo(() => categoriesData?.categories || [], [categoriesData]);

  // === TanStack Query for Transaction Counts ===
  const countsQueryKey = ['lunchMoneyTransactionCounts', dateFilter.startDate, dateFilter.endDate];

  const fetchLunchMoneyCounts = async ({ queryKey }: { queryKey: QueryKey }): Promise<TransactionCounts> => {
    const [, startDate, endDate] = queryKey; // Destructure key
    console.log(`[QueryFn] Fetching counts for: ${startDate} to ${endDate}`);
    if (!startDate || !endDate) throw new Error("Cannot fetch counts without start and end dates.");

    const params = new URLSearchParams({ 
      start_date: startDate as string, 
      end_date: endDate as string 
    });
    const response = await fetch(`/api/lunch-money/transaction-counts?${params}`);
    if (!response.ok) {
      let errorMsg = `Failed to fetch counts (${response.status})`;
      try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* Ignore */ }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    // Add basic type validation
    if (typeof data?.clearedCount !== 'number' || typeof data?.unclearedCount !== 'number' || typeof data?.trainedCount !== 'number') {
        throw new Error('Invalid counts data format received');
    }
    return data as TransactionCounts;
  };

  const {
    data: countsData, // Contains { clearedCount, unclearedCount, trainedCount }
    isLoading: isLoadingCounts,
    isError: isErrorCounts,
    error: errorCounts
  } = useQuery<TransactionCounts, Error>({ // UseQuery for counts
    queryKey: countsQueryKey,
    queryFn: fetchLunchMoneyCounts,
    enabled: !!dateFilter.startDate && !!dateFilter.endDate, // Enable only when dates are valid
    staleTime: 1000 * 60 * 5, // Relatively short stale time, counts might change often
    gcTime: 1000 * 60 * 15, // Moderate gc time
    refetchOnWindowFocus: true, // Counts might change based on external updates
  });

  // Handle counts error side-effect
  useEffect(() => {
    if (isErrorCounts && errorCounts) {
      console.error("[useQuery] Error fetching counts:", errorCounts);
      showError(`Failed to load counts: ${errorCounts.message}`);
      // Optionally reset counts state here if needed, though useQuery handles error state
    }
  }, [isErrorCounts, errorCounts, showError]);

  // === Client-Side Filtering/Sorting Logic (Operates on allTransactions) ===
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const filterAndSortTransactions = useCallback(() => {
    let filtered = [...allTransactions];
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tx => {
        if (categoryFilter === 'none') {
          return !tx.originalData?.category_id;
        }
        return tx.originalData?.category_id === categoryFilter;
      });
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(term) ||
        (tx.notes && tx.notes.toLowerCase().includes(term))
      );
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = a.lunchMoneyCategory?.toLowerCase() || '';
          bValue = b.lunchMoneyCategory?.toLowerCase() || '';
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }
      
      if (aValue === bValue) return 0;
      
      const result = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? result : -result;
    });

    setFilteredTransactions(filtered);
  }, [allTransactions, categoryFilter, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    filterAndSortTransactions();
  }, [filterAndSortTransactions]);

  // === Date Management Functions ===
  const setPreviousMonth = useCallback(() => {
    const today = new Date();
    const prevMonth = subMonths(today, 1);
    const firstDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    
    setDateFilter({
      startDate: format(firstDay, 'yyyy-MM-dd'),
      endDate: format(lastDay, 'yyyy-MM-dd'),
      isPreviousMonth: true,
      isCurrentMonth: false,
      isCustomRange: false
    });
  }, []);
  
  const setCurrentMonth = useCallback(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateFilter({
      startDate: format(firstDay, 'yyyy-MM-dd'),
      endDate: format(lastDay, 'yyyy-MM-dd'),
      isPreviousMonth: false,
      isCurrentMonth: true,
      isCustomRange: false
    });
  }, []);
  
  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    setDateFilter({
      startDate,
      endDate,
      isPreviousMonth: false,
      isCurrentMonth: false,
      isCustomRange: true
    });
  }, []);
  
  const getDatesInRange = useCallback((): string[] => {
    try {
      const start = parse(dateFilter.startDate, 'yyyy-MM-dd', new Date());
      const end = parse(dateFilter.endDate, 'yyyy-MM-dd', new Date());
      
      return eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
    } catch (error) {
      return [];
    }
  }, [dateFilter.startDate, dateFilter.endDate]);

  // === Local State Update Functions (Needs Refactoring for TanStack Query later) ===
  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    console.log('[useTransactionData] Invalidating transaction query due to single update trigger.');
    queryClient.invalidateQueries({ queryKey: transactionQueryKey });
  }, [queryClient, transactionQueryKey]);

  const updateTransactions = useCallback((updatedTransactions: Transaction[]) => {
    if (updatedTransactions.length === 0) return;
    console.log(`[useTransactionData] Invalidating transaction query due to multiple (${updatedTransactions.length}) update trigger.`);
    queryClient.invalidateQueries({ queryKey: transactionQueryKey });
  }, [queryClient, transactionQueryKey]);

  const getCategoryNameById = useCallback((categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized'; // Or some other default
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId; // Fallback to ID if name not found
  }, [categories]);

  return {
    transactions: filteredTransactions,
    allTransactions: allTransactions,
    isLoading: isLoadingTransactions || isLoadingCategories || isLoadingCounts,
    isError: isErrorTransactions || isErrorCategories || isErrorCounts,
    error: errorTransactions || errorCategories || errorCounts,
    categories,
    categoryFilter,
    setCategoryFilter,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    dateFilter,
    setDateFilter,
    setPreviousMonth,
    setCurrentMonth,
    setCustomDateRange,
    getDatesInRange,
    statusFilter,
    setStatusFilter,
    updateTransaction,
    updateTransactions,
    getCategoryNameById,
    counts: { 
      cleared: countsData?.clearedCount ?? 0,
      uncleared: countsData?.unclearedCount ?? 0,
      trained: countsData?.trainedCount ?? 0,
    },
    isLoadingCounts,
  };
} 