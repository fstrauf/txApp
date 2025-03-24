'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function TransactionList() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [categorizing, setCategorizing] = useState(false);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<OperationType>('none');
  
  // Categorization workflow states
  const [showOnlyCategorized, setShowOnlyCategorized] = useState<boolean>(false);
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(false);
  const [categorizedTransactions, setCategorizedTransactions] = useState<Map<string, {category: string, score: number}>>(new Map());
  const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Record<string, {categoryId: string, score: number}>>({});
  const [applyingAll, setApplyingAll] = useState<boolean>(false);
  const [applyingIndividual, setApplyingIndividual] = useState<string | null>(null);

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
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
  
  const fetchTransactionsWithDates = async (dates: { startDate: string; endDate: string }) => {
    setLoading(true);
    setError(null);
    
    console.log('Fetching with specific date range:', dates);

    try {
      const params = new URLSearchParams({
        start_date: dates.startDate,
        end_date: dates.endDate,
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
            typeof tag === 'object' ? tag : { name: tag, id: `tag-${Date.now()}-${Math.random()}` }
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
      await fetchCategories();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    fetchTransactionsWithDates(dateRange);
  };

  const startEditing = (id: string) => {
    setEditingTransaction(id);
  };

  const handleCategoryChange = async (transactionId: string, categoryValue: string) => {
    // Don't close the dropdown immediately
    setUpdatingCategory(transactionId);
    
    const transaction = transactions.find(tx => tx.lunchMoneyId === transactionId);
    if (!transaction) {
      setUpdatingCategory(null);
      return;
    }
    
    console.log(`Updating transaction ${transactionId} with category: "${categoryValue}"`);
    
    try {
      // Check if transaction has a "Trained" tag that needs to be removed
      const txTags = transaction.tags || [];
      let hasTrainedTag = false;
      const filteredTags = txTags.filter(tag => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const isTrainedTag = tagName && tagName.toLowerCase() === 'trained';
        if (isTrainedTag) hasTrainedTag = true;
        return !isTrainedTag;
      });
      
      // Prepare tag names for API request
      const tagNames = hasTrainedTag 
        ? filteredTags.map(tag => typeof tag === 'string' ? tag : tag.name) 
        : undefined;
      
      // Send update to the API
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryValue,
          // Remove the "Trained" tag if it exists
          tags: tagNames
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category');
      }
      
      // Find category name for display
      let categoryName = categoryValue;
      const selectedCategory = categories.find(cat => 
        typeof cat !== 'string' && cat.id === categoryValue
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
              category: categoryValue === "none" ? null : categoryValue,
              lunchMoneyCategory: categoryValue === "none" ? null : categoryName,
              originalData: {
                ...tx.originalData,
                category_id: categoryValue === "none" ? null : categoryValue,
                category_name: categoryValue === "none" ? null : categoryName
              },
              // Remove the "Trained" tag if it exists
              tags: hasTrainedTag ? filteredTags : tx.tags
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
      
      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setSuccessfulUpdates(prev => ({
          ...prev,
          [transactionId]: false
        }));
      }, 3000);
      
      // Show success toast
      setToastMessage({
        message: hasTrainedTag 
          ? 'Category updated and "Trained" tag removed' 
          : 'Category updated in Lunch Money',
        type: 'success'
      });
      
      // Close the dropdown after successful update
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to update category',
        type: 'error'
      });
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
    // Set the dateRange state first
    const newDateRange = {
      startDate: pendingDateRange.startDate,
      endDate: pendingDateRange.endDate
    };
    
    // Update state directly then fetch
    setDateRange(newDateRange);
    
    // Call fetchTransactions with the new date range directly
    fetchTransactionsWithDates(newDateRange);
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
    // Constants for polling
    const maxPolls = 120; // Maximum number of polling attempts (10 minutes with 5s interval)
    const pollInterval = 5000; // 5 seconds between polls
    const maxConsecutiveErrors = 3;
    let pollCount = 0;
    let consecutiveErrors = 0;
    
    setOperationInProgress(true);
    setOperationType(type);
    setProgressPercent(5); // Start with a little progress shown
    setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} started...`);

    while (pollCount < maxPolls) {
      try {
        pollCount++;
        
        // Update progress based on poll count (simple approximation)
        // Reserve the last 20% for completion
        const progressValue = Math.min(80, Math.floor((pollCount / maxPolls) * 100));
        setProgressPercent(progressValue);
        
        // Wait for the poll interval
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Call the service to check status
        console.log(`Checking ${type} status for prediction ID: ${predictionId} (attempt ${pollCount}/${maxPolls})`);
        
        const response = await fetch(`https://txclassify.onrender.com/status/${predictionId}`, {
          headers: {
            'X-API-Key': 'test_api_key_fixed',
            'Accept': 'application/json',
          },
        });

        // Handle different response codes
        if (!response.ok) {
          const statusCode = response.status;
          console.log(`Server returned error code: ${statusCode} for prediction ID: ${predictionId}`);

          // If we get a 502/503/504, the worker might have restarted
          if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
            consecutiveErrors++;
            setProgressMessage(`Server error (${statusCode}), retrying...`);

            if (consecutiveErrors >= maxConsecutiveErrors) {
              setToastMessage({
                message: `${type === 'training' ? 'Training' : 'Categorization'} failed after ${consecutiveErrors} consecutive worker errors`,
                type: 'error'
              });
              setOperationInProgress(false);
              setOperationType('none');
              return { status: 'failed', error: 'Too many consecutive worker errors' };
            }
            continue;
          }

          // For 404, could mean the prediction is gone/complete
          if (statusCode === 404) {
            // Early phase - job might not be registered yet
            if (pollCount < 5) {
              setProgressMessage('Waiting for job to start...');
              continue;
            }
            
            // Later phase - job might be complete and cleaned up
            if (pollCount > 20) {
              setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} complete.`);
              setProgressPercent(100);
              setTimeout(() => {
                setOperationInProgress(false);
                setOperationType('none');
              }, 2000);
              return { status: 'completed', message: 'Process completed' };
            }
            
            continue;
          }
          
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            setToastMessage({
              message: `${type === 'training' ? 'Training' : 'Categorization'} failed after ${consecutiveErrors} consecutive errors`,
              type: 'error'
            });
            setOperationInProgress(false);
            setOperationType('none');
            return { status: 'failed', error: 'Too many consecutive errors' };
          }
          continue;
        }

        // Reset consecutive errors on successful response
        consecutiveErrors = 0;

        // Parse the response
        const result = await response.json();
        console.log("Status response:", result);

        // Handle completed status
        if (result.status === "completed") {
          setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`);
          setProgressPercent(100);
          
          // Show success toast
          setToastMessage({
            message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`,
            type: 'success'
          });
          
          // Keep progress bar visible for a moment
          setTimeout(() => {
            setOperationInProgress(false);
            setOperationType('none');
          }, 2000);
          
          return { 
            status: 'completed', 
            results: result.results || result.config?.results || [], 
            message: `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!` 
          };
        } else if (result.status === "failed") {
          const errorMessage = result.error || result.message || 'Unknown error';
          setProgressMessage(`${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`);
          
          setToastMessage({
            message: `${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`,
            type: 'error'
          });
          
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: errorMessage };
        }

        // Still in progress, update progress message
        let statusMessage = `${type === 'training' ? 'Training' : 'Categorization'} in progress...`;
        if (result.message) {
          statusMessage += ` ${result.message}`;
        }
        setProgressMessage(statusMessage);
        
      } catch (error) {
        console.error('Error polling status:', error);
        
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setToastMessage({
            message: `Failed to check ${type === 'training' ? 'training' : 'categorization'} status after ${consecutiveErrors} consecutive errors`,
            type: 'error'
          });
          setOperationInProgress(false);
          setOperationType('none');
          return { status: 'failed', error: 'Error checking status' };
        }
      }
    }

    // If we reach here, we've polled too many times without completion
    setToastMessage({
      message: `${type === 'training' ? 'Training' : 'Categorization'} is taking longer than expected. Please try again.`,
      type: 'error'
    });
    setOperationInProgress(false);
    setOperationType('none');
    return { status: 'unknown', message: 'Maximum polling attempts reached' };
  };

  // Update handleTrainSelected to use the new polling function
  const handleTrainSelected = async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({
        message: "Please select at least one transaction for training",
        type: "error"
      });
      return;
    }

    if (selectedTransactions.length < 10) {
      setToastMessage({
        message: "Please select at least 10 transactions for training (API requirement)",
        type: "error"
      });
      return;
    }

    // Show loading state
    setOperationInProgress(true);
    setOperationType('training');
    setProgressPercent(0);
    setProgressMessage('Preparing training data...');

    try {
      // Format transactions for training to match the API schema requirements
      const trainingData = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId))
        .map(tx => ({
          description: tx.description, // Required by API schema
          Category: tx.lunchMoneyCategory || 'Uncategorized' // Required by API schema with capital C
        }));
      
      if (trainingData.length === 0) {
        throw new Error('No valid transactions selected for training');
      }

      // Prepare the payload based on the API schema
      const payload = {
        transactions: trainingData,
        userId: 'test_user_fixed', // For testing
        expenseSheetId: 'lunchmoney', // Required
        spreadsheetId: 'lunchmoney', // Required for classification
        // Include column configuration
        columnOrderCategorisation: {
          descriptionColumn: "B",
          categoryColumn: "C",
        },
        categorisationRange: "A:Z",
        categorisationTab: "LunchMoney"
      };

      setProgressPercent(10);
      setProgressMessage('Sending training request...');

      // Call the training API endpoint
      const response = await fetch('https://txclassify.onrender.com/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test_api_key_fixed'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Training request failed');
      }

      const result = await response.json();
      console.log("Training response:", result);

      // If we have a prediction ID, start polling
      if (result.prediction_id || result.predictionId) {
        const predictionId = result.prediction_id || result.predictionId;
        localStorage.setItem('training_prediction_id', predictionId);
        
        // Poll for status
        const pollResult = await pollForCompletion(predictionId, 'training');
        
        // If training completed successfully, apply "Trained" tag to selected transactions
        if (pollResult.status === 'completed') {
          await tagTransactionsAsTrained(selectedTransactions);
        }
        
        return pollResult;
      } else {
        throw new Error('No prediction ID received from training service');
      }
    } catch (error) {
      console.error('Error starting training:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to start training',
        type: 'error'
      });
      setOperationInProgress(false);
      setOperationType('none');
    }
  };

  // Update handleCategorizeSelected to use the new polling function
  const handleCategorizeSelected = async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({
        message: "Please select at least one transaction for categorization",
        type: "error"
      });
      return;
    }

    // Show loading state
    setOperationInProgress(true);
    setOperationType('categorizing');
    setProgressPercent(0);
    setProgressMessage('Preparing to categorize transactions...');

    try {
      // Get the selected transactions with all their data
      const selectedTxs = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
      
      if (selectedTxs.length === 0) {
        throw new Error('No valid transactions selected for categorization');
      }
        
      // Transactions to classify should include description but no category
      const transactionsToClassify = selectedTxs.map(tx => tx.description);
      
      setProgressPercent(10);
      setProgressMessage('Sending categorization request...');
      
      // Prepare the payload for the categorization API
      const payload = {
        transactions: transactionsToClassify,
        userId: 'test_user_fixed',
        spreadsheetId: 'test-sheet-id',
        sheetName: 'test-sheet',
        categoryColumn: 'E',
        startRow: '1'
      };

      // Call the categorization API endpoint
      const response = await fetch('https://txclassify.onrender.com/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test_api_key_fixed'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        throw new Error(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData || 'Categorization request failed');
      }

      const result = await response.json();
      console.log("Categorization response:", result);

      // If we have a prediction ID, start polling for results
      if (result.prediction_id) {
        const predictionId = result.prediction_id;
        localStorage.setItem('categorization_prediction_id', predictionId);
        
        // Wait a bit before polling to allow the backend to start processing
        setProgressPercent(15);
        setProgressMessage('Waiting for categorization to initialize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Poll for categorization results
        const pollResult = await pollForCompletion(predictionId, 'categorizing');
        
        if (pollResult.status === 'completed' && pollResult.results) {
          // Process results from pollResult
          updateTransactionsWithPredictions(pollResult.results);
        }
        
        return pollResult;
      } else {
        throw new Error('No prediction ID received from categorization service');
      }
    } catch (error) {
      console.error('Error during categorization:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to categorize transactions',
        type: 'error'
      });
      setOperationInProgress(false);
      setOperationType('none');
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
    
    // Enable the filter to show only categorized transactions
    setShowOnlyCategorized(true);
    
    // Create a mapping of transaction IDs to predicted categories and scores for easier access
    const pendingUpdates: Record<string, {categoryId: string, score: number}> = {};
    
    // Map the predictions to transaction IDs
    selectedTransactions.forEach(txId => {
      const tx = transactions.find(t => t.lunchMoneyId === txId);
      if (tx && tx.description) {
        const prediction = newCategorizedTransactions.get(tx.description);
        if (prediction) {
          // Find the category ID for this predicted category name
          const categoryObj = categories.find(cat => 
            typeof cat !== 'string' && 
            cat.name.toLowerCase() === prediction.category.toLowerCase()
          );
          
          // Use the found category ID or the category name as fallback
          const categoryId = categoryObj && typeof categoryObj !== 'string' 
            ? categoryObj.id 
            : prediction.category;
          
          pendingUpdates[txId] = {
            categoryId,
            score: prediction.score
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
    if (showOnlyCategorized) {
      return transactions.filter(tx => 
        selectedTransactions.includes(tx.lunchMoneyId) && 
        Object.keys(pendingCategoryUpdates).includes(tx.lunchMoneyId)
      );
    }
    
    if (showOnlyUncategorized) {
      return transactions.filter(tx => 
        !tx.originalData?.category_id && 
        !tx.lunchMoneyCategory
      );
    }
    
    return transactions;
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
    <div className="text-gray-900 dark:text-gray-100 text-sm bg-white dark:bg-slate-900 min-h-screen p-4">
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
        {/* Date filters */}
        <TransactionFilters
          pendingDateRange={pendingDateRange}
          handleDateRangeChange={handleDateRangeChange}
          applyDateFilter={applyDateFilter}
          operationInProgress={operationInProgress}
          showOnlyUncategorized={showOnlyUncategorized}
          setShowOnlyUncategorized={setShowOnlyUncategorized}
          showOnlyCategorized={showOnlyCategorized}
          setShowOnlyCategorized={setShowOnlyCategorized}
          pendingCategoryUpdates={pendingCategoryUpdates}
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