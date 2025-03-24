'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type Transaction = {
  id?: string;
  date: string | Date;
  description: string;
  amount: number;
  type: string;
  lunchMoneyId: string;
  lunchMoneyCategory?: string | null;
  notes?: string;
  category?: string | null;
  isTrainingData?: boolean;
  predictedCategory?: string;
  similarityScore?: number;
  originalData?: any;
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
      setCategories(data.categories || []);
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
      
      // Ensure all transaction amounts are numbers
      let formattedTransactions = data.transactions.map((tx: any) => ({
        ...tx,
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount))
      }));
      
      // Sort transactions by date in descending order (newest first)
      formattedTransactions = formattedTransactions.sort((a: Transaction, b: Transaction) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTransactions(formattedTransactions);
      
      // Clear any previous selections when new transactions are loaded
      setSelectedTransactions([]);
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
    setEditingTransaction(null);
    setUpdatingCategory(transactionId);
    
    const transaction = transactions.find(tx => tx.lunchMoneyId === transactionId);
    if (!transaction) {
      setUpdatingCategory(null);
      return;
    }
    
    console.log(`Updating transaction ${transactionId} with category: "${categoryValue}"`);
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Find category ID that matches the name (especially for predicted categories which come as names)
        let categoryId = categoryValue;
        
        // If it's a name (like from prediction) and not already a numeric ID, try to find the ID
        if (categoryValue && isNaN(Number(categoryValue))) {
          console.log(`Looking for category ID matching name: "${categoryValue}"`);
          
          // Need to fetch categories to get their IDs
          const catResponse = await fetch('/api/lunch-money/categories', {
            signal: AbortSignal.timeout(5000) // 5 second timeout for category fetch
          });
          
          if (!catResponse.ok) {
            throw new Error('Failed to fetch categories while updating');
          }
          
          const catData = await catResponse.json();
          const matchingCategory = catData.categories.find(
            (cat: Category | string) => {
              if (typeof cat === 'string') {
                return cat.toLowerCase() === categoryValue.toLowerCase();
              }
              return cat.name.toLowerCase() === categoryValue.toLowerCase();
            }
          );
          
          if (matchingCategory) {
            categoryId = typeof matchingCategory === 'string' ? matchingCategory : matchingCategory.id;
            console.log(`Found matching category ID: ${categoryId} for "${categoryValue}"`);
          } else {
            console.warn(`No matching category found for "${categoryValue}"`);
          }
        }
        
        console.log('Sending update to API:', {
          transactionId: transaction.lunchMoneyId,
          categoryId: categoryValue === "none" ? null : categoryId
        });
        
        // Use the Lunch Money API to update the category with a 10 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId: transaction.lunchMoneyId,
              categoryId: categoryValue === "none" ? null : categoryId
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          const responseData = await response.json();
          console.log("Update category response:", responseData);

          if (!response.ok) {
            throw new Error(responseData.error || 'Failed to update category in Lunch Money');
          }

          // Update local state to reflect the change
          setTransactions(prev => 
            prev.map(tx => {
              if (tx.lunchMoneyId === transactionId) {
                return {
                  ...tx,
                  category: categoryValue === "none" ? null : categoryValue,
                  lunchMoneyCategory: categoryValue === "none" ? null : categoryValue
                };
              }
              return tx;
            })
          );

          // Show success message
          setToastMessage({
            message: 'Category updated in Lunch Money',
            type: 'success'
          });
          
          // If we get here, the update was successful
          break;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error(`Error updating category (attempt ${retryCount + 1}/${maxRetries}):`, error);
        
        // If this was our last retry, show the error
        if (retryCount === maxRetries - 1) {
          setToastMessage({
            message: error instanceof Error ? error.message : 'Failed to update category in Lunch Money',
            type: 'error'
          });
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          retryCount++;
          continue;
        }
      }
    }
    
    setUpdatingCategory(null);
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

  const handleTrainSelected = async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({
        message: "Please select at least one transaction for training",
        type: "error"
      });
      return;
    }

    // Show loading state
    setToastMessage({
      message: 'Preparing to train classification model...',
      type: 'success'
    });

    try {
      // Format transactions for training to match the CSV format
      const trainingData = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId))
        .map(tx => ({
          Narrative: tx.description, // This is required - matches the CSV format
          Category: tx.lunchMoneyCategory || 'Uncategorized', // This is required - matches the CSV format
          amount: tx.amount,
          date: typeof tx.date === 'string' 
            ? tx.date 
            : tx.date instanceof Date 
              ? format(tx.date, 'yyyy-MM-dd')
              : format(new Date(), 'yyyy-MM-dd'),
          id: tx.lunchMoneyId
        }));
      
      if (trainingData.length === 0) {
        throw new Error('No valid transactions selected for training');
      }

      // Get list of unique categories from our dataset to provide to the model
      const uniqueCategories = Array.from(new Set(
        transactions
          .filter(tx => tx.lunchMoneyCategory && tx.lunchMoneyCategory !== 'Uncategorized')
          .map(tx => tx.lunchMoneyCategory)
      )) || ['Food & Drink', 'Transport', 'Shopping', 'Entertainment', 'Bills & Utilities'];

      // Prepare the payload for the training API based on test-api-endpoints.js
      const payload = {
        transactions: trainingData,
        categories: uniqueCategories, // Add categories list to help the model learn
        userId: 'test_user_fixed',
        expenseSheetId: 'lunchmoney', // Include this as in test-api-endpoints.js
        spreadsheetId: 'lunchmoney', // Include this too since the error shows it's looking for it
        columnOrderCategorisation: {
          descriptionColumn: "B",
          categoryColumn: "C",
        },
        categorisationRange: "A:Z",
        categorisationTab: "LunchMoney"
      };

      console.log("Sending payload to training API:", JSON.stringify(payload));

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
        const errorData = await response.json().catch(() => response.text());
        console.error("Training API error:", errorData);
        throw new Error(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData || 'Training request failed');
      }

      const result = await response.json();
      console.log("Training response:", result);

      // If we have a prediction ID, store it for status checking
      if (result.prediction_id || result.predictionId) {
        const predictionId = result.prediction_id || result.predictionId;
        localStorage.setItem('training_prediction_id', predictionId);
        
        // Show success message
        setToastMessage({
          message: `Training started! Monitoring progress...`,
          type: 'success'
        });
        
        // Instead of immediately redirecting, poll for status
        const [pollPromise, pollTimeout] = withTimeout(
          pollTrainingStatus(predictionId),
          60000 // 1 minute timeout
        );
        
        try {
          const pollResult = await pollPromise;
          console.log("Polling completed:", pollResult);
          
          if (pollResult.status === 'completed') {
            // On success, redirect to status page to view results
            router.push(`/lunch-money/training-status?prediction_id=${predictionId}`);
          } else if (pollResult.status === 'failed') {
            // On failure, show error but don't redirect
            setToastMessage({
              message: `Training failed: ${pollResult.error || 'Unknown error'}`,
              type: 'error'
            });
          } else {
            // On unknown/timeout, redirect to status page for manual checking
            setToastMessage({
              message: 'Redirecting to status page for detailed progress...',
              type: 'success'
            });
            router.push(`/lunch-money/training-status?prediction_id=${predictionId}`);
          }
        } catch (pollError) {
          console.error("Error during polling:", pollError);
          // On polling error, redirect to status page
          setToastMessage({
            message: 'Training started but monitoring failed. Redirecting to status page...',
            type: 'success'
          });
          router.push(`/lunch-money/training-status?prediction_id=${predictionId}`);
        }
      } else {
        throw new Error('No prediction ID received from training service');
      }
    } catch (error) {
      console.error('Error starting training:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to start training',
        type: 'error'
      });
    }
  };

  // Add this function outside of handleTrainSelected but inside the component
  const pollTrainingStatus = async (predictionId: string) => {
    // Constants for polling
    const maxPolls = 120; // Maximum number of polling attempts (10 minutes with 5s interval)
    const pollInterval = 5000; // 5 seconds between polls
    const maxConsecutiveErrors = 3;
    let pollCount = 0;
    let consecutiveErrors = 0;
    
    setToastMessage({
      message: 'Checking training status...',
      type: 'success'
    });

    while (pollCount < maxPolls) {
      try {
        pollCount++;
        
        // Wait for the poll interval
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Call the service to check status
        console.log(`Checking training status for prediction ID: ${predictionId} (attempt ${pollCount}/${maxPolls})`);
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
            console.warn(`Worker error (${statusCode}) on attempt ${pollCount}, consecutive errors: ${consecutiveErrors}`);

            if (consecutiveErrors >= maxConsecutiveErrors) {
              setToastMessage({
                message: `Training failed after ${consecutiveErrors} consecutive worker errors`,
                type: 'error'
              });
              return { status: 'failed', error: 'Too many consecutive worker errors' };
            }
            continue;
          }

          // For 404, could mean the prediction is gone/complete
          if (statusCode === 404) {
            setToastMessage({
              message: 'Training status no longer available. It may have completed.',
              type: 'success'
            });
            return { status: 'unknown', message: 'Status no longer available' };
          }
          
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            setToastMessage({
              message: `Training failed after ${consecutiveErrors} consecutive errors`,
              type: 'error'
            });
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
          setToastMessage({
            message: 'Training completed successfully!',
            type: 'success'
          });
          return { status: 'completed', message: 'Training completed successfully!' };
        } else if (result.status === "failed") {
          const errorMessage = result.error || result.message || 'Unknown error';
          setToastMessage({
            message: `Training failed: ${errorMessage}`,
            type: 'error'
          });
          return { status: 'failed', error: errorMessage };
        }

        // Still in progress, update toast with status
        setToastMessage({
          message: `Training in progress... ${result.message || ''}`,
          type: 'success'
        });
        
      } catch (error) {
        console.error('Error polling status:', error);
        
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setToastMessage({
            message: `Failed to check training status after ${consecutiveErrors} consecutive errors`,
            type: 'error'
          });
          return { status: 'failed', error: 'Error checking status' };
        }
      }
    }

    // If we reach here, we've polled too many times without completion
    setToastMessage({
      message: 'Training is taking longer than expected. Please check status page.',
      type: 'success'
    });
    return { status: 'unknown', message: 'Maximum polling attempts reached' };
  };

  // Add utility function for timeout
  const withTimeout = <T,>(promise: Promise<T>, timeout: number): [Promise<T>, NodeJS.Timeout] => {
    let timeoutId: NodeJS.Timeout = setTimeout(() => {}, 0); // Initialize with a dummy timeout
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
    
    // Create a race between the original promise and the timeout
    const wrappedPromise = Promise.race([
      promise,
      timeoutPromise
    ]) as Promise<T>;
    
    // Ensure the timeout is cleared when the promise resolves or rejects
    wrappedPromise.finally(() => clearTimeout(timeoutId));
    
    return [wrappedPromise, timeoutId];
  };

  const handleCategorizeSelected = async () => {
    if (selectedTransactions.length === 0) {
      setToastMessage({
        message: "Please select at least one transaction for categorization",
        type: "error"
      });
      return;
    }

    // Show loading state
    setCategorizing(true);
    setToastMessage({
      message: 'Preparing to categorize transactions...',
      type: 'success'
    });

    try {
      // Get the selected transactions with all their data
      const selectedTxs = transactions
        .filter(tx => selectedTransactions.includes(tx.lunchMoneyId));
      
      if (selectedTxs.length === 0) {
        throw new Error('No valid transactions selected for categorization');
      }
        
      // Transactions to classify should include description but no category
      const transactionsToClassify = selectedTxs.map(tx => tx.description);
      
      // Prepare the payload for the categorization API according to API schema
      // Using the exact values that work in test-api-endpoints.js
      const payload = {
        transactions: transactionsToClassify,
        // categories: uniqueCategories, // Removing this as it's not in the working example
        userId: 'test_user_fixed',
        spreadsheetId: 'test-sheet-id', // Changed to match test-api-endpoints.js
        sheetName: 'test-sheet', // Changed to match test-api-endpoints.js
        categoryColumn: 'E',
        startRow: '1'
      };

      console.log("Sending payload to categorization API:", JSON.stringify(payload));

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
        console.error("Categorization API error:", errorData);
        throw new Error(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData || 'Categorization request failed');
      }

      const result = await response.json();
      console.log("Categorization response:", result);

      // If we have a prediction ID, start polling for results
      if (result.prediction_id) {
        const predictionId = result.prediction_id;
        localStorage.setItem('categorization_prediction_id', predictionId);
        
        // Show processing message
        setToastMessage({
          message: `Categorization started! Monitoring progress...`,
          type: 'success'
        });
        
        // Wait a bit longer before starting to poll to allow the backend to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Poll for categorization results
        const [pollPromise, pollTimeout] = withTimeout(
          pollCategorizationStatus(predictionId),
          120000 // 2 minute timeout (longer than before)
        );
        
        try {
          const pollResult = await pollPromise;
          console.log("Polling completed:", pollResult);
          
          // Direct handler for the format in the error message
          if (pollResult && 
              pollResult.status === 'completed' && 
              pollResult.results && 
              Array.isArray(pollResult.results)) {
            console.log("Using the standard results array format");
            updateTransactionsWithPredictions(pollResult.results);
            setToastMessage({
              message: `Successfully categorized ${pollResult.results.length} transactions!`,
              type: 'success'
            });
            return;
          }
          
          // Handle the exact format from the error message
          if (pollResult && 
              pollResult.status === 'completed' && 
              pollResult.config && 
              pollResult.results && 
              Array.isArray(pollResult.results)) {
            console.log("Using the format from the error message with config and results");
            updateTransactionsWithPredictions(pollResult.results);
            setToastMessage({
              message: `Successfully categorized ${pollResult.results.length} transactions!`,
              type: 'success'
            });
            return;
          }
          
          // Extract results based on the response format
          let resultsToUse = [];
          
          if (pollResult.results && Array.isArray(pollResult.results)) {
            // Direct results array
            resultsToUse = pollResult.results;
            console.log("Using direct results array from polling response");
          } 
          else if (pollResult.config && pollResult.config.results && Array.isArray(pollResult.config.results)) {
            // Results in config.results format
            resultsToUse = pollResult.config.results;
            console.log("Using results from config.results in polling response");
          }
          // For the format in your example, where results are directly in the config property
          else if (pollResult.config && Array.isArray(pollResult.config.results)) {
            resultsToUse = pollResult.config.results;
            console.log("Using results array from config.results");
          }
          else if (pollResult.config && Array.isArray(pollResult.config)) {
            resultsToUse = pollResult.config;
            console.log("Using config array as results");
          }
          
          // Check if we might need to extract from your specific format
          if (resultsToUse.length === 0 && pollResult.config) {
            console.log("Checking for results in specific API format");
            // Try to get results directly from the root of the response
            if (pollResult.config.results) {
              resultsToUse = Array.isArray(pollResult.config.results) 
                ? pollResult.config.results 
                : [pollResult.config.results];
              console.log("Found results in config.results");
            }
          }
          
          if (resultsToUse.length > 0) {
            // Update transactions with predicted categories
            updateTransactionsWithPredictions(resultsToUse);
            
            setToastMessage({
              message: `Successfully categorized ${resultsToUse.length} transactions!`,
              type: 'success'
            });
          } else if (pollResult.status === 'failed') {
            setToastMessage({
              message: `Categorization failed: ${pollResult.error || 'Unknown error'}`,
              type: 'error'
            });
          } else {
            // Last resort - try to use the results array from the example format
            if (typeof pollResult === 'object' && pollResult && 'config' in pollResult) {
              const apiResponse = pollResult as any;
              if (apiResponse.results && Array.isArray(apiResponse.results)) {
                updateTransactionsWithPredictions(apiResponse.results);
                setToastMessage({
                  message: `Successfully categorized ${apiResponse.results.length} transactions!`,
                  type: 'success'
                });
                return;
              }
            }
            
            setToastMessage({
              message: 'No categorization results were found. Please check the console for details.',
              type: 'error'
            });
          }
        } catch (pollError) {
          console.error("Error during polling:", pollError);
          setToastMessage({
            message: 'Error checking categorization status. Please try again.',
            type: 'error'
          });
        }
      } else {
        throw new Error('No prediction ID received from categorization service');
      }
    } catch (error) {
      console.error('Error during categorization:', error);
      setToastMessage({
        message: error instanceof Error ? error.message : 'Failed to categorize transactions',
        type: 'error'
      });
    } finally {
      setCategorizing(false);
    }
  };

  // Function to poll categorization status
  const pollCategorizationStatus = async (predictionId: string) => {
    // Constants for polling
    const maxPolls = 60; // Maximum number of polling attempts (5 minutes with 5s interval)
    const initialDelay = 5000; // Initial delay before first poll (5 seconds)
    const pollInterval = 7000; // 7 seconds between polls
    const maxConsecutiveErrors = 3;
    let pollCount = 0;
    let consecutiveErrors = 0;
    let earlyPhase = true; // Flag for the early polling phase
    
    setToastMessage({
      message: 'Waiting for categorization to start...',
      type: 'success'
    });

    // Initial delay to allow the backend to set up the job
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    while (pollCount < maxPolls) {
      try {
        pollCount++;
        
        // The first few attempts are in the "early phase" where 404s are more expected
        if (pollCount > 5) {
          earlyPhase = false;
        }
        
        // Call the service to check status
        console.log(`Checking categorization status for prediction ID: ${predictionId} (attempt ${pollCount}/${maxPolls})`);
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
            console.warn(`Worker error (${statusCode}) on attempt ${pollCount}, consecutive errors: ${consecutiveErrors}`);

            if (consecutiveErrors >= maxConsecutiveErrors) {
              setToastMessage({
                message: `Categorization failed after ${consecutiveErrors} consecutive worker errors`,
                type: 'error'
              });
              return { status: 'failed', error: 'Too many consecutive worker errors' };
            }
            
            // Use a longer delay for server errors
            await new Promise(resolve => setTimeout(resolve, pollInterval * 1.5));
            continue;
          }

          // For 404, could mean the prediction is still initializing or already complete
          if (statusCode === 404) {
            // During early phase, 404 is likely because job hasn't started yet
            if (earlyPhase) {
              console.log("Received 404 in early phase - job may still be initializing");
              setToastMessage({
                message: 'Waiting for categorization to initialize...',
                type: 'success'
              });
              // Use a longer delay during early phase for 404s
              await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
              continue;
            }
            
            // If we're in mid-phase (not too early, not too late), keep trying
            if (pollCount < 20) {
              console.log("Received 404 after several attempts - still waiting for job to be found");
              await new Promise(resolve => setTimeout(resolve, pollInterval * 1.5));
              continue;
            }
            
            // Later in the process, 404 might mean the job is complete and data was cleaned up
            console.log("Received 404 after many attempts - job may have completed and been cleaned up");
            setToastMessage({
              message: 'Categorization status no longer available. Please check results in the UI.',
              type: 'success'
            });
            return { status: 'unknown', message: 'Status no longer available' };
          }
          
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            setToastMessage({
              message: `Categorization failed after ${consecutiveErrors} consecutive errors`,
              type: 'error'
            });
            return { status: 'failed', error: 'Too many consecutive errors' };
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        // Reset consecutive errors on successful response
        consecutiveErrors = 0;

        // Parse the response
        let result;
        try {
          const responseText = await response.text();
          console.log("Raw status response:", responseText);
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          consecutiveErrors++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        console.log("Parsed status response:", result);

        // Extract results from the response based on various potential formats
        let results = [];
        
        // Direct results array at root level
        if (Array.isArray(result.results)) {
          results = result.results;
          console.log("Found results array at root level");
        } 
        // Results in result.result.results (common in API response)
        else if (result.result && result.result.results) {
          if (Array.isArray(result.result.results)) {
            results = result.result.results;
            console.log("Found results array in result.result.results");
          } else if (result.result.results.data && Array.isArray(result.result.results.data)) {
            results = result.result.results.data;
            console.log("Found results array in result.result.results.data");
          }
        }
        // Sometimes nested under config result
        else if (result.config && result.config.result && result.config.result.results) {
          results = result.config.result.results;
          console.log("Found results array in config.result.results");
        }
        // Direct in config.results as seen in the API response you shared
        else if (result.config && result.results) {
          results = result.results;
          console.log("Found results array in root with config present");
        }
        // Special case to match the exact format you shared in the error
        else if (result.status === "completed" && result.config && Array.isArray(result.results)) {
          results = result.results;
          console.log("Found results array in root level matching the example format");
        }

        console.log(`Extracted ${results.length} results`);

        // If we still don't have results, check for the format in the example you provided
        if (results.length === 0 && result.status === "completed") {
          if (Array.isArray(result.results)) {
            results = result.results;
            console.log("Using results array from completed response");
          }
        }

        // Handle completed status
        if (result.status === "completed") {
          setToastMessage({
            message: 'Categorization completed successfully!',
            type: 'success'
          });
          return { 
            status: 'completed', 
            results, 
            config: result.config, // Include the config when available
            message: 'Categorization completed successfully!' 
          };
        } else if (result.status === "failed") {
          const errorMessage = result.error || result.message || 'Unknown error';
          setToastMessage({
            message: `Categorization failed: ${errorMessage}`,
            type: 'error'
          });
          return { status: 'failed', error: errorMessage };
        }

        // If we have results but status isn't explicitly completed, consider it complete
        if (results.length > 0) {
          setToastMessage({
            message: 'Categorization completed with results!',
            type: 'success'
          });
          return { 
            status: 'completed', 
            results, 
            config: result.config, // Include the config when available
            message: 'Categorization completed with results!' 
          };
        }

        // Still in progress, update toast with status
        setToastMessage({
          message: `Categorization in progress... ${result.message || ''}`,
          type: 'success'
        });
        
        // Wait for the poll interval before next attempt
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling status:', error);
        
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setToastMessage({
            message: `Failed to check categorization status after ${consecutiveErrors} consecutive errors`,
            type: 'error'
          });
          return { status: 'failed', error: 'Error checking status' };
        }
        
        // Wait for the poll interval before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // If we reach here, we've polled too many times without completion
    setToastMessage({
      message: 'Categorization is taking longer than expected. Please try again later.',
      type: 'error'
    });
    return { status: 'unknown', message: 'Maximum polling attempts reached' };
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
    
    // Map of narratives to predicted categories
    const predictionMap = new Map();
    
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
        predictionMap.set(narrative, {
          category: predictedCategory,
          score: similarityScore
        });
      } else {
        console.log(`Result ${index+1} is missing required fields:`, result);
      }
    });
    
    console.log("Built prediction map with", predictionMap.size, "entries");
    console.log("Selected transaction IDs:", selectedTransactions);
    
    // Keep track of how many transactions were updated
    let updatedCount = 0;
    
    // Update transactions with predictions
    setTransactions(prev => {
      const updated = prev.map(tx => {
        // Check if this transaction is selected
        if (!selectedTransactions.includes(tx.lunchMoneyId)) {
          return tx;
        }
        
        // Find prediction that matches this transaction description
        const prediction = predictionMap.get(tx.description);
        
        if (prediction) {
          console.log(`Matched transaction "${tx.description}" with prediction:`, prediction);
          updatedCount++;
          return {
            ...tx,
            predictedCategory: prediction.category,
            similarityScore: prediction.score
          };
        }
        
        // If no exact match, try to find by substring
        for (const [narrative, pred] of predictionMap.entries()) {
          if (tx.description.includes(narrative) || narrative.includes(tx.description)) {
            console.log(`Fuzzy matched "${tx.description}" with "${narrative}"`);
            updatedCount++;
            return {
              ...tx,
              predictedCategory: pred.category,
              similarityScore: pred.score
            };
          }
        }
        
        console.log(`No match found for transaction: "${tx.description}"`);
        return tx;
      });
      
      console.log(`Updated ${updatedCount} transactions with predictions`);
      return updated;
    });
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

  return (
    <div>
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMessage.message}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={pendingDateRange.startDate}
              onChange={handleDateRangeChange}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={pendingDateRange.endDate}
              onChange={handleDateRangeChange}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={applyDateFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4 md:mt-auto"
          >
            Apply Date Filter
          </button>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            onClick={handleImportTransactions}
            disabled={loading || transactions.length === 0 || importStatus === 'importing'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
          >
            {importStatus === 'importing' ? 'Importing...' : 'Import All to Database'}
          </button>
          <button
            onClick={handleTrainSelected}
            disabled={selectedTransactions.length === 0 || categorizing}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
          >
            Train with Selected ({selectedTransactions.length})
          </button>
          <button
            onClick={handleCategorizeSelected}
            disabled={selectedTransactions.length === 0 || categorizing}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300"
          >
            {categorizing ? 'Categorizing...' : 'Categorize Selected'} ({selectedTransactions.length})
          </button>
        </div>
      </div>

      {importStatus !== 'idle' && (
        <div className={`mb-4 p-4 rounded ${
          importStatus === 'success' ? 'bg-green-50 text-green-700' : 
          importStatus === 'error' ? 'bg-red-50 text-red-700' : 
          'bg-blue-50 text-blue-700'
        }`}>
          {importMessage}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found for the selected date range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2">Select</span>
                  </label>
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Lunch Money Category</th>
                <th className="px-4 py-2 text-left">Predicted Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.lunchMoneyId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.lunchMoneyId)}
                      onChange={() => handleSelectTransaction(transaction.lunchMoneyId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {typeof transaction.date === 'string' 
                      ? transaction.date 
                      : transaction.date instanceof Date 
                        ? format(transaction.date, 'yyyy-MM-dd')
                        : 'Invalid date'
                    }
                  </td>
                  <td className="px-4 py-2">{transaction.description}</td>
                  <td className={`px-4 py-2 ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {typeof transaction.amount === 'number' 
                      ? transaction.amount.toFixed(2) 
                      : parseFloat(String(transaction.amount)).toFixed(2)}
                  </td>
                  <td 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 relative"
                    onClick={() => {
                      if (!transaction.lunchMoneyId) return;
                      startEditing(transaction.lunchMoneyId);
                    }}
                  >
                    {editingTransaction === transaction.lunchMoneyId ? (
                      <div className="relative">
                        <select
                          ref={categoryInputRef}
                          className="w-full p-1 border border-gray-300 rounded"
                          value={transaction.category || "none"}
                          onChange={(e) => {
                            handleCategoryChange(transaction.lunchMoneyId, e.target.value);
                          }}
                          onBlur={() => setEditingTransaction(null)}
                        >
                          <option value="none">-- Uncategorized --</option>
                          {categories.map(category => 
                            typeof category === 'string' ? (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ) : (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className={updatingCategory === transaction.lunchMoneyId ? 'opacity-50' : ''}>
                          {transaction.category ? transaction.category : 
                          transaction.lunchMoneyCategory ? transaction.lunchMoneyCategory : 'Uncategorized'}
                        </span>
                        {updatingCategory === transaction.lunchMoneyId ? (
                          <span className="ml-2 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <span className="text-blue-500 opacity-0 group-hover:opacity-100">✏️</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {transaction.lunchMoneyCategory || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-2">
                    {transaction.predictedCategory ? (
                      <div className="flex items-center">
                        <span>{transaction.predictedCategory}</span>
                        {transaction.similarityScore && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({Math.round(transaction.similarityScore * 100)}%)
                          </span>
                        )}
                        {transaction.predictedCategory && (transaction.lunchMoneyCategory !== transaction.predictedCategory) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryChange(transaction.lunchMoneyId, transaction.predictedCategory || '');
                            }}
                            className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    ) : (
                      'Not predicted'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 