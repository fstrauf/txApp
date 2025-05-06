'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// import { useRouter } from 'next/navigation'; // Removed
import { format } from 'date-fns';
import { 
  Transaction, 
  Category, 
  DateRange, 
  ToastMessage, 
  // ImportStatus, // Removed
  OperationType 
} from './types';

// Import components (Reverted paths)
import ProgressModal from './progress-modal';
import TransactionFilters from './transaction-filters';
import CategorizationControls from './categorization-controls';
import TransactionTable from './transaction-table';
import ToastNotification from './toast-notification';
import { Switch } from '@headlessui/react'; // Import Switch

// Define type here now
type TransactionStatusFilter = 'uncleared' | 'cleared';

const EXPENSE_SORTED_TRAINED_TAG = 'expense-sorted-trained'; // Define the new tag name here as well

// Remove props from component signature
export default function TransactionList(/*{ statusFilter, setStatusFilter }: TransactionListProps*/) {
  // const router = useRouter(); // Removed
  // Add statusFilter state here
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('uncleared');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyingDates, setIsApplyingDates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth()-5, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth()-5, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  // const [importStatus, setImportStatus] = useState<ImportStatus>('idle'); // Removed
  // const [importMessage, setImportMessage] = useState(''); // Removed
  const [categories, setCategories] = useState<(string | Category)[]>([]);
  // const [editingTransaction, setEditingTransaction] = useState<string | null>(null); // Removed
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  // const categoryInputRef = useRef<HTMLSelectElement>(null); // Removed
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  // const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Removed
  const [operationInProgress, setOperationInProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<OperationType>('none');
  const [isOperationComplete, setIsOperationComplete] = useState(false); // State for modal completion button
  const [isTagging, setIsTagging] = useState(false); // State to indicate tagging phase
  
  // State for total counts (independent of filtering)
  const [totalReviewedCount, setTotalReviewedCount] = useState<number>(0);
  const [totalUnreviewedCount, setTotalUnreviewedCount] = useState<number>(0);
  const [totalTrainedCount, setTotalTrainedCount] = useState<number>(0); // Add state for trained count
  
  // Categorization workflow states
  const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Record<string, {categoryId: string | null, score: number}>>({});
  const [applyingAll, setApplyingAll] = useState<boolean>(false);
  const [applyingIndividual, setApplyingIndividual] = useState<string | null>(null);
  const [lastTrainedTimestamp, setLastTrainedTimestamp] = useState<string | null>(null);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null); // Add state for note updates
  const [isTransferringPayees, setIsTransferringPayees] = useState(false); // State for admin payee transfer

  // *** Admin Mode State ***
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [filterNoPayee, setFilterNoPayee] = useState(false);
  // *** NEW: AI Mode State ***
  const [useAiMode, setUseAiMode] = useState(false);

  // Calculate transaction stats (Only uncategorized needed now)
  const transactionStats = useMemo(() => {
    // let trainedCount = 0; // Removed - using separate state now
    let uncategorizedCount = 0;
    // let clearedCount = 0; // Removed - using separate state now
    // let unclearedCount = 0; // Removed - using separate state now

    transactions.forEach(tx => {
      // Trained tag check removed - using API count
      // const hasTrainedTag = tx.tags?.some(tag => 
      //  ...
      // );
      // if (hasTrainedTag) {
      //   trainedCount++;
      // }

      // Check if uncategorized (using originalData as the source of truth)
      const isUncategorized = !tx.originalData?.category_id;
      if (isUncategorized) {
        uncategorizedCount++;
      }

      // Cleared/Uncleared Check (based on currently filtered list) - No longer needed for stats display here
      // if (tx.originalData?.status === 'cleared') {
      //   clearedCount++;
      // } else {
      //   unclearedCount++; 
      // }
    });

    // Return only relevant counts
    // return { trainedCount, uncategorizedCount }; // Removed trained
    return { uncategorizedCount }; // Only uncategorized needed from this calculation
  }, [transactions]);

  // *** Filtered Transactions for Display ***
  const displayedTransactions = useMemo(() => {
    if (isAdminMode && filterNoPayee) {
      // Assuming the payee field to check is in originalData
      return transactions.filter(tx => tx.originalData?.payee === '[No Payee]'); 
    } 
    // Return all transactions if not filtering
    return transactions;
  }, [transactions, isAdminMode, filterNoPayee]);

  // Fetch initial data when component mounts (Categories and Timestamp only)
  useEffect(() => {
    // fetchTransactionsWithDates(dateRange, statusFilter); // Removed - Handled by the effect below
    fetchCategories();
    fetchLastTrainedTimestamp();
  }, []); // Keep dependency array empty for mount only

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // First, let's add some debug to see what IDs we're working with
  useEffect(() => {
    if (transactions.length > 0) {
      console.log("Transaction IDs in list:", transactions.map(tx => tx.lunchMoneyId));
    }
  }, [transactions]);

  // Fetch transactions when the status filter or date range changes (Handles initial load too)
  useEffect(() => {
    fetchTransactionsWithDates(dateRange, statusFilter);
    // Don't fetch counts here, use the separate effect below
  }, [statusFilter, dateRange]); 

  // *** NEW: Function to fetch total counts ***
  const fetchTotalCounts = useCallback(async (dates: DateRange) => {
    console.log("[Counts] Fetching total counts for date range:", dates);
    try {
      const params = new URLSearchParams({
        start_date: dates.startDate,
        end_date: dates.endDate,
      });
      const response = await fetch(`/api/lunch-money/transaction-counts?${params}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch counts (${response.status})`);
      }
      const data = await response.json();
      setTotalReviewedCount(data.clearedCount || 0);
      setTotalUnreviewedCount(data.unclearedCount || 0);
      setTotalTrainedCount(data.trainedCount || 0); // Set the trained count state
      console.log("[Counts] Fetched totals - Reviewed:", data.clearedCount, "Unreviewed:", data.unclearedCount);
    } catch (error) {
      console.error("[Counts] Error fetching total counts:", error);
      // Optionally show a toast or set an error state specific to counts
      // setToastMessage({ message: "Could not load transaction counts.", type: "error" });
      setTotalReviewedCount(0); // Reset on error
      setTotalUnreviewedCount(0);
      setTotalTrainedCount(0); // Reset trained count on error
    }
  }, []); // Empty dependency array initially, called manually by effect

  // *** NEW: Effect to fetch counts when dateRange changes ***
  useEffect(() => {
    fetchTotalCounts(dateRange);
  }, [dateRange, fetchTotalCounts]); // Run when dateRange changes

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/lunch-money/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch Lunch Money categories');
      }
      
      const data = await response.json();
      let categoriesList = data.categories || [];
      
      // If we don't have any categories from the API, extract from transactions
      if ((!categoriesList || categoriesList.length === 0) && transactions.length > 0) {
        console.log("Extracting categories from transactions");
        const uniqueCategories = new Map();
        
        transactions.forEach(tx => {
          // Extract from originalData which contains all the LunchMoney API data
          if (tx.originalData?.category_id && tx.originalData?.category_name) {
            uniqueCategories.set(tx.originalData.category_id.toString(), {
              id: tx.originalData.category_id.toString(),
              name: tx.originalData.category_name
            });
          }
        });
        
        categoriesList = Array.from(uniqueCategories.values());
        console.log("Extracted categories:", categoriesList);
      }
      
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching Lunch Money categories:', error);
      setToastMessage({
        message: 'Failed to load categories from Lunch Money',
        type: 'error'
      });
    }
  };
  
  const fetchTransactionsWithDates = async (dates: { startDate: string; endDate: string }, filter: 'uncleared' | 'cleared') => {
    setLoading(true);
    setError(null);
    
    console.log('Fetching with date range:', dates, 'Status Filter:', filter);

    try {
      const params = new URLSearchParams({
        start_date: dates.startDate,
        end_date: dates.endDate,
        // Pass the status filter to the API
        status: filter,
      });

      const response = await fetch(`/api/lunch-money/transactions?${params}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (!data.transactions || !Array.isArray(data.transactions)) {
        console.error('Invalid response format:', data);
        throw new Error('Received invalid data format from server');
      }

      console.log("data.transactions", data.transactions);
      
      // Ensure all transaction amounts are numbers and sanitize object values
      let formattedTransactions = data.transactions.map((tx: any) => {
        // Create a sanitized transaction object to prevent rendering issues
        const sanitized = {
          ...tx,
          id: tx.id || '',
          lunchMoneyId: tx.lunchMoneyId || '',
          date: tx.date || new Date().toISOString(),
          description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : (tx.description || ''),
          amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)),
          is_income: tx.is_income,
          // Ensure we use category_name from originalData for consistency
          lunchMoneyCategory: tx.originalData?.category_name || tx.lunchMoneyCategory || null,
          // Ensure predictedCategory is a string
          predictedCategory: typeof tx.predictedCategory === 'object' ? 
            tx.predictedCategory?.name || null : (tx.predictedCategory || null),
          // Ensure tags is an array of objects with name/id properties
          tags: Array.isArray(tx.tags) ? tx.tags.map((tag: any) => 
            typeof tag === 'object' ? tag : { name: tag, id: `tag-${Date.now()}-${Math.random()}` } // Ensure objects
          ) : []
        };
        return sanitized;
      });

      console.log("formattedTransactions", formattedTransactions);
      
      // Sort transactions by date in descending order (newest first)
      formattedTransactions = formattedTransactions.sort((a: Transaction, b: Transaction) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTransactions(formattedTransactions);
      
      // Clear any previous selections when new transactions are loaded
      setSelectedTransactions([]);
      
      // Remove category fetching from here - categories are fetched on mount
      // await fetchCategories(); 

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching transactions');
    } finally {
      setLoading(false);
      setIsApplyingDates(false);
    }
  };

  // Memoize handleSelectTransaction
  const handleSelectTransaction = useCallback((txId: string) => {
    if (!txId) {
      console.error("Attempted to select a transaction with no ID");
      return;
    }
    
    console.log('Toggling selection for transaction:', txId);
    
    setSelectedTransactions(prev => {
      if (prev.includes(txId)) {
        return prev.filter(id => id !== txId);
      } else {
        return [...prev, txId];
      }
    });
  }, []); // No dependencies needed if it only uses setSelectedTransactions

  // Memoize handleSelectAll
  const handleSelectAll = useCallback(() => {
    // Use the main transactions state, as filtering is done server-side
    if (transactions.length === 0) return; 
    
    console.log('Current transactions count:', transactions.length);
    console.log('Current selections count:', selectedTransactions.length);
    
    // Get IDs from the main transactions list
    const currentTransactionIds = transactions
      .map(tx => tx.lunchMoneyId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    const allCurrentSelected = currentTransactionIds.every(id => selectedTransactions.includes(id));
    
    if (allCurrentSelected && selectedTransactions.length > 0) {
      console.log('Deselecting all current transactions');
      setSelectedTransactions(prev => 
        prev.filter(id => !currentTransactionIds.includes(id))
      );
    } else {
      console.log('Selecting all current transactions');
      setSelectedTransactions(prev => {
        const newSelection = [...prev];
        currentTransactionIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  }, [transactions, selectedTransactions]); // Dependencies are transactions and selectedTransactions

  // Memoize handleCancelSinglePrediction (Moved BEFORE handleCategoryChange)
  const cancelSinglePrediction = useCallback((transactionId: string) => {
    console.log(`Cancelling prediction for transaction ${transactionId}`);
    setPendingCategoryUpdates(prev => {
      const { [transactionId]: _, ...rest } = prev; // Destructure to remove the key
      return rest;
    });
    // Optionally, clear any specific visual success state for this item if needed
    setSuccessfulUpdates(prev => {
      const { [transactionId]: _, ...rest } = prev;
      return rest;
    });
    setToastMessage({ message: 'Prediction discarded for this transaction.', type: 'info' });
  }, [setPendingCategoryUpdates, setSuccessfulUpdates, setToastMessage]); // Add dependencies
  
  // Memoize handleCategoryChange (Moved AFTER cancelSinglePrediction)
  const handleCategoryChange = useCallback(async (transactionId: string, categoryValue: string) => {
    setUpdatingCategory(transactionId);
    
    const transaction = transactions.find(tx => tx.lunchMoneyId === transactionId);
    if (!transaction) {
      setUpdatingCategory(null);
      console.error("Transaction not found for update:", transactionId);
      return;
    }
    
    // --- Optimistic Update --- 
    // Store the original state in case of failure
    const originalTransaction = { ...transaction };
    
    // Get the category name for the optimistic update
    let optimisticCategoryName = categoryValue;
    const selectedCategoryObj = categories.find(cat => typeof cat !== 'string' && cat.id === categoryValue);
    if (selectedCategoryObj && typeof selectedCategoryObj !== 'string') {
      optimisticCategoryName = selectedCategoryObj.name;
    }
    
    // Update local state IMMEDIATELY
    setTransactions(prev => 
      prev.map(tx => { 
        if (tx.lunchMoneyId === transactionId) {
          return {
            ...tx,
            category: categoryValue === "none" ? null : categoryValue,
            lunchMoneyCategory: categoryValue === "none" ? null : optimisticCategoryName,
            // Assume it will be cleared, update originalData optimistically too?
            originalData: {
              ...tx.originalData,
              category_id: categoryValue === "none" ? null : categoryValue,
              category_name: categoryValue === "none" ? null : optimisticCategoryName,
              status: 'cleared' // Optimistically assume it clears
            },
            status: 'cleared' // Optimistically assume it clears
          };
        }
        return tx;
      })
    );
    // --- End Optimistic Update ---
    
    try {
      const txTags = transaction.tags || [];
      let hasTrainedTag = false;
      const filteredTags = txTags.filter(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const isTrainedTag = tagName && tagName.toLowerCase() === 'expense-sorted-trained';
        if (isTrainedTag) hasTrainedTag = true;
        return !isTrainedTag;
      });
      
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryValue,
          tags: filteredTags, 
          status: 'cleared'
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      // We still need to update the tags locally if they changed
      // (or refetch, but let's update locally for now)
      setTransactions(prev => 
        prev.map(tx => { 
          if (tx.lunchMoneyId === transactionId) {
            return {
              ...tx, // Keep the optimistically set category/status
              // Update ONLY the tags based on the *actual* API response
              tags: responseData.updatedTags?.map((tag: any) => 
                typeof tag === 'string' ? { name: tag, id: `tag-${Date.now()}-${Math.random()}` } : tag
              ) || filteredTags, 
            };
          }
          return tx;
        })
      );
      
      setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: true }));
      setTimeout(() => setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: false })), 3000);
      
      setToastMessage({ message: responseData.message || 'Category updated and tagged.', type: 'success' });
      
      // If manually changing category, cancel any pending prediction for this item
      if (pendingCategoryUpdates[transactionId]) {
        cancelSinglePrediction(transactionId); 
      }

    } catch (error) {
      console.error('Error updating category:', error);
      // --- Revert Optimistic Update on Error --- 
      setTransactions(prev => 
        prev.map(tx => 
          tx.lunchMoneyId === transactionId ? originalTransaction : tx
        )
      );
      // --- End Revert ---
      
      setError(error instanceof Error ? error.message : 'Failed to update category');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to update category', type: 'error' });
    } finally {
      setUpdatingCategory(null);
    }
  }, [transactions, categories, cancelSinglePrediction, pendingCategoryUpdates, setTransactions, setSuccessfulUpdates, setToastMessage, setError, setUpdatingCategory]); // Added all dependencies

  // Add the missing handler function
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingDateRange(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Re-add memoized applyDateFilter function
  const applyDateFilter = useCallback(() => {
    console.log("Applying date filter with:", pendingDateRange);
    setIsApplyingDates(true); // Set loading state for button
    setDateRange(pendingDateRange); // Update main dateRange to trigger fetch effect
  }, [pendingDateRange]); // Dependency on pendingDateRange

  // Memoize tagTransactionsAsTrained (Robust Filtering + Batching)
  const tagTransactionsAsTrained = useCallback(async (transactionsToPotentiallyTag: Transaction[]) => {
    if (!transactionsToPotentiallyTag.length) {
      console.log("[Tagging] No transaction objects provided.");
      return { successCount: 0, failCount: 0 };
    }
    console.log("[Tagging] Received transaction objects for potential tagging:", transactionsToPotentiallyTag);

    // 1. Filter based on current state BEFORE starting any API calls
    const filteredTransactionsForTagging = transactionsToPotentiallyTag.filter(tx => {
      if (!tx) {
        console.warn(`[Tagging] Filter: Received an undefined transaction object. Skipping.`); // Should ideally not happen
        return false; 
      }
      const txTags = tx.tags || [];
      const hasTrainedTag = txTags.some(tag => 
        (typeof tag === 'string' && tag.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG) || 
        (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG)
      );
      if (hasTrainedTag) {
        // This is not an error, just info
        // console.log(`[Tagging] Filter: Transaction ${txId} already has the tag.`); 
      }
      return !hasTrainedTag; // Keep only those needing the tag
    });

    // Extract the IDs from the filtered transactions
    const transactionsToTagIds = filteredTransactionsForTagging.map(tx => tx.lunchMoneyId).filter(id => !!id);
    console.log(`[Tagging] After filtering: ${transactionsToTagIds.length} transactions actually need tagging.`, transactionsToTagIds);

    if (transactionsToTagIds.length === 0) {
      console.log(`[Tagging] No transactions require tagging.`);
      return { successCount: 0, failCount: 0 }; 
    }

    // 2. Process the filtered list in batches
    try {
      const batchSize = 10; // Adjust batch size if needed
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = [];
      
      console.log(`[Tagging] Starting batch processing (Size: ${batchSize})...`);
      for (let i = 0; i < transactionsToTagIds.length; i += batchSize) {
        const batchIds = transactionsToTagIds.slice(i, i + batchSize);
        const batchNumber = i / batchSize + 1;
        console.log(`[Tagging] Preparing Batch ${batchNumber} (IDs: ${batchIds.join(', ')})`);

        // Create fetch promises for the current batch
        const batchPromises = batchIds.map(transactionId => 
          fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId,
              tags: [EXPENSE_SORTED_TRAINED_TAG] 
            }),
          }).then(async response => { 
            if (!response.ok) {
              const errorBody = await response.text().catch(() => 'Failed to read error body');
              throw new Error(`API Error ${response.status} for TxID ${transactionId}: ${errorBody}`); 
            }
            return { transactionId, responseData: await response.json() }; 
          })
        );

        // Run batch promises concurrently
        console.log(`[Tagging] Executing Batch ${batchNumber}...`);
        const startTime = Date.now();
        const batchResults = await Promise.allSettled(batchPromises);
        const endTime = Date.now();
        console.log(`[Tagging] Batch ${batchNumber} finished in ${endTime - startTime}ms.`);

        // Process results for the batch
        batchResults.forEach((result, index) => {
          const transactionId = batchIds[index]; 
          if (result.status === 'fulfilled') {
            // console.log(`[Tagging] Batch Result: OK for ${transactionId}`);
            successCount++;
            successfulTxIds.push(transactionId);
          } else {
            console.error(`[Tagging] Batch Result: FAIL for ${transactionId}. Reason:`, result.reason?.message || result.reason);
            failCount++;
          }
        });
        
        // Optional delay between batches if rate limiting is still an issue
        // if (i + batchSize < transactionsToTag.length) {
        //   console.log(`[Tagging] Pausing briefly before next batch...`);
        //   await new Promise(resolve => setTimeout(resolve, 200)); 
        // }
      }
      
      // 3. Update local state after all batches
      if (successfulTxIds.length > 0) {
        console.log(`[Tagging] Updating local state for ${successfulTxIds.length} successfully tagged transactions.`);
        setTransactions(prev => 
          prev.map(tx => {
            // Check if this transaction was successfully tagged *in this run*
            if (successfulTxIds.includes(tx.lunchMoneyId)) {
              const existingTags = tx.tags || [];
              const tagToAdd = { name: EXPENSE_SORTED_TRAINED_TAG, id: `tag-${EXPENSE_SORTED_TRAINED_TAG}-${Date.now()}` };
              // Avoid adding duplicate tag object visually if somehow missed by filter
              const tagExists = existingTags.some(t => typeof t === 'object' && t.name?.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG);
              const newTags = tagExists ? existingTags : [...existingTags, tagToAdd];
              return {
                ...tx,
                tags: newTags 
              };
            }
            return tx; // Return unchanged if not successfully tagged in this run
          })
        );
      }
      
      console.log(`[Tagging] All batches completed. Overall Success: ${successCount}, Fail: ${failCount}`);
      return { successCount, failCount };

    } catch (error) {
      console.error('[Tagging] Error during batch processing loop:', error);
      return { successCount: 0, failCount: transactionsToTagIds.length }; // Use the count of IDs we attempted to tag
    }
  }, [transactions, setTransactions]); // Keep local transactions dependency for updating state

  // Memoize pollForCompletion
  const pollForCompletion = useCallback(async (predictionId: string, type: 'training' | 'categorizing'): Promise<{ status: string; message?: string }> => {
    const maxPolls = 120; 
    const pollInterval = 5000;
    let pollCount = 0;
    let result: { status: string; message?: string } = { status: 'unknown', message: 'Maximum polling attempts reached' };

    const poll = async (): Promise<void> => { // Mark inner poll as returning void
      if (pollCount >= maxPolls) {
        // Update result but don't return it here
        result = { status: 'timeout', message: 'Maximum polling attempts reached' };
        return; // Exit the recursive call
      }
      pollCount++;

      // Update progress message during polling (optional)
      setProgressMessage(`${type === 'training' ? 'Training' : 'Categorizing'} in progress... (Attempt ${pollCount}/${maxPolls})`);
      // Update percentage slightly to show activity (optional)
      setProgressPercent(prev => Math.min(95, prev + 5)); 

      try {
        const response = await fetch('/api/classify/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ predictionId, type }),
        });

        if (!response.ok) {
          // If polling fails, wait and retry
          console.error(`Polling failed (Attempt ${pollCount}): Status ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          await poll(); // Retry
          return;
        }

        const data = await response.json();
        if (data.status === 'completed') {
          result = { status: 'completed', message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!` };
          // Don't set operationInProgress false here
          return; // Exit the recursive call
        } else if (data.status === 'in-progress' || data.status === 'pending') {
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          await poll();
          return;
        } else {
          // Handle unexpected status (e.g., 'failed')
          console.error(`Polling received unexpected status: ${data.status}`);
          result = { status: data.status || 'failed', message: `Polling failed with status: ${data.status}` };
          return; // Exit the recursive call
        }
      } catch (error) {
        console.error(`Error during polling (Attempt ${pollCount}):`, error);
        // Wait and retry on network errors etc.
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        await poll(); // Retry
        return;
      }
    };

    await poll(); // Start the polling
    
    // DO NOT set operationInProgress here
    // setOperationInProgress(false);
    // setOperationType('none');
    
    return result; // Return the final status object
  }, [setProgressMessage, setProgressPercent]); // Add dependencies for state setters used inside

  // Memoize fetchLastTrainedTimestamp
  const fetchLastTrainedTimestamp = useCallback(async () => {
    try {
      const response = await fetch('/api/classify/last-trained');
      if (!response.ok) {
        console.warn(`Failed to fetch last trained timestamp: ${response.status}`);
        setLastTrainedTimestamp(null);
        return;
      }
      const data = await response.json();
      setLastTrainedTimestamp(data.lastTrainedAt || null);
      if (data.lastTrainedAt) {
        console.log('Successfully fetched last trained timestamp:', data.lastTrainedAt);
      } else {
        console.log('No last trained timestamp found for user.');
      }
    } catch (error) {
      console.error('Error fetching last trained timestamp:', error);
      setLastTrainedTimestamp(null);
    }
  }, []); // No dependencies needed

  // Memoize updateTransactionsWithPredictions
  const updateTransactionsWithPredictions = useCallback((results: any[]) => {
    if (!results || results.length === 0) {
      console.log("No results to update transactions with");
      return;
    }
    
    console.log(`Processing ${results.length} prediction results to update transactions`);
    console.log("Raw results:", JSON.stringify(results, null, 2));
    
    // Create a mapping of transaction IDs to predicted categories and scores for easier access
    const pendingUpdates: Record<string, {categoryId: string | null, score: number}> = {}; // Allow null categoryId

    // *** Determine response type and process accordingly ***
    const isAiResponse = results[0] && results[0].transactionId !== undefined && results[0].suggestedCategory !== undefined;
    
    if (isAiResponse) {
      console.log("Detected AI response format (transactionId, suggestedCategory).");
      results.forEach(result => {
        const { transactionId, suggestedCategory } = result;
        if (!transactionId) return; // Skip if somehow missing ID

        let categoryId: string | null = null;
        if (suggestedCategory && suggestedCategory !== "Needs Review") {
           const categoryObj = categories.find(cat => 
              typeof cat !== 'string' && 
              cat.name.toLowerCase() === suggestedCategory.toLowerCase()
           );
           categoryId = categoryObj && typeof categoryObj !== 'string' 
             ? categoryObj.id 
             : suggestedCategory; // Fallback to name if ID not found (should ideally not happen)
        } // If "Needs Review" or null/empty, categoryId remains null
        
        pendingUpdates[transactionId] = {
          categoryId, 
          score: 0 // AI doesn't provide score
        };
      });
    } else {
      // --- Existing logic for the old endpoint --- 
      console.log("Using legacy response format processing (narrative, predicted_category).");
      // Create a new map for categorized transactions
      const newCategorizedTransactions = new Map();
      
      // Process results and build prediction map
      results.forEach((result, index) => {
        const narrative = result.narrative || result.Narrative || result.description || '';
        let predictedCategory = result.predicted_category || result.category || result.Category || '';
        const similarityScore = result.similarity_score || result.score || 0;
        
        if (!predictedCategory || predictedCategory.toLowerCase() === 'none') {
          predictedCategory = 'Needs Review'; // Use consistent marker
        }
        
        if (narrative) { // Only map if we have a narrative/description to match on
          newCategorizedTransactions.set(narrative, {
            category: predictedCategory,
            score: similarityScore
          });
        } else {
          console.log(`Legacy Result ${index+1} is missing narrative/description:`, result);
        }
      });
      
      console.log("Built legacy categorization map with", newCategorizedTransactions.size, "entries");

      // Map the predictions to transaction IDs based on description
      selectedTransactions.forEach(txId => {
        const tx = transactions.find(t => t.lunchMoneyId === txId);
        if (tx && tx.description) {
          const prediction = newCategorizedTransactions.get(tx.description);
          
          if (prediction) {
            let categoryId: string | null = null;
            if (prediction.category !== 'Needs Review') {
              const categoryObj = categories.find(cat => 
                typeof cat !== 'string' && 
                cat.name.toLowerCase() === prediction.category.toLowerCase()
              );
              categoryId = categoryObj && typeof categoryObj !== 'string' 
                ? categoryObj.id 
                : prediction.category; // Fallback
            }
            pendingUpdates[txId] = { categoryId, score: prediction.score };
          } else {
            console.log(`No legacy prediction found for txId ${txId} with description "${tx.description}". Marking for review.`);
            pendingUpdates[txId] = { categoryId: null, score: 0 };
          }
        } else {
           console.warn(`Selected transaction ${txId} not found or has no description for legacy matching.`);
           // Optionally mark for review if the tx was selected but couldn't be matched
           // pendingUpdates[txId] = { categoryId: null, score: 0 }; 
        }
      });
      // --- End Existing logic --- 
    }
    
    // Clear any previous pending updates before setting new ones
    setPendingCategoryUpdates({});
    
    // Store the newly generated pending updates
    setPendingCategoryUpdates(pendingUpdates);
    
    console.log("Prepared", Object.keys(pendingUpdates).length, "pending category updates");
    
    // Show a success toast
    setToastMessage({
      message: `Generated ${Object.keys(pendingUpdates).length} category suggestions. Review and apply.`, 
      type: 'success'
    });
    // Remove dependency on selectedTransactions for AI path
  }, [transactions, categories]); // Simplified dependencies

  // Memoize handleTrainSelected
  const handleTrainSelected = useCallback(async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({ message: "Please select at least one transaction for training", type: "error" });
      return;
    }

    if (selectedTransactions.length < 10) {
      setToastMessage({ message: "Please select at least 10 transactions for training (API requirement)", type: "error" });
      return;
    }

    setOperationInProgress(true);
    setOperationType('training');
    setProgressPercent(0);
    setProgressMessage('Preparing training data...');

    try {
      const trainingData = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId))
        .map(tx => {
          // Use category_id from originalData
          const categoryId = tx.originalData?.category_id?.toString() || null; // Get the numeric ID as string or null
          if (!categoryId) {
            console.warn(`Transaction ${tx.lunchMoneyId} is missing a category ID. Skipping for training or using fallback.`);
            // Decide: return null and filter out, or send a default like '0' or null
            // For now, let's send null if uncategorized, the backend needs to handle this.
          }
          return {
            description: tx.description,
            // Use Category (capital C) to match backend model
            Category: categoryId, // Send the numeric ID (or null)
            money_in: tx.is_income, 
            amount: tx.amount 
          };
        })
        // Optional: Filter out transactions without a category ID if the backend cannot handle null
        // .filter(item => item.categoryId !== null); 
      
      if (trainingData.length === 0) throw new Error('No valid transactions with category IDs selected for training');

      // Ensure payload structure matches expected backend (check if backend expects 'categoryId')
      const payload = {
        transactions: trainingData, // Contains description, categoryId, money_in, amount
        // Assuming backend might expect these, adjust if necessary
        expenseSheetId: 'lunchmoney', 
        spreadsheetId: 'lunchmoney' 
      };

      setProgressPercent(10);
      setProgressMessage('Sending training request...');

      // Make sure the backend API '/api/classify/train' forwards this payload,
      // and the *external* Flask service expects 'categoryId'
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // === START 403 HANDLING ===
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
        console.error('Training failed due to inactive subscription:', errorData);
        setToastMessage({ message: errorData.error || 'Training failed: Subscription inactive or trial expired.', type: 'error' });
        setError(errorData.error || 'Subscription inactive or trial expired.');
        setOperationInProgress(false);
        setOperationType('none');
        setProgressPercent(0); // Reset progress
        setProgressMessage('');
        return; // Stop further processing
      }
      // === END 403 HANDLING ===

      // --- MODIFIED RESPONSE HANDLING FOR TRAINING --- 
      let pollResult: { status: string; message?: string } = { status: 'unknown', message: 'Polling did not complete' }; 
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous training results:", syncResult);

        if (syncResult.status === 'completed') {
          // --- Simplified Flow --- 
          // 1. Show immediate success in modal
          setProgressMessage('Training completed successfully!');
          setProgressPercent(100);
          setIsOperationComplete(true); // Show Close button now
          setIsTagging(false); // Ensure tagging state is off for modal visuals

          // *** ADD PRE-FILTER LOGGING HERE ***
          console.log("[handleTrainSelected] Preparing for background tagging...");
          // Get the full transaction objects for tagging
          const selectedTxObjectsForTagging = transactions.filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
          // Log details of first few selected transactions before filtering
          if (selectedTxObjectsForTagging.length > 0) {
            console.log(`[handleTrainSelected] Checking tags for ${selectedTxObjectsForTagging.length} selected transactions. Sample:`);
            selectedTxObjectsForTagging.slice(0, 3).forEach(tx => {
              console.log(` - ID: ${tx.lunchMoneyId}, Tags:`, tx?.tags);
            });
          }
          // *** END PRE-FILTER LOGGING ***

          // 2. Perform tagging in background (fire and forget style, but handle result with toast)
          tagTransactionsAsTrained(selectedTxObjectsForTagging).then(tagResult => {
            // This runs after tagging attempt finishes
            fetchLastTrainedTimestamp(); // Update timestamp
            fetchTotalCounts(dateRange); // <<< ADD THIS LINE
            setToastMessage({ 
              message: `Tagging complete: ${tagResult?.successCount || 0} updated${(tagResult?.failCount || 0) > 0 ? `, ${tagResult?.failCount} failed` : ''}.`,
              type: (tagResult?.failCount) > 0 ? 'error' : 'success' 
            });
            // Clear selection *after* toast related to tagging
            setSelectedTransactions([]); 
          }).catch(taggingError => {
            // Handle potential errors from the tagging promise itself
            console.error("[Tagging] Error after training completion:", taggingError);
            setToastMessage({ message: 'Error occurred during background tagging.', type: 'error' });
            setSelectedTransactions([]); // Still clear selection
          });
          
          // Return success for the training operation itself
          return { status: 'completed' }; 
        } else {
          // Handle unexpected 200 response format
          setIsOperationComplete(true); // Allow closing modal even on error
          throw new Error('Received unexpected success response format from server during training.');
        }
      } else if (response.status === 202) {
        // Asynchronous Processing Started
        const asyncResult = await response.json();
        console.log("Received asynchronous training start response:", asyncResult);
        const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
        if (predictionId) {
          localStorage.setItem('training_prediction_id', predictionId);
          // Set progress message before polling
          setProgressMessage('Training started, waiting for results...');
          setProgressPercent(10); // Show some initial progress
          pollResult = await pollForCompletion(predictionId, 'training');
          // NO state changes here yet, handled below based on pollResult
        } else {
          throw new Error('Server started training but did not return a prediction ID.');
        }
      } else {
        // Handle other errors (4xx, 5xx)
        const result = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(result.error || `Training request failed with status ${response.status}`);
      }
      // --- END MODIFIED RESPONSE HANDLING ---
      
      // --- Handle tagging AFTER successful polling (Simplified) --- 
      if (pollResult.status === 'completed') {
        // 1. Show immediate success in modal
        setProgressMessage('Training completed successfully!'); // Final message
        setProgressPercent(100);
        setIsOperationComplete(true); // Show Close button now
        setIsTagging(false); // Ensure tagging state is off for modal visuals
        
        // *** ADD PRE-FILTER LOGGING HERE (Polling Path) ***
        console.log("[handleTrainSelected - Polling Path] Preparing for background tagging...");
        // Get the full transaction objects for tagging
        const selectedTxObjectsForTagging = transactions.filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
        if (selectedTxObjectsForTagging.length > 0) {
            console.log(`[handleTrainSelected - Polling Path] Checking tags for ${selectedTxObjectsForTagging.length} selected transactions. Sample:`);
            selectedTxObjectsForTagging.slice(0, 3).forEach(tx => {
              console.log(` - ID: ${tx.lunchMoneyId}, Tags:`, tx?.tags);
            });
        }
        // *** END PRE-FILTER LOGGING ***

        // 2. Perform tagging in background
        tagTransactionsAsTrained(selectedTxObjectsForTagging).then(tagResult => {
          fetchLastTrainedTimestamp(); 
          fetchTotalCounts(dateRange); // <<< ADD THIS LINE
          setToastMessage({ 
            message: `Tagging complete: ${tagResult?.successCount || 0} updated${(tagResult?.failCount || 0) > 0 ? `, ${tagResult?.failCount} failed` : ''}.`,
            type: (tagResult?.successCount || 0) > 0 ? 'success' : 'info' 
          });
          setSelectedTransactions([]); // Clear selection after toast
        }).catch(taggingError => {
            console.error("[Tagging] Error after training completion (polling):", taggingError);
            setToastMessage({ message: 'Error occurred during background tagging.', type: 'error' });
            setSelectedTransactions([]); // Still clear selection
        });
      } else {
        // Handle polling failure/timeout
        setToastMessage({ message: pollResult?.message || 'Training polling failed or timed out.', type: 'error' });
        setIsOperationComplete(true); // Allow closing modal even on failure
      }
      // --- End simplified tagging handling ---

    } catch (error) {
      console.error('Error starting training:', error);
      setError(error instanceof Error ? error.message : 'Failed to start training');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to start training', type: 'error' });
      setOperationInProgress(false);
      setOperationType('none');
    }
  }, [selectedTransactions, transactions, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp, fetchTotalCounts, dateRange]); // Add fetchTotalCounts and dateRange dependencies

  // Memoize handleCategorizeSelected
  const handleCategorizeSelected = useCallback(async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({ message: 'Please select transactions to categorize', type: 'warning' });
      return;
    }

    // Filter out transactions that already have pending updates
    const transactionsToCategorize = selectedTransactions.filter(
      txId => !pendingCategoryUpdates[txId]
    );

    if (transactionsToCategorize.length === 0) {
      setToastMessage({ 
        message: 'All selected transactions already have pending category suggestions.', 
        type: 'info' 
      });
      return;
    }

    setOperationInProgress(true);
    setOperationType('categorizing');
    setProgressMessage('Starting categorization...');
    setProgressPercent(0);
    setError(null); // Clear previous errors
    // Clear existing pending updates for newly selected items
    setPendingCategoryUpdates(prev => {
      const newPending = { ...prev };
      transactionsToCategorize.forEach(txId => {
        delete newPending[txId]; // Remove any old pending state if re-categorizing
      });
      return newPending;
    });

    try {
      console.log("Sending transactions for categorization:", transactionsToCategorize);

      // Find the full transaction objects for the selected IDs
      const selectedTxObjects = transactions.filter(tx => 
        transactionsToCategorize.includes(tx.lunchMoneyId)
      ).map(tx => ({
        description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : tx.description,
        // Send money_in status based on the transaction data
        money_in: tx.is_income,
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)),
        // *** Include LunchMoney ID for ChatGPT endpoint ***
        lunchMoneyId: tx.lunchMoneyId, 
      }));

      console.log("Payload being sent:", selectedTxObjects);

      setProgressMessage('Sending request to server...');
      
      // *** Choose endpoint based on useAiMode ***
      const endpoint = useAiMode ? '/api/classify/chatgpt' : '/api/classify/classify';
      console.log(`Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send slightly different payload structure depending on the endpoint
        body: JSON.stringify(useAiMode ? { transactionsToCategorize: selectedTxObjects } : { transactions: selectedTxObjects }),
      });

      // === START 403 HANDLING ===
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
        console.error('Categorization failed due to inactive subscription:', errorData);
        setToastMessage({ message: errorData.error || 'Categorization failed: Subscription inactive or trial expired.', type: 'error' });
        setError(errorData.error || 'Subscription inactive or trial expired.');
        setOperationInProgress(false);
        setOperationType('none');
        setProgressPercent(0); // Reset progress
        setProgressMessage('');
        return; // Stop further processing
      }
      // === END 403 HANDLING ===

      // --- MODIFIED RESPONSE HANDLING --- 
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous classification results:", syncResult);

        // Adjust response handling based on endpoint
        if (useAiMode) {
           // ChatGPT endpoint returns { categorizedResults: [{ transactionId: string, suggestedCategory: string }] }
           if (Array.isArray(syncResult.categorizedResults)) {
              setProgressMessage('Processing results...');
              setProgressPercent(100);
              updateTransactionsWithPredictions(syncResult.categorizedResults); // Pass the array directly
              setToastMessage({ message: 'AI categorization completed successfully!', type: 'success' });
              setOperationInProgress(false); // Close modal immediately
              setSelectedTransactions([]); // Clear selection
           } else {
              throw new Error('Received unexpected success response format from AI server.');
           }
        } else {
          // Existing endpoint returns { status: 'completed', results: [...] }
          if (syncResult.status === 'completed' && Array.isArray(syncResult.results)) {
            setProgressMessage('Processing results...');
            setProgressPercent(100);
            updateTransactionsWithPredictions(syncResult.results); // Pass results array
            setToastMessage({ message: 'Categorization completed successfully!', type: 'success' });
            setOperationInProgress(false); // Close modal immediately
            setSelectedTransactions([]); // Clear selection after successful sync categorization
          } else {
            // Handle unexpected 200 response format
            throw new Error('Received unexpected success response format from server.');
          }
        }
      } else if (response.status === 202) {
        // Asynchronous Processing Started (Assume both endpoints can be async for now)
        const asyncResult = await response.json();
        console.log("Received asynchronous start response:", asyncResult);
        if (asyncResult.prediction_id) {
          setProgressMessage('Classification started. Waiting for results...');
          setProgressPercent(10); // Initial progress
          await pollForCompletion(asyncResult.prediction_id, 'categorizing');
          // Polling function handles setting final state (progress, message, modal close)
        } else {
          throw new Error('Server started processing but did not return a prediction ID.');
        }
      } else {
        // Handle other errors (4xx, 5xx)
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error during categorization:', errorData);
        setError(errorData.error || `Request failed with status ${response.status}`);
        setToastMessage({ message: errorData.error || `Categorization failed (Status: ${response.status})`, type: 'error' });
        setOperationInProgress(false);
      }
      // --- END MODIFIED RESPONSE HANDLING ---

    } catch (error) {
      console.error('Failed to categorize transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      setToastMessage({ message: `Categorization failed: ${errorMessage}`, type: 'error' });
      setOperationInProgress(false);
      setOperationType('none');
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [selectedTransactions, pendingCategoryUpdates, transactions, pollForCompletion, updateTransactionsWithPredictions, useAiMode]); // Add useAiMode dependency

  // Memoize handleCancelCategorization
  const handleCancelCategorization = useCallback(() => {
    console.log("Cancelling pending categorization updates.");
    setPendingCategoryUpdates({});
    // Comment out removed state setter
    // setCategorizedTransactions(new Map()); 
    setToastMessage({ message: 'Discarded pending category predictions.', type: 'success' }); 
  }, []); // No dependencies needed

  // Memoize applyAllPredictedCategories
  const applyAllPredictedCategories = useCallback(async () => {
    const transactionIds = Object.keys(pendingCategoryUpdates);
    if (transactionIds.length === 0) {
      setToastMessage({
        message: "No categorizations to apply",
        type: "error"
      });
      return;
    }

    setApplyingAll(true);

    try {
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = []; // Store successful IDs
      
      for (let i = 0; i < transactionIds.length; i += batchSize) {
        const batch = transactionIds.slice(i, i + batchSize);
        
        const promises = batch.map(async (txId) => {
          const update = pendingCategoryUpdates[txId];
          
          try {
            const response = await fetch('/api/lunch-money/transactions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: txId,
                categoryId: update.categoryId === "none" ? null : update.categoryId,
                status: 'cleared'
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to update category');
            }
            
            return { success: true, txId };
          } catch (error) {
            console.error(`Error updating transaction ${txId}:`, error);
            return { success: false, txId };
          }
        });
        
        const results = await Promise.all(promises);
        
        results.forEach(result => {
          if (result.success) {
            successCount++;
            successfulTxIds.push(result.txId); // Add successful ID to the list
            
            setSuccessfulUpdates(prev => ({
              ...prev,
              [result.txId]: true
            }));
          } else {
            failCount++;
          }
        });
      }
      
      // Update local state for all successful transactions AFTER the loop
      if (successfulTxIds.length > 0) {
        setTransactions(prev => 
          prev.map(tx => {
            if (successfulTxIds.includes(tx.lunchMoneyId)) {
              const update = pendingCategoryUpdates[tx.lunchMoneyId];
              let categoryName = update.categoryId;
              const selectedCategory = categories.find(cat => 
                typeof cat !== 'string' && cat.id === update.categoryId
              );
              if (selectedCategory && typeof selectedCategory !== 'string') {
                categoryName = selectedCategory.name;
              }
              
              return {
                ...tx,
                category: update.categoryId === "none" ? null : update.categoryId,
                lunchMoneyCategory: update.categoryId === "none" ? null : categoryName,
                originalData: {
                  ...tx.originalData,
                  category_id: update.categoryId === "none" ? null : update.categoryId,
                  category_name: update.categoryId === "none" ? null : categoryName,
                  status: 'cleared'
                },
                status: 'cleared'
              };
            }
            return tx;
          })
        );
      }
      
      setPendingCategoryUpdates({});
      
      setToastMessage({
        message: `Updated ${successCount} categories${failCount > 0 ? `, ${failCount} failed` : ''}`,
        type: successCount > 0 ? 'success' : 'error'
      });
      
    } catch (error) {
      console.error('Error applying all categories:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to apply categories',
        type: 'error'
      });
    } finally {
      setApplyingAll(false);
    }
  }, [pendingCategoryUpdates, categories]); // Dependencies: pendingCategoryUpdates, categories

  // Memoize getCategoryNameById
  const getCategoryNameById = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    // Find category, ensuring it's an object before accessing .id
    const category = categories.find(cat => 
      typeof cat === 'object' && cat !== null && cat.id === categoryId
    );
    // Return name if found and is an object, otherwise return the original ID
    return (typeof category === 'object' && category !== null) ? category.name : categoryId;
  }, [categories]); // Dependency: categories

  // Memoize applyPredictedCategory
  const applyPredictedCategory = useCallback(async (transactionId: string) => {
    const update = pendingCategoryUpdates[transactionId];
    if (!update) {
      console.error(`No pending update found for transaction ${transactionId}`);
      return;
    }
    setApplyingIndividual(transactionId);

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          categoryId: update.categoryId === "none" ? null : update.categoryId,
          status: 'cleared'
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      let categoryName = update.categoryId;
      // Use the memoized version of getCategoryNameById here
      const foundCategoryName = getCategoryNameById(update.categoryId);
      if (foundCategoryName !== update.categoryId) { // Check if a name was actually found
        categoryName = foundCategoryName;
      }
      
      setTransactions(prev => 
        prev.map(tx => {
          if (tx.lunchMoneyId === transactionId) {
            return {
              ...tx,
              category: update.categoryId === "none" ? null : update.categoryId,
              lunchMoneyCategory: update.categoryId === "none" ? null : categoryName,
              originalData: {
                ...tx.originalData,
                category_id: update.categoryId === "none" ? null : update.categoryId,
                category_name: update.categoryId === "none" ? null : categoryName,
                status: 'cleared'
              },
              status: 'cleared'
            };
          }
          return tx;
        })
      );
      
      setSuccessfulUpdates(prev => ({
        ...prev,
        [transactionId]: true
      }));
      
      setPendingCategoryUpdates(prev => {
        const newUpdates = {...prev};
        delete newUpdates[transactionId];
        return newUpdates;
      });
      
      setToastMessage({
        message: 'Category updated in Lunch Money',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to update category');
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to update category', type: 'error' });
    } finally {
      setApplyingIndividual(null);
    }
    // Ensure getCategoryNameById is included in dependencies
  }, [pendingCategoryUpdates, getCategoryNameById]); 

  // Function to manually close the progress modal - now resets completion states
  const closeModal = useCallback(() => {
    setOperationInProgress(false);
    setOperationType('none');
    setProgressPercent(0);
    setProgressMessage('');
    setIsOperationComplete(false); // Reset completion flag
    setIsTagging(false); // Reset tagging flag
  }, []); // Keep dependencies empty as it only uses setters

  // *** NEW: handleTrainAllReviewed ***
  const handleTrainAllReviewed = useCallback(async () => {
    setOperationInProgress(true);
    setOperationType('training');
    setProgressPercent(0);
    setProgressMessage('Fetching all reviewed transactions...');
    setError(null);
    setIsOperationComplete(false);

    try {
      // 1. Fetch transactions over a wide date range (e.g., 5 years)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 5);
      const wideDateRange = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      };

      console.log(`[Train All] Fetching transactions from ${wideDateRange.startDate} to ${wideDateRange.endDate}`);
      
      const params = new URLSearchParams({
        start_date: wideDateRange.startDate,
        end_date: wideDateRange.endDate,
        // NO status filter - fetch all
      });
      const fetchResponse = await fetch(`/api/lunch-money/transactions?${params}`);
      if (!fetchResponse.ok) {
        const data = await fetchResponse.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch transactions (${fetchResponse.status})`);
      }
      const fetchData = await fetchResponse.json();
      if (!fetchData.transactions || !Array.isArray(fetchData.transactions)) {
        throw new Error('Received invalid transaction data format from server');
      }

      // 2. Filter for reviewed (categorized) transactions
      const reviewedTransactions = fetchData.transactions.filter((tx: any) => !!tx.originalData?.category_id);
      console.log(`[Train All] Found ${reviewedTransactions.length} transactions with categories.`);

      if (reviewedTransactions.length < 10) {
        throw new Error(`Need at least 10 reviewed (categorized) transactions for training. Found ${reviewedTransactions.length}.`);
      }
      
      // 3. Prepare training data payload
      setProgressMessage(`Preparing ${reviewedTransactions.length} transactions for training...`);
      const trainingData = reviewedTransactions.map((tx: any) => ({
        description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : (tx.description || ''),
        Category: tx.originalData?.category_id?.toString() || null,
        money_in: tx.is_income,
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0)),
      }));
      
      // *** Calculate IDs that were sent for training ***
      const idsToSend = reviewedTransactions.map((tx: any) => tx.lunchMoneyId).filter((id: string | number | undefined): id is string => !!id);
      console.log(`[Train All] Calculated ${idsToSend.length} IDs from reviewed transactions for potential tagging.`);

      const payload = { transactions: trainingData }; // Simplify payload if backend allows
      
      setProgressPercent(10);
      setProgressMessage('Sending training request (all reviewed)...');
      
      // 4. Send training request
      const trainResponse = await fetch('/api/classify/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Handle 403 Subscription Error
      if (trainResponse.status === 403) {
        const errorData = await trainResponse.json().catch(() => ({ error: 'Subscription check failed' }));
        throw new Error(errorData.error || 'Subscription inactive or trial expired.');
      }

      // 5. Handle Training Response (Sync/Async)
      let pollResult: { status: string; message?: string } = { status: 'unknown' };
      if (trainResponse.status === 200) {
        const syncResult = await trainResponse.json();
        if (syncResult.status === 'completed') {
          pollResult = { status: 'completed', message: 'Training completed successfully!' };
        } else {
          throw new Error('Received unexpected success response format during training.');
        }
      } else if (trainResponse.status === 202) {
        const asyncResult = await trainResponse.json();
        const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
        if (predictionId) {
          setProgressMessage('Training started, waiting for results...');
          setProgressPercent(10); 
          pollResult = await pollForCompletion(predictionId, 'training');
        } else {
          throw new Error('Server started training but did not return a prediction ID.');
        }
      } else {
        const result = await trainResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(result.error || `Training request failed with status ${trainResponse.status}`);
      }
      
      // 6. Update UI on Completion & Trigger Tagging
      if (pollResult.status === 'completed') {
        setProgressMessage(pollResult.message || 'Training completed successfully!');
        setProgressPercent(100);
        setIsOperationComplete(true); // Allow modal close immediately
        // No tagging state needed visually for modal

        // Trigger background tagging using the fetched reviewed transaction *objects*
        console.log(`[Train All] Training complete. Triggering background tagging for ${reviewedTransactions.length} fetched transactions...`);
        tagTransactionsAsTrained(reviewedTransactions).then(tagResult => { // Pass full objects
            fetchLastTrainedTimestamp(); // Update timestamp after tagging
            fetchTotalCounts(dateRange); // <<< ADD THIS LINE
            setToastMessage({ 
              message: `Tagging complete: ${tagResult?.successCount || 0} updated${(tagResult?.failCount || 0) > 0 ? `, ${tagResult?.failCount} failed` : ''}.`,
              type: (tagResult?.failCount ?? 0) > 0 ? 'error' : 'success' 
            });
        }).catch(taggingError => {
            console.error("[Tagging] Error after Train All completion:", taggingError);
            setToastMessage({ message: 'Error occurred during background tagging.', type: 'error' });
        });

      } else {
        throw new Error(pollResult.message || 'Training polling failed or timed out.');
      }

    } catch (error) {
      console.error('[Train All] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to train all reviewed transactions';
      setError(message);
      setToastMessage({ message, type: 'error' });
      // Ensure modal is closable on error
      setIsOperationComplete(true); 
      setProgressMessage('Training failed.'); 
    }
    // Note: operationInProgress is reset by the modal's onClose handler
  }, [pollForCompletion, fetchLastTrainedTimestamp, tagTransactionsAsTrained, transactions, fetchTotalCounts, dateRange]); // Add fetchTotalCounts and dateRange dependencies
  // *** END NEW FUNCTION ***

  // *** START NEW FUNCTION: handleNoteChange ***
  const handleNoteChange = useCallback(async (transactionId: string, newNote: string) => {
    console.log(`Attempting to save note for tx ${transactionId}: "${newNote}"`);
    setUpdatingNoteId(transactionId); // Set loading state
    setToastMessage(null); // Clear previous toasts

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          notes: newNote,
          // IMPORTANT: Do NOT include status or categoryId here!
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Throw an error to be caught below
        throw new Error(responseData.error || 'Failed to update note');
      }

      // Update local transaction state on success
      setTransactions(prev =>
        prev.map(tx =>
          tx.lunchMoneyId === transactionId ? { ...tx, notes: newNote } : tx
        )
      );

      // Show success toast
      setToastMessage({ message: 'Note updated successfully.', type: 'success' });

    } catch (error) {
      console.error(`Error saving note for tx ${transactionId}:`, error);
      const message = error instanceof Error ? error.message : 'Failed to save note';
      setError(message); // Set general error state if needed
      setToastMessage({ message, type: 'error' });
      // Re-throw the error if you want the NoteInput component to catch it too
      throw error;
    } finally {
      setUpdatingNoteId(null); // Clear loading state
    }
  }, [setTransactions, setToastMessage, setError]); // Add dependencies
  // *** END NEW FUNCTION ***

  // *** START Placeholder for Admin Function ***
  const handleTransferOriginalNames = useCallback(async () => {
    // 1. Filter selected transactions for those needing the update
    const transactionsToUpdate = transactions.filter(tx => 
      selectedTransactions.includes(tx.lunchMoneyId) &&
      tx.originalData?.payee === '[No Payee]' &&
      tx.originalData?.original_name && 
      tx.originalData.original_name.trim() !== ''
    );

    if (transactionsToUpdate.length === 0) {
      setToastMessage({ message: "No selected transactions found with payee '[No Payee]' and a valid Original Name.", type: "warning" });
      return;
    }

    console.log(`[Admin] Found ${transactionsToUpdate.length} transactions to update payee for.`);
    setIsTransferringPayees(true);
    setOperationInProgress(true); // Use general operation lock

    try {
      const batchSize = 10; // Process in batches
      let successCount = 0;
      let failCount = 0;
      const successfulTxIds: string[] = [];
      const updatedPayeesMap: Record<string, string> = {}; // Store updated payees for local update

      for (let i = 0; i < transactionsToUpdate.length; i += batchSize) {
        const batch = transactionsToUpdate.slice(i, i + batchSize);
        console.log(`[Admin] Processing batch ${i / batchSize + 1} with ${batch.length} transactions.`);

        const promises = batch.map(async (tx) => {
          const transactionId = tx.lunchMoneyId;
          const newPayee = tx.originalData.original_name; // Already checked it exists

          try {
            const response = await fetch('/api/lunch-money/transactions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: transactionId,
                payee: newPayee, // Send the new payee
                // We don't need to send status or category here
              })
            });

            const responseData = await response.json();

            if (!response.ok || responseData.error) {
              const errorMsg = responseData.error || `API Error ${response.status}`;
              console.error(`[Admin] Failed to update payee for ${transactionId}:`, errorMsg);
              throw new Error(errorMsg);
            }

            console.log(`[Admin] Successfully updated payee for ${transactionId} to "${newPayee}"`);
            return { success: true, txId: transactionId, updatedPayee: newPayee };
          } catch (error) {
            console.error(`[Admin] Network/fetch error updating payee for ${transactionId}:`, error);
            return { success: false, txId: transactionId, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });

        const results = await Promise.allSettled(promises);

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
            successfulTxIds.push(result.value.txId);
            updatedPayeesMap[result.value.txId] = result.value.updatedPayee;
          } else {
            failCount++;
            // Log detailed error if available
            if (result.status === 'fulfilled' && !result.value.success) {
              console.error(`[Admin] Update failed for TxID ${result.value.txId}: ${result.value.error}`);
            } else if (result.status === 'rejected') {
              console.error(`[Admin] Batch promise rejected:`, result.reason);
            }
          }
        });
      } // End batch loop

      // Update local state for successful transactions
      if (successfulTxIds.length > 0) {
        setTransactions(prev =>
          prev.map(tx => {
            if (updatedPayeesMap[tx.lunchMoneyId]) {
              console.log(`[Admin] Updating local state for ${tx.lunchMoneyId}`);
              return {
                ...tx,
                // Update the main description field for display
                description: updatedPayeesMap[tx.lunchMoneyId],
                // Update the originalData as well for consistency
                originalData: {
                  ...tx.originalData,
                  payee: updatedPayeesMap[tx.lunchMoneyId],
                },
              };
            }
            return tx;
          })
        );
      }

      // Show feedback toast
      if (failCount > 0) {
        setToastMessage({ message: `Payee Transfer: ${successCount} updated, ${failCount} failed. Check console for errors.`, type: "error" });
      } else {
        setToastMessage({ message: `Successfully transferred original name to payee for ${successCount} transactions.`, type: "success" });
      }

      // Optionally clear selection on success
      if (failCount === 0) {
         setSelectedTransactions(prev => prev.filter(id => !successfulTxIds.includes(id)));
      }

    } catch (error) {
      console.error('[Admin] Error during payee transfer process:', error);
      setToastMessage({ message: 'An unexpected error occurred during the payee transfer.', type: "error" });
    } finally {
      setIsTransferringPayees(false);
      setOperationInProgress(false); // Release general operation lock
    }
  }, [transactions, selectedTransactions, setTransactions, setToastMessage, setSelectedTransactions]); // Add dependencies
  // *** END Placeholder ***

  return (
    <div className="text-gray-900 text-sm bg-white min-h-screen p-4">
      {/* Toast notification */}
      <ToastNotification toastMessage={toastMessage} />

      {/* Operation Progress Modal - Pass completion state */}
      <ProgressModal
        operationInProgress={operationInProgress}
        operationType={operationType}
        progressPercent={progressPercent}
        progressMessage={progressMessage}
        isComplete={isOperationComplete} // Pass the completion state
        onClose={closeModal} // Pass the updated close function
      />

      {/* Admin Mode Toggle - Placed above filter/controls */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        <span className="text-sm font-medium text-gray-700">Admin Mode</span>
        <Switch
          checked={isAdminMode}
          onChange={setIsAdminMode}
          className={`${
            isAdminMode ? 'bg-blue-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          <span
            className={`${
              isAdminMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {/* *** NEW: AI Mode Toggle *** */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        <span className="text-sm font-medium text-gray-700">Use AI (ChatGPT)</span>
        <Switch
          checked={useAiMode}
          onChange={setUseAiMode}
          className={`${
            useAiMode ? 'bg-green-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
        >
          <span
            className={`${
              useAiMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {/* Updated wrapper for all controls - Now arranges items side-by-side */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-row items-stretch gap-6">
        
        {/* Transaction Filters Component Wrapper */}
        <div className="flex-1">
          <TransactionFilters
            pendingDateRange={pendingDateRange}
            handleDateRangeChange={handleDateRangeChange} // Pass the new handler here
            applyDateFilter={applyDateFilter}
            isApplying={isApplyingDates}
            trainedCount={totalTrainedCount} // Pass total trained count from state
            clearedCount={totalReviewedCount}     // Pass total reviewed count
            unclearedCount={totalUnreviewedCount}   // Pass total unreviewed count
            operationInProgress={operationInProgress}
            lastTrainedTimestamp={lastTrainedTimestamp}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>

        {/* Categorization Controls Component Wrapper */}
        <div className="flex-1 flex flex-col gap-4"> {/* Added flex-col and gap */}
          <CategorizationControls
            pendingCategoryUpdates={pendingCategoryUpdates}
            applyingAll={applyingAll}
            applyAllPredictedCategories={applyAllPredictedCategories}
            handleTrainSelected={handleTrainSelected}
            handleCategorizeSelected={handleCategorizeSelected}
            handleTrainAllReviewed={handleTrainAllReviewed} // Pass the new handler
            selectedTransactionsCount={selectedTransactions.length}
            loading={loading}
            operationInProgress={operationInProgress}
            handleCancelCategorization={handleCancelCategorization}
            lastTrainedTimestamp={lastTrainedTimestamp}
            useAiMode={useAiMode} // Pass AI mode state
          />
          {/* Admin Mode Buttons - Conditionally Rendered */}
          {isAdminMode && (
            <div className="border-t border-gray-200 pt-4 mt-4 flex items-center gap-4">
              <button
                onClick={() => setFilterNoPayee(prev => !prev)} // Toggle filter state
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${filterNoPayee ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                disabled={operationInProgress} 
              >
                {filterNoPayee ? 'Clear "[No Payee]" Filter' : 'Filter by "[No Payee]"'}
              </button>
              <button
                onClick={() => handleTransferOriginalNames()} // Define this function next
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-transparent shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                disabled={operationInProgress || selectedTransactions.length === 0 || !transactions.some(tx => selectedTransactions.includes(tx.lunchMoneyId) && tx.originalData?.payee === '[No Payee]')}
              >
                Transfer Original Name to Payee (Selected)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionTable
        filteredTransactions={displayedTransactions}
        selectedTransactions={selectedTransactions}
        handleSelectTransaction={handleSelectTransaction}
        handleSelectAll={handleSelectAll}
        pendingCategoryUpdates={pendingCategoryUpdates}
        categories={categories}
        handleCategoryChange={handleCategoryChange}
        updatingCategory={updatingCategory}
        successfulUpdates={successfulUpdates}
        applyPredictedCategory={applyPredictedCategory}
        applyingIndividual={applyingIndividual}
        cancelSinglePrediction={cancelSinglePrediction}
        getCategoryNameById={getCategoryNameById}
        loading={loading}
        handleNoteChange={handleNoteChange} // Pass the new handler
        updatingNoteId={updatingNoteId}   // Pass the loading state
        isAdminMode={isAdminMode} // Pass the admin mode state
      />
    </div>
  );
}