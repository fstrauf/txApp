import { useState, useCallback, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { Transaction, Category } from '../types';
import { useQueryClient } from '@tanstack/react-query';

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

interface UseTrainingProps {
  transactions: Transaction[];
  categories: Category[];
  selectedIds: string[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  updateTransactions: (updatedTransactions: Transaction[]) => void;
  onCategorizationComplete?: (results: any[], transactionIds: string[]) => void;
}

interface TrainingDataItem {
  description: string;
  Category: string;
  money_in: boolean;
  amount: number;
}

interface CategorizationDataItem {
    description: string;
    money_in: boolean;
    amount: number;
}

const EXPENSE_SORTED_TRAINED_TAG = 'expense-sorted-trained';

export function useTraining({
  transactions, 
  categories,
  selectedIds, 
  showToast, 
  updateTransactions, 
  onCategorizationComplete 
}: UseTrainingProps) {
  const queryClient = useQueryClient();
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
  const [lastTrainedTimestamp, setLastTrainedTimestamp] = useState<string | null>(null);

  const resetOperationState = useCallback(() => {
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
  }, []);

  const fetchLastTrainedTimestamp = useCallback(async () => {
    try {
      const response = await fetch('/api/classify/last-trained');
      if (!response.ok) throw new Error('Failed to fetch last trained timestamp');
      const data = await response.json();
      if (data.lastTrained) {
        setLastTrainedTimestamp(data.lastTrained);
      }
    } catch (error) {
      console.error("Error fetching last trained timestamp:", error);
      // Do not show toast for this background fetch
    }
  }, []);

  useEffect(() => {
    fetchLastTrainedTimestamp();
  }, [fetchLastTrainedTimestamp]);

  const pollForCompletion = useCallback(
    async (
    predictionId: string, 
    type: 'training' | 'categorizing',
      onSuccess: (results?: any[]) => void, 
    onError: (message: string) => void
  ) => {
      const maxPolls = 120; // 120 * 5s = 10 minutes
      const pollInterval = 5000; 
    let pollCount = 0;
      const updateProgress = (percent: number, message: string) => {
       setOperationState(prev => ({ ...prev, progress: { percent, message } }));
      };

      updateProgress(5, `Job submitted. Polling for status of ${type} job ${predictionId}...`);

      const executePoll = async () => {
    while (pollCount < maxPolls) {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
          try {
            const response = await fetch(`/api/classify/status/${predictionId}`);
        if (!response.ok) {
              // If the status endpoint itself fails (e.g., 500, 404 for the ID),
              // we might want to retry a few times or fail fast.
              // For now, we'll treat non-200 as a polling error after first attempt.
              if (pollCount > 3) { // Allow a few retries for transient network issues with the status endpoint
                 throw new Error(`Status endpoint error: ${response.status} ${response.statusText}`);
              } else {
                  console.warn(`[Poll] Status endpoint non-OK response for ${predictionId} (attempt ${pollCount}): ${response.status}. Retrying...`);
                  // Continue to the next poll iteration
                  updateProgress(
                    Math.min(95, 5 + Math.floor((pollCount / (maxPolls / 2)) * 90)), // Slower progress if status endpoint has issues
                    `${type === 'training' ? 'Training' : 'Categorization'} job ${predictionId} status check (poll ${pollCount})...`
                  );
                  continue;
              }
            }

            const data = await response.json();

            if (data.status === 'completed') {
              updateProgress(100, `${type === 'training' ? 'Training' : 'Categorization'} job ${predictionId} completed.`);
              onSuccess(data.data || (type === 'categorizing' ? [] : undefined)); // Pass data for categorization
              return;
            } else if (data.status === 'failed') {
              console.error(`[Poll] ${type} job ${predictionId} failed:`, data.message);
              onError(data.message || `${type === 'training' ? 'Training' : 'Categorization'} job failed.`);
              return;
            } else if (data.status === 'pending') {
              // Calculate progress: make it somewhat representative of polls, but don't promise 100% until 'completed'
              const simulatedProgress = Math.min(95, 5 + Math.floor((pollCount / (maxPolls / 1.5)) * 90)); // Gradual progress
              updateProgress(simulatedProgress, `${type === 'training' ? 'Training' : 'Categorization'} job ${predictionId} is still pending (poll ${pollCount})...`);
            } else {
              console.warn(`[Poll] Unknown status for ${predictionId}: ${data.status}`);
              // Treat unknown status like pending for a few attempts
              if (pollCount > 5) {
                throw new Error(`Unknown status '${data.status}' received for job ${predictionId} after multiple polls.`);
              }
               updateProgress(
                Math.min(95, 5 + Math.floor((pollCount / (maxPolls / 2)) * 90)),
                `${type === 'training' ? 'Training' : 'Categorization'} job ${predictionId} status unknown (poll ${pollCount})...`
              );
            }
          } catch (error) {
            console.error(`[Poll] Error polling for ${predictionId} (attempt ${pollCount}):`, error);
            if (pollCount >= maxPolls / 2) { // If significant polling attempts failed, then error out
              onError(error instanceof Error ? error.message : `Failed to poll for job ${predictionId} status.`);
              return;
            }
            // Otherwise, log and continue polling, hoping it's transient
            updateProgress(
              Math.min(95, 5 + Math.floor((pollCount / (maxPolls / 2)) * 90)),
              `Polling error for ${predictionId} (attempt ${pollCount}), retrying...`
            );
          }
        }
        // If loop finishes, it means timeout
        onError(`${type === 'training' ? 'Training' : 'Categorization'} job ${predictionId} timed out after ${maxPolls} polling attempts.`);
      };
      await executePoll();
   }, []);

   const tagTransactionsAsTrained = useCallback(async (transactionsToTag: Transaction[]) => {
    console.log(`[useTraining] Attempting to tag ${transactionsToTag.length} transactions.`);
    const filteredForTagging = transactionsToTag.filter(tx => 
        !tx.tags?.some(tag => 
            (typeof tag === 'object' && tag.name?.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG) ||
            (typeof tag === 'string' && tag.toLowerCase() === EXPENSE_SORTED_TRAINED_TAG)
        )
    );
    const idsToTag = filteredForTagging.map(tx => tx.lunchMoneyId).filter(Boolean) as string[];

    if (idsToTag.length === 0) {
        console.log("[useTraining] No transactions require tagging.");
        return { successCount: 0, failCount: 0 };
    }
    
    let successCount = 0;
    let failCount = 0;
    const batchSize = 10;
    let currentBatchStartIndex = 0;

    try {
      for (let i = 0; i < idsToTag.length; i += batchSize) {
        currentBatchStartIndex = i;
        const batchIds = idsToTag.slice(i, i + batchSize);
        const promises = batchIds.map(txId => 
          fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: txId, tags: [EXPENSE_SORTED_TRAINED_TAG] }),
          }).then(res => {
            if (!res.ok) throw new Error(`Tagging failed for ${txId}`);
            return txId;
          })
        );
        const results = await Promise.allSettled(promises);
        results.forEach(result => {
          if (result.status === 'fulfilled') successCount++;
          else {
            failCount++;
            console.error('[useTraining] Tagging failed:', result.reason);
          }
        });
      }
      console.log(`[useTraining] Tagging result - Success: ${successCount}, Fail: ${failCount}`);
      if (successCount > 0) updateTransactions(transactionsToTag);
      return { successCount, failCount };
    } catch (error) {
        console.error('[useTraining] Error during tagging batch:', error);
        return { successCount, failCount: failCount + (idsToTag.length - currentBatchStartIndex) };
    }

  }, [updateTransactions]);

  const trainSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one transaction.", 'info');
      return;
    }

    const transactionsToTrain = transactions.filter(tx =>
      selectedIds.includes(tx.lunchMoneyId) && 
      tx.originalData?.status === 'cleared' && 
      tx.originalData?.category_id
    );
     
     if (transactionsToTrain.length < 10) {
      showToast(`Need at least 10 selected 'cleared' transactions with categories for training. Found ${transactionsToTrain.length} eligible.`, 'error');
      return;
    }

     const trainingPayloadItems = transactionsToTrain.map(tx => ({
       description: tx.description,
       Category: tx.originalData!.category_id!.toString(), 
       money_in: tx.is_income,
       amount: tx.amount
     })) as TrainingDataItem[];
     
    setOperationState({ inProgress: true, type: 'training', progress: { percent: 0, message: 'Submitting selected transactions for training...' }, result: { success: false, message: null, data: null } });

     try {
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: trainingPayloadItems }),
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
        throw new Error(errorData.error || 'Subscription inactive or trial expired. Cannot start training.');
      }

      if (response.status === 200) { // Synchronous completion
        const syncResult = await response.json();
        if (syncResult.status === 'completed') {
          setOperationState(prev => ({ ...prev, progress: { percent: 95, message: 'Training completed. Tagging transactions...' } }));
          const tagResult = await tagTransactionsAsTrained(transactionsToTrain);
          const finalMessage = `Training complete. Tagged ${tagResult.successCount} of ${transactionsToTrain.length} transactions. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed.` : ''}`;
          showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
          if (tagResult.successCount > 0 || tagResult.failCount === 0) {
            queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
            fetchLastTrainedTimestamp();
          }
          setOperationState({
            inProgress: false, 
            type: 'training',
            progress: { percent: 100, message: finalMessage }, 
            result: { success: tagResult.failCount === 0, message: finalMessage, data: null }
          });
          setTimeout(resetOperationState, 3000);
        } else {
          throw new Error(syncResult.message || 'Training API returned success status but unexpected content.');
        }
      } else if (response.status === 202) { // Asynchronous, polling required
         const asyncResult = await response.json();
         const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
         if (!predictionId) throw new Error('Training API started but did not return a prediction ID.');

         setOperationState(prev => ({ ...prev, progress: { ...prev.progress, message: `Training job ${predictionId} submitted. Polling for completion...`}}));

         await pollForCompletion(predictionId, 'training', 
            async () => { // onSuccess for polling
                setOperationState(prev => ({ ...prev, type: 'training', progress: { percent: 95, message: 'Training API complete. Now tagging transactions...' } }));
                const tagResult = await tagTransactionsAsTrained(transactionsToTrain);
                const finalMessage = `Training complete. Tagged ${tagResult.successCount} of ${transactionsToTrain.length} transactions. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed.` : ''}`;
                showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
                if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                  queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
                  fetchLastTrainedTimestamp();
                }
                setOperationState(prev => ({
                  ...prev,
                   inProgress: false, 
                   progress: { percent: 100, message: finalMessage }, 
                   result: { success: tagResult.failCount === 0, message: finalMessage, data: null }
                }));
                setTimeout(resetOperationState, 3000);
            }, 
            (errorMessage) => { // onError for polling
                showToast(`Training job ${predictionId} failed during polling: ${errorMessage}`, 'error');
                setOperationState({ inProgress: false, type: 'training', progress: { percent: 0, message: '' }, result: { success: false, message: `Polling failed: ${errorMessage}`, data: null } });
                setTimeout(resetOperationState, 3000);
            }
         );
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error from training API' }));
        throw new Error(errorData.error || `Training request failed with status: ${response.status}`);
      }
    } catch (error) {
         const message = error instanceof Error ? error.message : 'Failed to start training for selected transactions.';
         showToast(message, 'error');
        setOperationState({ inProgress: false, type: 'training', progress: { percent: 0, message: '' }, result: { success: false, message: message, data: null } });
        setTimeout(resetOperationState, 3000);
     }
  }, [selectedIds, transactions, showToast, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp, resetOperationState, queryClient]);

  const trainAllReviewed = useCallback(async () => {
     setOperationState({ inProgress: true, type: 'training', progress: { percent: 0, message: 'Fetching all reviewed (cleared) transactions for training...' }, result: { success: false, message: null, data: null } });
     let allEligibleTransactions: Transaction[] = [];
     try {
          // 1. Fetch transactions over a wide date range
          const endDate = new Date();
          const startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 5); // 5 years back
          const wideDateRange = {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          };
          console.log(`[Train All Hook] Fetching transactions from ${wideDateRange.startDate} to ${wideDateRange.endDate}`);
          const params = new URLSearchParams({
            start_date: wideDateRange.startDate,
            end_date: wideDateRange.endDate,
            // No status filter here, fetch all and filter locally or rely on backend to handle if it can filter by 'categorized' efficiently
          });
          const fetchResponse = await fetch(`/api/lunch-money/transactions?${params.toString()}`);
          if (!fetchResponse.ok) {
            const data = await fetchResponse.json().catch(() => ({}));
            throw new Error(data.error || `Failed to fetch transactions (${fetchResponse.status})`);
          }
          const fetchData = await fetchResponse.json();
          if (!fetchData.transactions || !Array.isArray(fetchData.transactions)) {
            throw new Error('Received invalid transaction data format from server');
          }

          // 2. Filter for reviewed (cleared and categorized) transactions
          // Assuming Transaction type has originalData.category_id and originalData.status
          allEligibleTransactions = (fetchData.transactions as Transaction[]).filter(
              (tx: Transaction) => tx.originalData?.status === 'cleared' && !!tx.originalData?.category_id
          );
          console.log(`[Train All Hook] Found ${allEligibleTransactions.length} cleared and categorized transactions.`);

         if (allEligibleTransactions.length < 10) {
             throw new Error(`Need at least 10 'cleared' transactions with categories across your data for training. Found ${allEligibleTransactions.length}.`);
         }

         const trainingPayloadItems = allEligibleTransactions.map(tx => {
            return { 
              description: tx.description, 
              Category: tx.originalData!.category_id!.toString(),
              money_in: tx.is_income, 
              amount: tx.amount 
            };
         }).filter(item => item !== null) as TrainingDataItem[];

         setOperationState(prev => ({ ...prev, progress: { percent: 5, message: `Submitting ${allEligibleTransactions.length} reviewed transactions for training...` } }));
         
         const response = await fetch('/api/classify/train', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ transactions: trainingPayloadItems }),
         });

         if (response.status === 403) {
          const errorData = await response.json().catch(() => ({ error: 'Subscription check failed' }));
          throw new Error(errorData.error || 'Subscription inactive or trial expired. Cannot start training.');
         }
         
         if (response.status === 200) { // Synchronous completion
            const syncResult = await response.json();
            if (syncResult.status === 'completed') {
                setOperationState(prev => ({ ...prev, progress: { percent: 95, message: 'Training (all reviewed) completed. Tagging transactions...' } }));
                const tagResult = await tagTransactionsAsTrained(allEligibleTransactions);
                const finalMessage = `Training (all reviewed) complete. Tagged ${tagResult.successCount} of ${allEligibleTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed.` : ''}`;
                showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
                if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                  queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
                  fetchLastTrainedTimestamp();
                }
                setOperationState(prev => ({ 
                    ...prev, 
                    inProgress: false,
                    type: 'training',
                    progress: { percent: 100, message: finalMessage }, 
                    result: { success: tagResult.failCount === 0, message: finalMessage, data: null }
                }));
                setTimeout(resetOperationState, 3000);
            } else {
                throw new Error(syncResult.message || 'Training API (all reviewed) returned success status but unexpected content.');
            }
         } else if (response.status === 202) { // Asynchronous, polling required
           const asyncResult = await response.json();
           const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
           if (!predictionId) throw new Error('Training API (all reviewed) did not return a prediction ID.');

           setOperationState(prev => ({ ...prev, progress: { ...prev.progress, message: `Training job ${predictionId} (all reviewed) submitted. Polling...`}}));

           await pollForCompletion(predictionId, 'training', 
               async () => { // onSuccess for polling
                   setOperationState(prev => ({ ...prev, type:'training', progress: { percent: 95, message: 'Training API (all reviewed) complete. Tagging transactions...' } }));
                   const tagResult = await tagTransactionsAsTrained(allEligibleTransactions);
                   const finalMessage = `Training (all reviewed) complete. Tagged ${tagResult.successCount} of ${allEligibleTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed.` : ''}`;
                   showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
                   if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                     queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
                     fetchLastTrainedTimestamp();
                   }
                   setOperationState(prev => ({ 
                      ...prev, 
                      inProgress: false,
                      progress: { percent: 100, message: finalMessage }, 
                      result: { success: tagResult.failCount === 0, message: finalMessage, data: null }
                   }));
                   setTimeout(resetOperationState, 3000);
               }, 
               (errorMessage) => { // onError for polling
                   showToast(`Training job ${predictionId} (all reviewed) failed: ${errorMessage}`, 'error');
                   setOperationState({ inProgress: false, type: 'training', progress: { percent: 0, message: '' }, result: { success: false, message: `Polling failed: ${errorMessage}`, data: null } });
                   setTimeout(resetOperationState, 3000);
               }
            );
         } else { 
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error from training API' }));
            throw new Error(errorData.error || `Training request (all reviewed) failed with status: ${response.status}`); 
         }

     } catch (error) {
         const message = error instanceof Error ? error.message : 'Failed to train all reviewed transactions.';
         showToast(message, 'error');
        setOperationState({ inProgress: false, type: 'training', progress: { percent: 0, message: '' }, result: { success: false, message: message, data: null } });
        setTimeout(resetOperationState, 3000);
     }
  }, [showToast, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp, resetOperationState, queryClient, transactions /* Added transactions here as a fallback if API fetch fails, though primary source is new fetch */]);

  const categorizeSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      showToast("Please select transactions to categorize.", 'info');
      return;
    }

    // Filter out transactions that might already have pending predictions from another source,
    // or are not suitable for categorization (e.g., already categorized and locked).
    // For this example, we'll assume all selected are uncategorized or eligible.
    const transactionsToCategorize = transactions.filter(tx => 
      selectedIds.includes(tx.lunchMoneyId) 
      // && !tx.originalData?.category_id // Example: Only uncategorized
    );

    if (transactionsToCategorize.length === 0) {
      showToast('No suitable transactions selected for categorization.', 'info');
      return;
    }

    const transactionsToCategorizeIds = transactionsToCategorize.map(tx => tx.lunchMoneyId);

    const categorizationData: CategorizationDataItem[] = transactionsToCategorize.map(tx => ({
      // Ensure description is a string, even if it's an object in source
      description: typeof tx.description === 'object' ? JSON.stringify(tx.description) : String(tx.description || ''),
      money_in: !!tx.is_income, // Ensure boolean
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || '0')),
    }));

    setOperationState({
      inProgress: true,
      type: 'categorizing',
      progress: { percent: 0, message: 'Preparing transactions for categorization...' },
      result: { success: false, message: null, data: null }
    });

    try {
      setOperationState(prev => ({ ...prev, progress: { percent: 5, message: 'Sending categorization request...' }}));
      
      const response = await fetch('/api/classify/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: categorizationData }),
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed or access denied.' }));
        const message = errorData.error || 'Categorization failed: Subscription inactive or trial expired.';
        setOperationState(prev => ({ 
          ...prev, 
          inProgress: false, 
          type: 'none', 
          result: { success: false, message, data: null },
          progress: { percent: 0, message: '' }
        }));
        showToast(message, 'error');
        return;
      }

      if (response.status === 409) { // Specific handling for 409 Conflict
        const errorData = await response.json().catch(() => ({ error: 'An error occurred processing the server response. Please try again.' }));
        const message = errorData.error || 'Embedding dimension mismatch. Please re-train your model to continue classifying transactions.';
        setOperationState(prev => ({
          ...prev,
          inProgress: false,
          type: 'none',
          result: { success: false, message, data: null },
          progress: { percent: 0, message: '' }
        }));
        showToast(message, 'error');
        return; // Stop further processing for 409
      }

      if (!response.ok && response.status !== 202) { // 202 is for async, other non-ok are errors
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
        throw new Error(errorData.error || `Categorization request failed with status ${response.status}`);
      }

      const responseData = await response.json();

      if (response.status === 200 && responseData.status === 'completed') { // Synchronous success
        setOperationState(prev => ({
          ...prev,
          inProgress: false, 
          type: 'none',
          result: { success: true, message: 'Categorization completed synchronously.', data: responseData.results || [] },
          progress: { percent: 100, message: 'Completed!' }
        }));
        if (onCategorizationComplete && responseData.results) {
          onCategorizationComplete(responseData.results, transactionsToCategorizeIds);
        } else if (onCategorizationComplete) {
          onCategorizationComplete([], transactionsToCategorizeIds); // Pass empty results if none
        }
        showToast('Categorization completed!', 'success');
        // Clear selection? This might be handled by the calling component.

      } else if (response.status === 202 && responseData.prediction_id) { // Asynchronous started
        setOperationState(prev => ({ 
          ...prev, 
          // inProgress remains true
          progress: { percent: 10, message: `Categorization job ${responseData.prediction_id} started. Waiting for results...` }
        }));

        await pollForCompletion(
          responseData.prediction_id,
          'categorizing',
          (pollingResults) => { // onSuccess from poll
            setOperationState(prev => ({ 
              ...prev, 
              inProgress: false, 
              type: 'none',
              result: { success: true, message: 'Categorization completed via polling.', data: pollingResults || [] },
              progress: { percent: 100, message: 'Completed!' }
            }));
            if (onCategorizationComplete) {
              onCategorizationComplete(pollingResults || [], transactionsToCategorizeIds);
            }
            showToast('Categorization completed!', 'success');
          },
          (pollingError) => { // onError from poll
            setOperationState(prev => ({ 
              ...prev, 
              inProgress: false, 
              type: 'none',
              result: { success: false, message: pollingError, data: null },
              progress: { percent: 0, message: '' }
            }));
            showToast(pollingError, 'error');
          }
        );
      } else { // Unexpected response
        throw new Error(responseData.message || responseData.error || 'Unexpected response from categorization server.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during categorization.';
      console.error("Categorization error in useTraining:", errorMessage, error);
      setOperationState(prev => ({
        ...prev,
        inProgress: false,
        type: 'none',
        result: { success: false, message: errorMessage, data: null },
        progress: { percent: 0, message: '' }
      }));
      showToast(errorMessage, 'error');
    }
  }, [
    selectedIds, 
    transactions, 
    showToast, 
    onCategorizationComplete, 
    pollForCompletion, 
    // No need for `categories` or `updateTransactions` here as this hook only triggers it
  ]);

  return {
    operationState,
    lastTrainedTimestamp,
    resetOperationState,
    trainSelected,
    trainAllReviewed,
    categorizeSelected,
    fetchLastTrainedTimestamp,
  };
} 