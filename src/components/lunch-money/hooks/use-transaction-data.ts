import { useState, useEffect, useCallback } from 'react';
import { eachDayOfInterval, subMonths, format, parse } from 'date-fns';
import { Transaction, DateRange } from '../types';
import { useToast } from './use-toast';
import { useApi } from './use-api';
import { useFetch } from './use-api-hook';

// Date filter state
export interface DateFilterState {
  startDate: string;
  endDate: string;
  isPreviousMonth: boolean;
  isCurrentMonth: boolean;
  isCustomRange: boolean;
}

export function useTransactionData() {
  const { showError } = useToast();
  const { fetchTransactions, fetchCategories } = useApi();
  
  // Date range state
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() => {
    const today = new Date();
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      startDate: format(firstDayCurrentMonth, 'yyyy-MM-dd'),
      endDate: format(lastDayCurrentMonth, 'yyyy-MM-dd'),
      isPreviousMonth: false,
      isCurrentMonth: true,
      isCustomRange: false
    };
  });
  
  // Data state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Status tracking
  const [initialized, setInitialized] = useState(false);
  
  // Filtering and sorting logic
  
  // Set the date range to the previous month
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
  
  // Set the date range to the current month
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
  
  // Set a custom date range
  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    setDateFilter({
      startDate,
      endDate,
      isPreviousMonth: false,
      isCurrentMonth: false,
      isCustomRange: true
    });
  }, []);
  
  // Get all available dates in the current date range
  const getDatesInRange = useCallback((): string[] => {
    try {
      const start = parse(dateFilter.startDate, 'yyyy-MM-dd', new Date());
      const end = parse(dateFilter.endDate, 'yyyy-MM-dd', new Date());
      
      return eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
    } catch (error) {
      return [];
    }
  }, [dateFilter.startDate, dateFilter.endDate]);
  
  // Filter transactions based on search term, category, etc.
  const filterTransactions = useCallback(() => {
    // Start with all transactions
    let filtered = [...allTransactions];
    
    // Filter by category if not 'all'
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tx => {
        if (categoryFilter === 'none') {
          return !tx.originalData?.category_id;
        }
        return tx.originalData?.category_id === categoryFilter;
      });
    }
    
    // Filter by search term if not empty
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(term) ||
        (tx.notes && tx.notes.toLowerCase().includes(term))
      );
    }
    
    // Sort the filtered transactions
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
  
  // Update a transaction in the local state
  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setAllTransactions(prev => 
      prev.map(tx => 
        tx.lunchMoneyId === updatedTransaction.lunchMoneyId ? updatedTransaction : tx
      )
    );
  }, []);
  
  // Update multiple transactions in the local state
  const updateTransactions = useCallback((updatedTransactions: Transaction[]) => {
    if (!updatedTransactions.length) return;
    
    setAllTransactions(prev => {
      // Create a map of updated transactions for easier lookup
      const updatedMap = new Map<string, Transaction>();
      updatedTransactions.forEach(tx => {
        if (tx.lunchMoneyId) {
          updatedMap.set(tx.lunchMoneyId, tx);
        }
      });
      
      // Replace existing transactions with updated ones
      return prev.map(tx => 
        tx.lunchMoneyId && updatedMap.has(tx.lunchMoneyId) 
          ? updatedMap.get(tx.lunchMoneyId)! 
          : tx
      );
    });
  }, []);
  
  // Fetch transactions from API based on date range
  const loadTransactionsForDateRange = useCallback(async () => {
    try {
      const { startDate, endDate } = dateFilter;
      const response = await fetchTransactions({ startDate, endDate });
      
      if (response.isError || !response.data) {
        const errorMsg = response.error || 'Failed to fetch transactions';
        showError(errorMsg);
        return;
      }
      
      const { transactions } = response.data;
      
      // Process transactions to ensure consistent format
      const processedTransactions = transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        tags: Array.isArray(tx.tags) ? tx.tags : []
      }));
      
      setAllTransactions(processedTransactions);
      setInitialized(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch transactions';
      showError(errorMsg);
    }
  }, [dateFilter, fetchTransactions, showError]);
  
  // Load categories data
  const { data: categoriesData } = useFetch<{ categories: any[] }>(
    'lunch-money/categories',
    {
      onError: (error) => {
        showError(`Failed to load categories: ${error}`);
      }
    }
  );
  
  // Update categories when data changes
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData]);
  
  // Load transactions when date filter changes
  useEffect(() => {
    loadTransactionsForDateRange();
  }, [loadTransactionsForDateRange]);
  
  // Apply filters whenever dependencies change
  useEffect(() => {
    filterTransactions();
  }, [filterTransactions, allTransactions, categoryFilter, searchTerm, sortField, sortDirection]);
  
  return {
    // Data
    transactions: filteredTransactions,
    allTransactions,
    categories,
    
    // Date filters
    dateFilter,
    setPreviousMonth,
    setCurrentMonth,
    setCustomDateRange,
    getDatesInRange,
    
    // Other filters
    categoryFilter,
    setCategoryFilter,
    searchTerm,
    setSearchTerm,
    
    // Sorting
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    
    // Data operations
    updateTransaction,
    updateTransactions,
    loadTransactionsForDateRange,
    
    // Status
    initialized
  };
} 