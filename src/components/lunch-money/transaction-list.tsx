'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
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

export default function TransactionList() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyingDates, setIsApplyingDates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth()-5, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dateRange, setDateRange] = useState(pendingDateRange);
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

  // *** NEW: State for the primary filter ***
  const [showOnlyNeedsReview, setShowOnlyNeedsReview] = useState<boolean>(false); // Default to false

  // Calculate transaction stats
  const transactionStats = useMemo(() => {
    let trainedCount = 0;
    let uncategorizedCount = 0;
    let needsReviewCount = 0; // Add count for the new filter

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
      
      // Check if needs review (not trained AND not manually categorized)
      const hasCategorizedTag = tx.tags?.some(tag => 
        (typeof tag === 'string' && tag === 'tx-categorized') ||
        (typeof tag === 'object' && tag.name === 'tx-categorized')
      );

      if (!hasTrainedTag && !hasCategorizedTag) {
          needsReviewCount++;
      }
    });

    return { trainedCount, uncategorizedCount, needsReviewCount }; // Include new count
  }, [transactions]);

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchLastTrainedTimestamp();
  }, []);

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
  
  const fetchTransactionsWithDates = async (dates: { startDate: string; endDate: string }, filterNeedsReview: boolean) => {
    setLoading(true);
    setError(null);
    
    console.log('Fetching with date range:', dates, 'Filter Needs Review:', filterNeedsReview);

    try {
      const params = new URLSearchParams({
        start_date: dates.startDate,
        end_date: dates.endDate,
      });

      // Add the filter parameter if needed
      if (filterNeedsReview) {
        params.append('filter', 'needs_review');
      }

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
      
      // After loading transactions, refresh categories from them
      await fetchCategories(); // Keep this

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching transactions');
    } finally {
      setLoading(false);
      setIsApplyingDates(false);
    }
  };

  const fetchTransactions = async () => {
    fetchTransactionsWithDates(dateRange, showOnlyNeedsReview);
  };

  const startEditing = (id: string) => {
    setEditingTransaction(id);
  };

  const handleCategoryChange = async (transactionId: string, categoryValue: string) => {
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
      
      // Send update to the API, now includes existing tags for merging on backend
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryValue,
          tags: filteredTags // Send the *current* tags (backend will add 'tx-categorized')
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
      
      // Update local state: include the new tags returned from the PATCH response
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
              // Use tags returned from API which should include 'tx-categorized'
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
  };

  const handleSelectTransaction = (txId: string) => {
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
  };

  const handleSelectAll = () => {
    if (filteredTransactions.length === 0) return;
    
    console.log('Current filtered transactions count:', filteredTransactions.length);
    console.log('Current selections count:', selectedTransactions.length);
    
    // Check if all filtered transactions are already selected
    const filteredIds = filteredTransactions
      .map(tx => tx.lunchMoneyId)
      .filter((id): id is string => id !== undefined && id !== null);
    
    const allFilteredSelected = filteredIds.every(id => selectedTransactions.includes(id));
    
    // If all filtered transactions are selected, deselect them
    if (allFilteredSelected && selectedTransactions.length > 0) {
      console.log('Deselecting all filtered transactions');
      setSelectedTransactions(prev => 
        prev.filter(id => !filteredIds.includes(id))
      );
    } else {
      // Otherwise, add all filtered transactions to selection
      console.log('Selecting all filtered transactions');
      setSelectedTransactions(prev => {
        const newSelection = [...prev];
        filteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateFilter = () => {
    console.log("Applying date filter with:", pendingDateRange);
    setIsApplyingDates(true);
    setDateRange(pendingDateRange);
    // fetchTransactionsWithDates(pendingDateRange, showOnlyNeedsReview); // No need to call here, useEffect handles it
  };

  const handleImportTransactions = async () => {
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
      router.refresh();
    } catch (error) {
      console.error('Error importing transactions:', error);
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Failed to import transactions');
    }
  };

  // Add a new function to tag transactions as trained
  const tagTransactionsAsTrained = async (transactionIds: string[]) => {
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
              tags: [...currentTags, 'Trained']
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
            // Get current tags array or empty array if none
            const currentTags = Array.isArray(tx.tags) ? [...tx.tags] : [];
            
            // Only add "Trained" tag if it doesn't already exist
            const hasTrainedTag = currentTags.some(tag => 
              (typeof tag === 'string' && tag.toLowerCase() === 'trained') || 
              (typeof tag === 'object' && tag.name && tag.name.toLowerCase() === 'trained')
            );
            
            if (!hasTrainedTag) {
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
  };

  // Add a generic function to handle polling for both operations
  const pollForCompletion = async (predictionId: string, type: 'training' | 'categorizing') => {
    const maxPolls = 120; 
    const pollInterval = 5000; 
    const maxConsecutiveErrors = 3;
    let pollCount = 0;
    let consecutiveErrors = 0;
    
    setOperationInProgress(true);
    setOperationType(type);
    setProgressPercent(5); 
    setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} started, initializing...`);

    // *** ADDED: Delay before starting the first poll ***
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
    // *** END ADDED DELAY ***

    while (pollCount < maxPolls) {
      try {
        pollCount++;
        // Update progress slightly differently now that initial delay is done
        const progressValue = Math.max(10, Math.min(80, Math.floor((pollCount / maxPolls) * 100)));
        // Set initial message only after delay
        if (pollCount === 1) {
            setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} job started, checking status...`);
        }
        setProgressPercent(progressValue);
        
        // Wait for the poll interval (only if not the very first actual poll after delay)
        if (pollCount > 1) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        console.log(`Checking ${type} status via internal proxy for prediction ID: ${predictionId} (attempt ${pollCount}/${maxPolls})`);
        const response = await fetch(`/api/classify/status/${predictionId}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const statusCode = response.status;
          console.log(`Internal proxy returned error code: ${statusCode} for prediction ID: ${predictionId}`);

          if (statusCode === 502 || statusCode === 503 || statusCode === 504 || statusCode === 500) {
            consecutiveErrors++;
            setProgressMessage(`Server error (${statusCode}), retrying...`);
            if (consecutiveErrors >= maxConsecutiveErrors) {
              setToastMessage({ message: `${type === 'training' ? 'Training' : 'Categorization'} failed after ${consecutiveErrors} consecutive server errors`, type: 'error' });
              setOperationInProgress(false);
              setOperationType('none');
              return { status: 'failed', error: 'Too many consecutive server errors' };
            }
            continue;
          }
          
          let errorData: { error?: string; message?: string; } = { error: 'Unknown error from proxy' };
          try { errorData = await response.json(); } catch (e) { /* Ignore */ }

          if (statusCode === 404) {
            if (pollCount < 5) {
              setProgressMessage('Waiting for job to start...');
              continue;
            } 
            if (pollCount > 20) {
              setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} complete.`);
              setProgressPercent(100);
              setTimeout(() => { setOperationInProgress(false); setOperationType('none'); }, 2000);
              return { status: 'completed', message: 'Process completed (inferred from 404)' };
            }
            continue; 
          }
          
          setToastMessage({ message: `Error checking status: ${errorData.error || response.statusText}`, type: 'error' });
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: errorData.error || `Proxy error ${statusCode}` };
        }

        consecutiveErrors = 0;
        const result = await response.json();
        console.log("Status response (from proxy - OK):", result);

        if (result.status === 'error' && result.code === 'RESULTS_UNAVAILABLE') {
          console.error('Categorization completed, but results are unavailable from the service.');
          setProgressMessage(result.message || 'Categorization complete, but results unavailable.');
          setToastMessage({ message: result.message || 'Categorization results unavailable. Please try again.', type: 'error' });
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: result.error || 'Results unavailable' };
        }

        if (result.status === "failed" || result.status === "error") {
          const errorMessage = result.error || result.message || 'Unknown error during categorization';
          setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`);
          setToastMessage({ message: `${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`, type: 'error' });
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: errorMessage };
        } 
        
        if (result.status === "completed") {
          setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`);
          setProgressPercent(100);
          setToastMessage({ message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`, type: 'success' });
          setTimeout(() => { setOperationInProgress(false); setOperationType('none'); }, 2000);
          const classificationResults = result.results || result.config?.results || [];
          return { status: 'completed', results: classificationResults, message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!` };
        }

        let statusMessage = `${type === 'training' ? 'Training' : 'Categorization'} in progress...`;
        if (result.message) statusMessage += ` ${result.message}`;
        setProgressMessage(statusMessage);
        
      } catch (error) {
        console.error('Error polling status via proxy:', error);
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setToastMessage({ message: `Failed to check ${type === 'training' ? 'training' : 'categorization'} status after ${consecutiveErrors} consecutive network/parsing errors`, type: 'error' });
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: 'Error checking status via proxy' };
        }
      }
    }

    setToastMessage({ message: `${type === 'training' ? 'Training' : 'Categorization'} is taking longer than expected. Please try again.`, type: 'error' });
    setOperationInProgress(false);
    setOperationType('none');
    return { status: 'unknown', message: 'Maximum polling attempts reached' };
  };

  // Update handleTrainSelected to use the new polling function AND the internal API route
  const handleTrainSelected = async () => {
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
  };

  // Update handleCategorizeSelected to use the internal API route
  const handleCategorizeSelected = async () => {
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
  };

  // Function to update local transaction data with predicted categories
  const updateTransactionsWithPredictions = (results: any[]) => {
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
  };

  // Add a helper function to get category name from id
  const getCategoryNameById = (categoryId: string | null) => {
    if (!categoryId) return null;
    
    const category = categories.find(cat => 
      typeof cat !== 'string' && cat.id === categoryId
    );
    
    if (category && typeof category !== 'string') {
      return category.name;
    }
    
    // If not found in categories, check if the transaction has the category name
    return categoryId;
  };

  // Function to apply a single predicted category
  const applyPredictedCategory = async (transactionId: string) => {
    const update = pendingCategoryUpdates[transactionId];
    if (!update) {
      console.error(`No pending update found for transaction ${transactionId}`);
      return;
    }

    // Set loading state for this specific transaction
    setApplyingIndividual(transactionId);

    try {
      // Send update to the API
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          categoryId: update.categoryId === "none" ? null : update.categoryId
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      // Find category name for display
      let categoryName = update.categoryId;
      const selectedCategory = categories.find(cat => 
        typeof cat !== 'string' && cat.id === update.categoryId
      );
      if (selectedCategory && typeof selectedCategory !== 'string') {
        categoryName = selectedCategory.name;
      }
      
      // Update local state
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
                category_name: update.categoryId === "none" ? null : categoryName
              }
            };
          }
          return tx;
        })
      );
      
      // Show success indicator
      setSuccessfulUpdates(prev => ({
        ...prev,
        [transactionId]: true
      }));
      
      // Clear this pending update
      setPendingCategoryUpdates(prev => {
        const newUpdates = {...prev};
        delete newUpdates[transactionId];
        return newUpdates;
      });
      
      // Show success toast
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
  };

  // Function to apply all predicted categories
  const applyAllPredictedCategories = async () => {
    const transactionIds = Object.keys(pendingCategoryUpdates);
    if (transactionIds.length === 0) {
      setToastMessage({
        message: "No categorizations to apply",
        type: "error"
      });
      return;
    }

    // Set global loading state
    setApplyingAll(true);

    try {
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < transactionIds.length; i += batchSize) {
        const batch = transactionIds.slice(i, i + batchSize);
        
        // Create an array of promises for the batch
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
                categoryId: update.categoryId === "none" ? null : update.categoryId
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
        
        // Wait for all promises in this batch to complete
        const results = await Promise.all(promises);
        
        // Count successes and failures
        results.forEach(result => {
          if (result.success) {
            successCount++;
            
            // Show success indicator
            setSuccessfulUpdates(prev => ({
              ...prev,
              [result.txId]: true
            }));
            
            // Get the update info
            const update = pendingCategoryUpdates[result.txId];
            
            // Find category name for display
            let categoryName = update.categoryId;
            const selectedCategory = categories.find(cat => 
              typeof cat !== 'string' && cat.id === update.categoryId
            );
            if (selectedCategory && typeof selectedCategory !== 'string') {
              categoryName = selectedCategory.name;
            }
            
            // Update transaction in the local state
            setTransactions(prev => 
              prev.map(tx => {
                if (tx.lunchMoneyId === result.txId) {
                  return {
                    ...tx,
                    category: update.categoryId === "none" ? null : update.categoryId,
                    lunchMoneyCategory: update.categoryId === "none" ? null : categoryName,
                    originalData: {
                      ...tx.originalData,
                      category_id: update.categoryId === "none" ? null : update.categoryId,
                      category_name: update.categoryId === "none" ? null : categoryName
                    }
                  };
                }
                return tx;
              })
            );
          } else {
            failCount++;
          }
        });
      }
      
      // Clear all pending updates
      setPendingCategoryUpdates({});
      
      // Show success toast
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
  };

  // Function to get filtered transactions
  const getFilteredTransactions = () => {
    let result = transactions;

    // Apply the primary server-side filter status (or show all if unchecked)
    // The server already excluded 'tx-categorized' if showOnlyNeedsReview was true
    // If showOnlyNeedsReview is false, we have *all* transactions here.

    // Further client-side filtering for 'trained' tags
    if (showOnlyNeedsReview) {
        result = result.filter(tx => {
            const hasTrainedTag = tx.tags?.some(tag => 
                (typeof tag === 'string' && tag.toLowerCase() === 'trained') || 
                (typeof tag === 'object' && tag.name?.toLowerCase() === 'trained')
            );
            return !hasTrainedTag; // Only show if NOT trained
        });
    }

    return result;
  };

  // *** NEW: Handler to cancel/discard pending categorization predictions ***
  const handleCancelCategorization = () => {
    console.log("Cancelling pending categorization updates.");
    setPendingCategoryUpdates({});
    setCategorizedTransactions(new Map()); // Clear the map holding prediction details
    // Optionally reset other filters or show a toast
    setToastMessage({ message: 'Discarded pending category predictions.', type: 'success' }); 
  };

  // Fetch the last trained timestamp
  const fetchLastTrainedTimestamp = async () => {
    try {
      const response = await fetch('/api/classify/last-trained');
      if (!response.ok) {
        // Don't throw an error, just log it, maybe the user hasn't trained yet
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
      setLastTrainedTimestamp(null); // Set to null on error
    }
  };

  // Handle error state
  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={fetchTransactions}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Pass the new state and handler to TransactionFilters */}
        <TransactionFilters
          pendingDateRange={pendingDateRange}
          handleDateRangeChange={handleDateRangeChange}
          applyDateFilter={applyDateFilter}
          isApplying={isApplyingDates}
          pendingCategoryUpdates={pendingCategoryUpdates}
          trainedCount={transactionStats.trainedCount}
          needsReviewCount={transactionStats.needsReviewCount} // Pass new count
          operationInProgress={operationInProgress}
          showOnlyNeedsReview={showOnlyNeedsReview} // Pass state
          setShowOnlyNeedsReview={setShowOnlyNeedsReview} // Pass setter
          lastTrainedTimestamp={lastTrainedTimestamp} // <-- Pass timestamp
        />

        {/* Action buttons and categorization results */}
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
          lastTrainedTimestamp={lastTrainedTimestamp} // <-- Pass timestamp
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
      />
    </div>
  );
}