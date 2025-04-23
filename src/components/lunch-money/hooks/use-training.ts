import { useState } from 'react';
import { Transaction } from '../types';

export type OperationType = 'none' | 'training' | 'categorizing';

export interface OperationState {
  inProgress: boolean;
  type: OperationType;
  progress: {
    percent: number;
    message: string;
  };
  result: {
    success: boolean;
    message: string | null;
    data: any[] | null;
  };
}

export function useTraining() {
  // Consolidated operation state
  const [operationState, setOperationState] = useState<OperationState>({
    inProgress: false,
    type: 'none',
    progress: {
      percent: 0,
      message: ''
    },
    result: {
      success: false,
      message: null,
      data: null
    }
  });

  // Reset operation state
  const resetOperationState = () => {
    setOperationState({
      inProgress: false,
      type: 'none',
      progress: {
        percent: 0,
        message: ''
      },
      result: {
        success: false,
        message: null,
        data: null
      }
    });
  };

  // Generic function to handle polling for both operations
  const pollForCompletion = async (
    predictionId: string, 
    type: 'training' | 'categorizing',
    onSuccess: (message: string, results?: any[]) => void,
    onError: (message: string) => void
  ) => {
    // Constants for polling
    const maxPolls = 120; // Maximum number of polling attempts (10 minutes with 5s interval)
    const pollInterval = 5000; // 5 seconds between polls
    const maxConsecutiveErrors = 3;
    let pollCount = 0;
    let consecutiveErrors = 0;
    
    // Set initial operation state
    setOperationState({
      inProgress: true,
      type,
      progress: {
        percent: 5, // Start with a little progress shown
        message: `${type === 'training' ? 'Training' : 'Categorization'} started...`
      },
      result: {
        success: false,
        message: null,
        data: null
      }
    });

    while (pollCount < maxPolls) {
      try {
        pollCount++;
        
        // Update progress based on poll count (simple approximation)
        // Reserve the last 20% for completion
        const progressValue = Math.min(80, Math.floor((pollCount / maxPolls) * 100));
        
        // Update progress
        setOperationState(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            percent: progressValue
          }
        }));
        
        // Wait for the poll interval
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Call the service to check status
        console.log(`Checking ${type} status for prediction ID: ${predictionId} (attempt ${pollCount}/${maxPolls})`);
        
        const response = await fetch(`${process.env.EXPENSE_SORTED_API}/status/${predictionId}`, {
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
            
            setOperationState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                message: `Server error (${statusCode}), retrying...`
              }
            }));

            if (consecutiveErrors >= maxConsecutiveErrors) {
              const errorMessage = `${type === 'training' ? 'Training' : 'Categorization'} failed after ${consecutiveErrors} consecutive worker errors`;
              
              setOperationState({
                inProgress: false,
                type: 'none',
                progress: { percent: 0, message: '' },
                result: {
                  success: false,
                  message: errorMessage,
                  data: null
                }
              });
              
              onError(errorMessage);
              return { status: 'failed', error: 'Too many consecutive worker errors' };
            }
            continue;
          }

          // For 404, could mean the prediction is gone/complete
          if (statusCode === 404) {
            // Early phase - job might not be registered yet
            if (pollCount < 5) {
              setOperationState(prev => ({
                ...prev,
                progress: {
                  ...prev.progress,
                  message: 'Waiting for job to start...'
                }
              }));
              continue;
            }
            
            // Later phase - job might be complete and cleaned up
            if (pollCount > 20) {
              const completionMessage = `${type === 'training' ? 'Training' : 'Categorization'} complete.`;
              
              setOperationState(prev => ({
                ...prev,
                progress: {
                  percent: 100,
                  message: completionMessage
                }
              }));
              
              // Keep progress visible for a moment
              setTimeout(() => {
                setOperationState({
                  inProgress: false,
                  type: 'none',
                  progress: { percent: 0, message: '' },
                  result: {
                    success: true,
                    message: completionMessage,
                    data: null
                  }
                });
              }, 2000);
              
              return { status: 'completed', message: 'Process completed' };
            }
            
            continue;
          }
          
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            const errorMessage = `${type === 'training' ? 'Training' : 'Categorization'} failed after ${consecutiveErrors} consecutive errors`;
            
            setOperationState({
              inProgress: false,
              type: 'none',
              progress: { percent: 0, message: '' },
              result: {
                success: false,
                message: errorMessage,
                data: null
              }
            });
            
            onError(errorMessage);
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
          const successMessage = `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`;
          const results = result.results || result.config?.results || [];
          
          setOperationState(prev => ({
            ...prev,
            progress: {
              percent: 100,
              message: successMessage
            }
          }));
          
          // Show success toast
          onSuccess(successMessage, results);
          
          // Keep progress bar visible for a moment
          setTimeout(() => {
            setOperationState({
              inProgress: false,
              type: 'none',
              progress: { percent: 0, message: '' },
              result: {
                success: true,
                message: successMessage,
                data: results
              }
            });
          }, 2000);
          
          return { 
            status: 'completed', 
            results, 
            message: successMessage
          };
        } else if (result.status === "failed") {
          const errorMessage = result.error || result.message || 'Unknown error';
          
          setOperationState({
            inProgress: false,
            type: 'none',
            progress: { percent: 0, message: '' },
            result: {
              success: false,
              message: `${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`,
              data: null
            }
          });
          
          onError(`${type === 'training' ? 'Training' : 'Categorization'} failed: ${errorMessage}`);
          return { status: 'failed', error: errorMessage };
        }

        // Still in progress, update progress message
        let statusMessage = `${type === 'training' ? 'Training' : 'Categorization'} in progress...`;
        if (result.message) {
          statusMessage += ` ${result.message}`;
        }
        
        setOperationState(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            message: statusMessage
          }
        }));
        
      } catch (error) {
        console.error('Error polling status:', error);
        
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const errorMessage = `Failed to check ${type === 'training' ? 'training' : 'categorization'} status after ${consecutiveErrors} consecutive errors`;
          
          setOperationState({
            inProgress: false,
            type: 'none',
            progress: { percent: 0, message: '' },
            result: {
              success: false,
              message: errorMessage,
              data: null
            }
          });
          
          onError(errorMessage);
          return { status: 'failed', error: 'Error checking status' };
        }
      }
    }

    // If we reach here, we've polled too many times without completion
    const timeoutMessage = `${type === 'training' ? 'Training' : 'Categorization'} is taking longer than expected. Please try again.`;
    
    setOperationState({
      inProgress: false,
      type: 'none',
      progress: { percent: 0, message: '' },
      result: {
        success: false,
        message: timeoutMessage,
        data: null
      }
    });
    
    onError(timeoutMessage);
    return { status: 'unknown', message: 'Maximum polling attempts reached' };
  };

  // Tag transactions as trained
  const tagTransactionsAsTrained = async (
    transactionIds: string[],
    transactions: Transaction[],
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
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
      
      onSuccess(`Applying "Trained" tag to ${transactionsToTag.length} transactions...`);
      
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
        onSuccess(`Tagged ${successCount} transactions as "Trained"`);
        
        // Update local state to reflect the tagging
        const updatedTransactions = transactions.map(tx => {
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
        });
        
        updateTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error('Error applying "Trained" tag:', error);
      onError('Failed to apply "Trained" tag to transactions');
    }
  };

  // Handle training the model
  const handleTrainModel = async (
    selectedTransactions: string[],
    transactions: Transaction[],
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    if (selectedTransactions.length === 0) {
      onError("Please select at least one transaction for training");
      return;
    }

    if (selectedTransactions.length < 10) {
      onError("Please select at least 10 transactions for training (API requirement)");
      return;
    }

    // Show loading state
    setOperationState({
      inProgress: true,
      type: 'training',
      progress: {
        percent: 0,
        message: 'Preparing training data...'
      },
      result: {
        success: false,
        message: null,
        data: null
      }
    });

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

      // Update progress
      setOperationState(prev => ({
        ...prev,
        progress: {
          percent: 10,
          message: 'Sending training request...'
        }
      }));

      // Call the training API endpoint
      const response = await fetch(process.env.EXPENSE_SORTED_API + '/train', {
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
        const pollResult = await pollForCompletion(
          predictionId, 
          'training',
          onSuccess,
          onError
        );
        
        // If training completed successfully, apply "Trained" tag to selected transactions
        if (pollResult.status === 'completed') {
          await tagTransactionsAsTrained(
            selectedTransactions,
            transactions,
            updateTransactions,
            onSuccess,
            onError
          );
        }
        
        return pollResult;
      } else {
        throw new Error('No prediction ID received from training service');
      }
    } catch (error) {
      console.error('Error starting training:', error);
      
      setOperationState({
        inProgress: false,
        type: 'none',
        progress: { percent: 0, message: '' },
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to start training',
          data: null
        }
      });
      
      onError(error instanceof Error ? error.message : 'Failed to start training');
    }
  };

  // Handle categorizing transactions
  const handleCategorizeTransactions = async (
    selectedTransactions: string[],
    transactions: Transaction[],
    onSuccess: (message: string, results?: any[]) => void,
    onError: (message: string) => void
  ) => {
    if (selectedTransactions.length === 0) {
      onError("Please select at least one transaction for categorization");
      return;
    }

    // Show loading state
    setOperationState({
      inProgress: true,
      type: 'categorizing',
      progress: {
        percent: 0,
        message: 'Preparing to categorize transactions...'
      },
      result: {
        success: false,
        message: null,
        data: null
      }
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
      
      // Update progress
      setOperationState(prev => ({
        ...prev,
        progress: {
          percent: 10,
          message: 'Sending categorization request...'
        }
      }));
      
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
      const response = await fetch(process.env.EXPENSE_SORTED_API + '/classify', {
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
        setOperationState(prev => ({
          ...prev,
          progress: {
            percent: 15,
            message: 'Waiting for categorization to initialize...'
          }
        }));
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Poll for categorization results
        return await pollForCompletion(
          predictionId, 
          'categorizing',
          onSuccess,
          onError
        );
      } else {
        throw new Error('No prediction ID received from categorization service');
      }
    } catch (error) {
      console.error('Error during categorization:', error);
      
      setOperationState({
        inProgress: false,
        type: 'none',
        progress: { percent: 0, message: '' },
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to categorize transactions',
          data: null
        }
      });
      
      onError(error instanceof Error ? error.message : 'Failed to categorize transactions');
      return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    operationState,
    setOperationState,
    resetOperationState,
    tagTransactionsAsTrained,
    handleTrainModel,
    handleCategorizeTransactions,
    pollForCompletion
  };
} 