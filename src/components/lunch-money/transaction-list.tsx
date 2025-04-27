'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Transaction, 
  Category, 
  DateRange, 
  ToastMessage, 
  ImportStatus, 
  OperationType 
} from './types';

// Import components
import ProgressModal from './components/progress-modal';
import TransactionFilters from './components/transaction-filters';
import CategorizationControls from './components/categorization-controls';
import TransactionTable from './components/transaction-table';
import ToastNotification from './components/toast-notification';

// Define type here now
type TransactionStatusFilter = 'uncleared' | 'cleared';

// Define the props for the component - remove status props
// interface TransactionListProps {
//   statusFilter: 'uncleared' | 'cleared';
//   setStatusFilter: (filter: 'uncleared' | 'cleared') => void;
// }

// Remove props from component signature
export default function TransactionList(/*{ statusFilter, setStatusFilter }: TransactionListProps*/) {
  const router = useRouter();
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
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [categories, setCategories] = useState<(string | Category)[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const categoryInputRef = useRef<HTMLSelectElement>(null);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<OperationType>('none');
  
  // Categorization workflow states
  const [categorizedTransactions, setCategorizedTransactions] = useState<Map<string, {category: string, score: number}>>(new Map());
  const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Record<string, {categoryId: string | null, score: number}>>({});
  const [applyingAll, setApplyingAll] = useState<boolean>(false);
  const [applyingIndividual, setApplyingIndividual] = useState<string | null>(null);
  const [lastTrainedTimestamp, setLastTrainedTimestamp] = useState<string | null>(null);

  // Calculate transaction stats
  const transactionStats = useMemo(() => {
    let trainedCount = 0;
    let uncategorizedCount = 0;

    transactions.forEach(tx => {
      const hasTrainedTag = tx.tags?.some(tag => 
        (typeof tag === 'string' && tag.toLowerCase() === 'trained') || 
        (typeof tag === 'object' && tag.name?.toLowerCase() === 'trained')
      );
      if (hasTrainedTag) {
        trainedCount++;
      }

      // Check if uncategorized (using originalData as the source of truth)
      const isUncategorized = !tx.originalData?.category_id;
      if (isUncategorized) {
        uncategorizedCount++;
      }
    });

    return { trainedCount, uncategorizedCount };
  }, [transactions]);

  // Fetch initial data when component mounts
  useEffect(() => {
    // Call fetchTransactionsWithDates directly for initial load
    fetchTransactionsWithDates(dateRange, statusFilter);
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

  // Focus the input when editing starts
  useEffect(() => {
    if (editingTransaction && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [editingTransaction]);

  // First, let's add some debug to see what IDs we're working with
  useEffect(() => {
    if (transactions.length > 0) {
      console.log("Transaction IDs in list:", transactions.map(tx => tx.lunchMoneyId));
    }
  }, [transactions]);

  // Refetch transactions when the status filter or date range changes
  useEffect(() => {
    // Call fetchTransactionsWithDates directly, passing the current state
    fetchTransactionsWithDates(dateRange, statusFilter);
  }, [statusFilter, dateRange]); 

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

  // Memoize handleCategoryChange
  const handleCategoryChange = useCallback(async (transactionId: string, categoryValue: string) => {
    setUpdatingCategory(transactionId);
    
    const transaction = transactions.find(tx => tx.lunchMoneyId === transactionId);
    if (!transaction) {
      setUpdatingCategory(null);
      return;
    }
    
    try {
      const txTags = transaction.tags || [];
      let hasTrainedTag = false;
      const filteredTags = txTags.filter(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const isTrainedTag = tagName && tagName.toLowerCase() === 'trained';
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
          tags: filteredTags
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      let categoryName = categoryValue;
      const selectedCategory = categories.find(cat => typeof cat !== 'string' && cat.id === categoryValue);
      if (selectedCategory && typeof selectedCategory !== 'string') {
        categoryName = selectedCategory.name;
      }
      
      setTransactions(prev => 
        prev.map(tx => {
          if (tx.lunchMoneyId === transactionId) {
            return {
              ...tx,
              category: categoryValue === "none" ? null : categoryValue,
              lunchMoneyCategory: categoryValue === "none" ? null : categoryName,
              originalData: {
                ...tx.originalData,
                category_id: categoryValue === "none" ? null : categoryValue,
                category_name: categoryValue === "none" ? null : categoryName
              },
              tags: responseData.updatedTags?.map((tag: string) => ({ name: tag, id: `tag-${Date.now()}-${Math.random()}` })) || filteredTags 
            };
          }
          return tx;
        })
      );
      
      setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: true }));
      setTimeout(() => setSuccessfulUpdates(prev => ({ ...prev, [transactionId]: false })), 3000);
      
      setToastMessage({ message: responseData.message || 'Category updated and tagged.', type: 'success' });
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to update category', type: 'error' });
    } finally {
      setUpdatingCategory(null);
    }
  }, [transactions, categories]); // Add dependencies

  // Modify handleDateRangeChange to set dateRange directly
  const handleDateRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    // No need to set pending state
  }, []); // No dependencies needed

  // Re-add memoized applyDateFilter function
  const applyDateFilter = useCallback(() => {
    console.log("Applying date filter with:", pendingDateRange);
    setIsApplyingDates(true); // Set loading state for button
    setDateRange(pendingDateRange); // Update main dateRange to trigger fetch effect
  }, [pendingDateRange]); // Dependency on pendingDateRange

  // Memoize handleImportTransactions
  const handleImportTransactions = useCallback(async () => {
    if (transactions.length === 0) return;
    
    setImportStatus('importing');
    setImportMessage('Importing transactions...');

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import transactions');
      }

      const result = await response.json();
      setImportStatus('success');
      setImportMessage(`Successfully imported ${result.count} transactions.`);
      router.refresh(); // Consider if router refresh is desired here
    } catch (error) {
      console.error('Error importing transactions:', error);
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Failed to import transactions');
    }
  }, [transactions, router]); // Dependencies: transactions, router

  // Memoize tagTransactionsAsTrained
  const tagTransactionsAsTrained = useCallback(async (transactionIds: string[]) => {
    if (!transactionIds.length) return;
    
    try {
      // Filter out transactions that already have the "Trained" tag
      const transactionsToTag = transactionIds.filter(txId => {
        const tx = transactions.find(t => t.lunchMoneyId === txId);
        if (!tx) return false;
        
        // Check if transaction already has the "Trained" tag
        const txTags = tx.tags || [];
        const hasTrainedTag = txTags.some(tag => 
          (typeof tag === 'string' && tag.toLowerCase() === 'trained') || 
          (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === 'trained')
        );
        
        return !hasTrainedTag;
      });
      
      if (transactionsToTag.length === 0) {
        console.log("No transactions to tag - all already have 'Trained' tag");
        return;
      }
      
      setToastMessage({
        message: `Applying "Trained" tag to ${transactionsToTag.length} transactions...`,
        type: 'success'
      });
      
      const promises = transactionsToTag.map(async (transactionId) => {
        try {
          const tx = transactions.find(t => t.lunchMoneyId === transactionId);
          if (!tx) return false;
          
          // Get current tags and add "Trained" tag
          const currentTags = Array.isArray(tx.tags) ? 
            tx.tags.map(tag => typeof tag === 'string' ? tag : tag.name) : 
            [];
          
          const response = await fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId,
              tags: [...currentTags, 'Trained'] // Send 'Trained' string tag
            }),
            signal: AbortSignal.timeout(10000)
          });
          
          if (!response.ok) {
            console.error(`Failed to tag transaction ${transactionId}`);
            return false;
          }
          
          return true;
        } catch (error) {
          console.error(`Error tagging transaction ${transactionId}:`, error);
          return false;
        }
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        setToastMessage({
          message: `Tagged ${successCount} transactions as "Trained"`,
          type: 'success'
        });
        
        // Update local state to reflect the tagging
        setTransactions(prev => prev.map(tx => {
          if (transactionsToTag.includes(tx.lunchMoneyId)) {
            const currentTags = Array.isArray(tx.tags) ? [...tx.tags] : [];
            const hasTrainedTag = currentTags.some(tag => 
              (typeof tag === 'string' && tag.toLowerCase() === 'trained') || 
              (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === 'trained')
            );
            if (!hasTrainedTag) {
              // Add the tag as an object for consistency within the app state
              return {
                ...tx,
                tags: [...currentTags, { name: 'Trained', id: `tag-trained-${Date.now()}` }]
              };
            }
          }
          return tx;
        }));
      }
    } catch (error) {
      console.error('Error applying "Trained" tag:', error);
      setToastMessage({
        message: 'Failed to apply "Trained" tag to transactions',
        type: 'error'
      });
    }
  }, [transactions]); // Dependency: transactions

  // Memoize pollForCompletion
  const pollForCompletion = useCallback(async (predictionId: string, type: 'training' | 'categorizing') => {
    const maxPolls = 120; 
    const pollInterval = 5000; 
    let pollCount = 0;
    let result = { status: 'unknown', message: 'Maximum polling attempts reached' };

    const poll = async () => {
      if (pollCount >= maxPolls) return result;
        pollCount++;

      try {
        const response = await fetch('/api/classify/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ predictionId, type }),
        });

        if (!response.ok) {
          throw new Error('Failed to poll for completion');
        }

        const data = await response.json();
        if (data.status === 'completed') {
          result = { status: 'completed', message: 'Training completed successfully!' };
        } else if (data.status === 'in-progress') {
          await poll();
        } else {
          throw new Error('Received unexpected status from server');
        }
      } catch (error) {
        console.error('Error polling for completion:', error);
        await poll();
      }
    };

    await poll();
    setOperationInProgress(false);
    setOperationType('none');
    return result;
  }, []); // No dependencies needed as it uses setters directly

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
    
    // Special case for the format shared in your error message
    // If we're getting a format like the example with narrative/predicted_category/similarity_score
    const hasCorrectFormat = results.length > 0 && 
      results[0] && 
      (results[0].narrative !== undefined && results[0].predicted_category !== undefined);
    
    if (hasCorrectFormat) {
      console.log("Results appear to be in the correct format already!");
    }
    
    // Create a new map for categorized transactions
    const newCategorizedTransactions = new Map();
    
    // Process results and build prediction map
    results.forEach((result, index) => {
      // The API might return results with different field names, so we handle both formats
      const narrative = result.narrative || result.Narrative || result.description || '';
      let predictedCategory = result.predicted_category || result.category || result.Category || '';
      const similarityScore = result.similarity_score || result.score || 0;
      
      // Skip "None" categories or replace with a fallback
      if (!predictedCategory || predictedCategory.toLowerCase() === 'none') {
        console.log(`Result ${index+1}: "${narrative}" → "None" category detected, using fallback`);
        predictedCategory = 'Uncategorized';
      }
      
      if (narrative && predictedCategory) {
        console.log(`Result ${index+1}: "${narrative}" → "${predictedCategory}" (${similarityScore})`);
        newCategorizedTransactions.set(narrative, {
          category: predictedCategory,
          score: similarityScore
        });
      } else {
        console.log(`Result ${index+1} is missing required fields:`, result);
      }
    });
    
    console.log("Built categorization map with", newCategorizedTransactions.size, "entries");
    
    // Clear any pending updates and set the new categorized transactions
    setPendingCategoryUpdates({});
    setCategorizedTransactions(newCategorizedTransactions);
    
    // Create a mapping of transaction IDs to predicted categories and scores for easier access
    const pendingUpdates: Record<string, {categoryId: string | null, score: number}> = {}; // Allow null categoryId

    // Map the predictions to transaction IDs
    selectedTransactions.forEach(txId => {
      const tx = transactions.find(t => t.lunchMoneyId === txId);
      if (tx && tx.description) {
        const prediction = newCategorizedTransactions.get(tx.description);
        
        if (prediction) {
          // Handle case where prediction is explicitly 'Uncategorized' (our fallback for 'None')
          if (prediction.category === 'Uncategorized') {
            pendingUpdates[txId] = {
              categoryId: null, // Use null to signify 'Needs Review' or 'Uncategorized'
              score: prediction.score
            };
          } else {
            // Find the category ID for this predicted category name
            const categoryObj = categories.find(cat => 
              typeof cat !== 'string' && 
              cat.name.toLowerCase() === prediction.category.toLowerCase()
            );
            
            // Use the found category ID or the category name as fallback if ID not found
            const categoryId = categoryObj && typeof categoryObj !== 'string' 
              ? categoryObj.id 
              : prediction.category; // Keep original prediction if ID mapping fails
            
            pendingUpdates[txId] = {
              categoryId,
              score: prediction.score
            };
          }
        } else {
            // Handle cases where a transaction was selected but received no prediction (e.g., API error for just that item)
            // Or if the 'None' category was filtered out earlier (ensure it's handled)
            // We might want to explicitly mark these for review as well
            console.log(`No prediction found for txId ${txId} with description "${tx.description}". Marking for review.`);
            pendingUpdates[txId] = {
              categoryId: null, // Mark as needing review
              score: 0 // Assign a zero score
            };
        }
      }
    });
    
    // Store the pending updates
    setPendingCategoryUpdates(pendingUpdates);
    
    console.log("Prepared", Object.keys(pendingUpdates).length, "pending category updates");
    
    // Show a success toast
    setToastMessage({
      message: `Categorized ${Object.keys(pendingUpdates).length} transactions. Review and apply the changes.`,
      type: 'success'
    });
  }, [transactions, categories, selectedTransactions]); // Dependencies: transactions, categories, selectedTransactions

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
          // *** CHANGE: Use category_id from originalData ***
          const categoryId = tx.originalData?.category_id?.toString() || null; // Get the numeric ID as string or null
          if (!categoryId) {
            console.warn(`Transaction ${tx.lunchMoneyId} is missing a category ID. Skipping for training or using fallback.`);
            // Decide: return null and filter out, or send a default like '0' or null
            // For now, let's send null if uncategorized, the backend needs to handle this.
          }
          return {
            description: tx.description,
            // *** Use Category (capital C) to match backend model ***
            Category: categoryId, // Send the numeric ID (or null)
            money_in: tx.is_income, 
            amount: tx.amount 
          };
        })
        // Optional: Filter out transactions without a category ID if the backend cannot handle null
        // .filter(item => item.categoryId !== null); 
      
      if (trainingData.length === 0) throw new Error('No valid transactions with category IDs selected for training');

      // *** CHANGE: Ensure payload structure matches expected backend (check if backend expects 'categoryId') ***
      const payload = {
        transactions: trainingData, // Contains description, categoryId, money_in, amount
        // Assuming backend might expect these, adjust if necessary
        expenseSheetId: 'lunchmoney', 
        spreadsheetId: 'lunchmoney' 
      };

      setProgressPercent(10);
      setProgressMessage('Sending training request...');

      // *** Make sure the backend API '/api/classify/train' forwards this payload,
      // and the *external* Flask service expects 'categoryId' ***
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // --- MODIFIED RESPONSE HANDLING FOR TRAINING ---
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous training results:", syncResult);

        if (syncResult.status === 'completed') {
          setProgressMessage('Training completed successfully!');
          setProgressPercent(100);
          setToastMessage({ message: 'Training completed successfully!', type: 'success' });
          await tagTransactionsAsTrained(selectedTransactions); // Tag transactions
          fetchLastTrainedTimestamp(); // <-- Refresh timestamp
          setOperationInProgress(false); // Close modal immediately
          setOperationType('none');
          setSelectedTransactions([]); // Optional: Clear selection after successful training
          return { status: 'completed' }; // Indicate success
        } else {
          // Handle unexpected 200 response format
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
          const pollResult = await pollForCompletion(predictionId, 'training');
          if (pollResult.status === 'completed') {
            await tagTransactionsAsTrained(selectedTransactions);
            fetchLastTrainedTimestamp(); // <-- Refresh timestamp
          }
          return pollResult;
        } else {
          throw new Error('Server started training but did not return a prediction ID.');
        }
      } else {
        // Handle other errors (4xx, 5xx)
        const result = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(result.error || `Training request failed with status ${response.status}`);
      }
      // --- END MODIFIED RESPONSE HANDLING ---

    } catch (error) {
      console.error('Error starting training:', error);
      setToastMessage({ message: error instanceof Error ? error.message : 'Failed to start training', type: 'error' });
      setOperationInProgress(false);
      setOperationType('none');
    }
  }, [selectedTransactions, transactions, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp]); // Use memoized functions

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
      }));

      console.log("Payload being sent:", selectedTxObjects);

      setProgressMessage('Sending request to server...');
      const response = await fetch('/api/classify/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: selectedTxObjects }),
      });

      // --- MODIFIED RESPONSE HANDLING --- 
      if (response.status === 200) {
        // Synchronous Completion
        const syncResult = await response.json();
        console.log("Received synchronous classification results:", syncResult);

        if (syncResult.status === 'completed' && Array.isArray(syncResult.results)) {
          setProgressMessage('Processing results...');
          setProgressPercent(100);
          updateTransactionsWithPredictions(syncResult.results);
          setToastMessage({ message: 'Categorization completed successfully!', type: 'success' });
          setOperationInProgress(false); // Close modal immediately
          setSelectedTransactions([]); // Clear selection after successful sync categorization
        } else {
          // Handle unexpected 200 response format
          throw new Error('Received unexpected success response format from server.');
        }
      } else if (response.status === 202) {
        // Asynchronous Processing Started
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
  }, [selectedTransactions, pendingCategoryUpdates, transactions, pollForCompletion, updateTransactionsWithPredictions]); // Use memoized functions

  // Memoize handleCancelCategorization
  const handleCancelCategorization = useCallback(() => {
    console.log("Cancelling pending categorization updates.");
    setPendingCategoryUpdates({});
    setCategorizedTransactions(new Map()); // Clear the map holding prediction details
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

  // Memoize getFilteredTransactions (returns the raw list for now)
  const getFilteredTransactions = useCallback(() => {
    // Filtering is done server-side by statusFilter
    return transactions; 
  }, [transactions]); // Dependency: transactions

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
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to update category',
        type: 'error'
      });
    } finally {
      setApplyingIndividual(null);
    }
    // Ensure getCategoryNameById is included in dependencies
  }, [pendingCategoryUpdates, getCategoryNameById]); 

  // Get the transactions to display based on filters
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="text-gray-900 text-sm bg-white min-h-screen p-4">
      {/* Toast notification */}
      <ToastNotification toastMessage={toastMessage} />

      {/* Operation Progress Modal */}
      <ProgressModal
        operationInProgress={operationInProgress}
        operationType={operationType}
        progressPercent={progressPercent}
        progressMessage={progressMessage}
      />

      {/* Updated wrapper for all controls */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        
        {/* Transaction Filters Component - Renders the switch internally now */}
        <TransactionFilters
          pendingDateRange={pendingDateRange}
          handleDateRangeChange={handleDateRangeChange}
          applyDateFilter={applyDateFilter}
          isApplying={isApplyingDates}
          trainedCount={transactionStats.trainedCount}
          operationInProgress={operationInProgress}
          lastTrainedTimestamp={lastTrainedTimestamp}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Categorization Controls Component */}
        <CategorizationControls
          pendingCategoryUpdates={pendingCategoryUpdates}
          applyingAll={applyingAll}
          applyAllPredictedCategories={applyAllPredictedCategories}
          handleImportTransactions={handleImportTransactions}
          handleTrainSelected={handleTrainSelected}
          handleCategorizeSelected={handleCategorizeSelected}
          selectedTransactionsCount={selectedTransactions.length}
          loading={loading}
          operationInProgress={operationInProgress}
          importStatus={importStatus}
          importMessage={importMessage}
          handleCancelCategorization={handleCancelCategorization}
          lastTrainedTimestamp={lastTrainedTimestamp}
        />
      </div>

      {/* Transaction Table */}
      <TransactionTable
        filteredTransactions={filteredTransactions}
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
        getCategoryNameById={getCategoryNameById}
        loading={loading}
      />
    </div>
  );
}