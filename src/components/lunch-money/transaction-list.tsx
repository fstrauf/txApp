'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type Transaction = {
  id?: string;
  date: string | Date;
  description: string;
  amount: number;
  is_income: boolean;
  lunchMoneyId: string;
  lunchMoneyCategory?: string | null;
  notes?: string;
  category?: string | null;
  isTrainingData?: boolean;
  predictedCategory?: string;
  similarityScore?: number;
  originalData?: any;
  tags?: string[];
};

type Category = {
  id: string;
  name: string;
  description: string;
  isLunchMoneyCategory: boolean;
  excludeFromBudget: boolean;
  excludeFromTotals: boolean;
  isIncome: boolean;
};

export default function TransactionList() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<{ 
    startDate: string; 
    endDate: string 
  }>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth()-5, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dateRange, setDateRange] = useState(pendingDateRange);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [categories, setCategories] = useState<(string | Category)[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const categoryInputRef = useRef<HTMLSelectElement>(null);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [categorizing, setCategorizing] = useState(false);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [operationType, setOperationType] = useState<'none' | 'training' | 'categorizing'>('none');
  
  // New state variables for the categorization workflow
  const [showOnlyCategorized, setShowOnlyCategorized] = useState<boolean>(false);
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
      // Send update to the API
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryValue
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
      
      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setSuccessfulUpdates(prev => ({
          ...prev,
          [transactionId]: false
        }));
      }, 3000);
      
      // Show success toast
      setToastMessage({
        message: 'Category updated in Lunch Money',
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
    if (transactions.length === 0) return;
    
    console.log('Current transactions count:', transactions.length);
    console.log('Current selections count:', selectedTransactions.length);
    
    // If all or some transactions are selected, deselect all
    if (selectedTransactions.length > 0) {
      console.log('Deselecting all transactions');
      setSelectedTransactions([]);
    } else {
      // Otherwise, select all transactions with valid IDs
      console.log(transactions)
      const validIds = transactions
        .map(tx => tx.lunchMoneyId)
        .filter((id): id is string => id !== undefined && id !== null);
      
      console.log('Selecting all transactions:', validIds);
      setSelectedTransactions(validIds);
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
      setToastMessage({
        message: 'Applying "Trained" tag to selected transactions...',
        type: 'success'
      });
      
      const promises = transactionIds.map(async (transactionId) => {
        try {
          const response = await fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId,
              tags: ['Trained']  // Add the "Trained" tag
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
          if (transactionIds.includes(tx.lunchMoneyId)) {
            return {
              ...tx,
              tags: tx.tags ? [...tx.tags, 'Trained'] : ['Trained']
            };
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

  // Get filtered transactions based on categorization status
  const getFilteredTransactions = () => {
    if (showOnlyCategorized) {
      return transactions.filter(tx => 
        selectedTransactions.includes(tx.lunchMoneyId) && 
        Object.keys(pendingCategoryUpdates).includes(tx.lunchMoneyId)
      );
    }
    return transactions;
  };

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

  // Get the transactions to display based on the filter
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="text-gray-900 dark:text-gray-100 text-sm bg-white dark:bg-slate-900 min-h-screen">
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMessage.message}
        </div>
      )}

      {/* Operation Progress Bar */}
      {operationInProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 max-w-full">
            <div className="text-center mb-4">
              <h3 className="font-medium text-lg">
                {operationType === 'training' ? 'Training Model' : 'Categorizing Transactions'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{progressMessage}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className={`h-3 rounded-full ${operationType === 'training' ? 'bg-purple-600' : 'bg-yellow-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {progressPercent}%
            </p>
          </div>
        </div>
      )}

      {/* Header with title and action buttons */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200 dark:border-slate-700 mb-6">
        <h1 className="text-2xl font-bold">Lunch Money Transactions</h1>
        
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          >
            Settings
          </button>
          <button 
            onClick={handleCategorizeSelected}
            disabled={selectedTransactions.length === 0 || operationInProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
          >
            Classify Transactions
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug API
          </button>
        </div>
      </div>

      <div className="px-6">
        {/* Date filters and action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={pendingDateRange.startDate}
                onChange={handleDateRangeChange}
                className="p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 rounded text-sm"
                disabled={operationInProgress}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={pendingDateRange.endDate}
                onChange={handleDateRangeChange}
                className="p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 rounded text-sm"
                disabled={operationInProgress}
              />
            </div>
            <button
              onClick={applyDateFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 md:mt-5"
              disabled={operationInProgress}
            >
              Apply Date Filter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleImportTransactions}
              disabled={loading || transactions.length === 0 || importStatus === 'importing' || operationInProgress}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              {importStatus === 'importing' ? 'Importing...' : 'Import All to Database'}
            </button>
            <button
              onClick={handleTrainSelected}
              disabled={selectedTransactions.length === 0 || operationInProgress}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Train with Selected ({selectedTransactions.length})
            </button>
            <button
              onClick={handleCategorizeSelected}
              disabled={selectedTransactions.length === 0 || operationInProgress}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Categorize Selected ({selectedTransactions.length})
            </button>
          </div>
        </div>

        {importStatus !== 'idle' && (
          <div className={`mb-4 p-4 rounded ${
            importStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-100' : 
            importStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100' : 
            'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
          }`}>
            {importMessage}
          </div>
        )}

        {/* Categorization Controls - Styled banner */}
        {Object.keys(pendingCategoryUpdates).length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-amber-800 dark:text-amber-300">Categorization Results:</span>
                <span className="text-amber-800 dark:text-amber-300">{Object.keys(pendingCategoryUpdates).length} transactions categorized</span>
                
                <label className="inline-flex items-center ml-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    checked={showOnlyCategorized}
                    onChange={() => setShowOnlyCategorized(!showOnlyCategorized)}
                  />
                  <span className="ml-2 text-amber-800 dark:text-amber-300">Show only categorized transactions</span>
                </label>
              </div>
              
              <button
                onClick={applyAllPredictedCategories}
                disabled={applyingAll || Object.keys(pendingCategoryUpdates).length === 0}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                {applyingAll ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  `Apply All Categories (${Object.keys(pendingCategoryUpdates).length})`
                )}
              </button>
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            No transactions found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
            <table className="min-w-full bg-white dark:bg-slate-800 text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 accent-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-slate-600"
                      />
                      <span className="ml-2 font-medium">Select</span>
                    </label>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Predicted Category</th>
                  {Object.keys(pendingCategoryUpdates).length > 0 && (
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredTransactions.map((transaction) => {
                  const pendingUpdate = pendingCategoryUpdates[transaction.lunchMoneyId];
                  const hasPendingUpdate = !!pendingUpdate;
                  
                  return (
                    <tr key={transaction.lunchMoneyId} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                      hasPendingUpdate ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-800'
                    }`}>
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.lunchMoneyId)}
                          onChange={() => handleSelectTransaction(transaction.lunchMoneyId)}
                          className="h-4 w-4 accent-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        {typeof transaction.date === 'string' 
                          ? transaction.date 
                          : transaction.date instanceof Date 
                            ? format(transaction.date, 'yyyy-MM-dd')
                            : 'Invalid date'
                        }
                        {transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.tags?.map((tag: any, idx: number) => (
                              <span 
                                key={`${typeof tag === 'string' ? tag : tag.name || tag.id || idx}-${idx}`}
                                className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                                {typeof tag === 'string' ? tag : tag.name || 'Tag'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {typeof transaction.description === 'object' 
                          ? JSON.stringify(transaction.description) 
                          : transaction.description}
                      </td>
                      <td className={`px-4 py-3 align-top font-medium ${transaction.is_income ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {transaction.is_income ? '+' : '-'}
                        {typeof transaction.amount === 'number' 
                          ? Math.abs(transaction.amount).toFixed(2) 
                          : Math.abs(parseFloat(String(transaction.amount))).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="relative">
                          <select
                            value={transaction.originalData?.category_id || "none"}
                            onChange={(e) => handleCategoryChange(transaction.lunchMoneyId, e.target.value)}
                            disabled={updatingCategory === transaction.lunchMoneyId}
                            className={`w-full py-1.5 px-2 pr-8 appearance-none rounded border ${
                              successfulUpdates[transaction.lunchMoneyId] 
                                ? 'border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-950/20' 
                                : hasPendingUpdate
                                  ? 'border-amber-500 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            } text-gray-800 dark:text-gray-200`}
                          >
                            <option value="none">-- Uncategorized --</option>
                            {categories.map(category => {
                              const categoryId = typeof category === 'string' ? category : category.id;
                              const categoryName = typeof category === 'string' ? category : category.name;
                              
                              return (
                                <option key={categoryId} value={categoryId}>
                                  {categoryName}
                                </option>
                              );
                            })}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                          
                          {/* Loading spinner */}
                          {updatingCategory === transaction.lunchMoneyId && (
                            <div className="absolute right-0 top-0 h-full flex items-center pr-8">
                              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                          
                          {/* Success checkmark */}
                          {successfulUpdates[transaction.lunchMoneyId] && (
                            <div className="absolute right-0 top-0 h-full flex items-center pr-8">
                              <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {hasPendingUpdate ? (
                          <div className="flex items-center">
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {pendingUpdate.categoryId === "none" ? "Uncategorized" : 
                                getCategoryNameById(pendingUpdate.categoryId) || pendingUpdate.categoryId}
                            </span>
                            {pendingUpdate.score > 0 && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                ({Math.round(pendingUpdate.score * 100)}% match)
                              </span>
                            )}
                          </div>
                        ) : (
                          transaction.predictedCategory || "Not predicted"
                        )}
                      </td>
                      
                      {/* Actions column for Apply button */}
                      {Object.keys(pendingCategoryUpdates).length > 0 && (
                        <td className="px-4 py-3 align-top">
                          {hasPendingUpdate && (
                            <button
                              onClick={() => applyPredictedCategory(transaction.lunchMoneyId)}
                              disabled={applyingIndividual === transaction.lunchMoneyId || successfulUpdates[transaction.lunchMoneyId]}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                successfulUpdates[transaction.lunchMoneyId]
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed'
                              }`}
                            >
                              {applyingIndividual === transaction.lunchMoneyId ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Applying
                                </span>
                              ) : successfulUpdates[transaction.lunchMoneyId] ? (
                                <span className="flex items-center">
                                  <svg className="h-3 w-3 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Applied
                                </span>
                              ) : (
                                "Apply"
                              )}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}