import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { Transaction, Category } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { useSelectionContext } from '../SelectionContext';

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
  selectedIds: _selectedIds, // unused, kept for API compatibility
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

  const { selectedIds } = useSelectionContext();

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
      console.log('[fetchLastTrainedTimestamp] Response:', data); // Debug log
      if (data.lastTrainedAt) { // Changed from lastTrained to lastTrainedAt
        setLastTrainedTimestamp(data.lastTrainedAt);
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
      onSuccess: (results?: any) => void,
    onError: (message: string) => void
  ) => {
      const maxPolls = 120; // 120 * 5s = 10 minutes
      const pollInterval = 5000; 
    let pollCount = 0;
      const updateProgress = (percent: number, message: string) => {
       setOperationState(prev => ({ ...prev, progress: { percent, message } }));
      };

      updateProgress(5, `Job submitted. Polling for status of ${type} job`);

      const executePoll = async () => {
    while (pollCount < maxPolls) {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
          const pollingUrl = `/api/classify/status/${predictionId}`;
          console.log(`[Poll Client Side] Attempting fetch (${pollCount}/${maxPolls}): ${pollingUrl}`);

          try {
            const response = await fetch(pollingUrl);
            console.log(`[Poll Client Side] Response Status for ${pollingUrl}: ${response.status}`);

            const responseText = await response.text();
            console.log(`[Poll Client Side] Response Text for ${pollingUrl}:`, responseText);

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

            let data;
            try {
              data = JSON.parse(responseText);
              console.log(`[Poll Client Side] Parsed JSON data for ${pollingUrl}:`, data);

              if (data.status === 'completed') {
                console.log(`[Poll Client Side] Job completed. Data:`, data);
                showToast('Training completed successfully!', 'success');
                
                if (onSuccess) {
                  await onSuccess(data);
                }
                return;
              } else if (data.status === 'failed') {
                const errorMessage = data.error || 'Job failed';
                console.error(`[Poll Client Side] Job failed:`, errorMessage);
                showToast(`Training failed: ${errorMessage}`, 'error');
                if (onError) {
                  onError(errorMessage);
                }
                return;
              }
            } catch (parseError) {
              const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse response';
              console.error(`[Poll Client Side] Failed to parse JSON response:`, errorMessage);
              throw new Error(errorMessage);
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
    if (selectedIds.size === 0) {
      showToast("Please select at least one transaction.", 'info');
      return;
    }

    const transactionsToTrain = transactions.filter(tx =>
      selectedIds.has(tx.lunchMoneyId) && 
      tx.originalData?.status === 'cleared' && 
      tx.originalData?.category_id
    );

    if (transactionsToTrain.length === 0) {
      showToast("No suitable transactions selected for training. Ensure they are cleared and have a category.", 'info');
      return;
    }

    const trainingData: TrainingDataItem[] = transactionsToTrain.map(tx => ({
      description: tx.originalData!.payee,
      Category: categories.find(c => c.id === tx.originalData!.category_id)?.name || 'Unknown',
      money_in: tx.originalData!.amount > 0,
      amount: tx.originalData!.amount
    }));

    setOperationState({
      inProgress: true,
      type: 'training',
      progress: { percent: 0, message: 'Submitting training data...' },
      result: { success: false, message: null, data: null }
    });

    try {
      const response = await fetch('/api/classify/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_data: trainingData }),
      });

      if (response.status === 200) { 
        const result = await response.json();
        if (response.ok && result.success) { 
          setOperationState(prev => ({
            ...prev,
            progress: { percent: 90, message: result.message || 'Training successful. Now tagging transactions...' },
          }));
          showToast(result.message || 'Training completed successfully! Now tagging...', 'success');
          
          const successfullyTrainedTransactions = transactionsToTrain;
          let finalMessage = result.message || 'Training successful.';
          let overallSuccess = true;

          if(successfullyTrainedTransactions.length > 0) {
            const tagResult = await tagTransactionsAsTrained(successfullyTrainedTransactions);
            finalMessage = `Training complete. Tagged ${tagResult.successCount} of ${successfullyTrainedTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed tagging.` : ''}`;
            showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
            if (tagResult.failCount > 0) overallSuccess = false;
            if (tagResult.successCount > 0 || tagResult.failCount === 0) {
              queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
            }
          }
          
          // Update last trained timestamp if it's in the response
          if (result.lastTrainedAt) {
            console.log('[Sync Success] Setting lastTrainedAt:', result.lastTrainedAt);
            setLastTrainedTimestamp(result.lastTrainedAt);
          } else {
            console.log('[Sync Success] No lastTrainedAt in response, fetching from API');
            fetchLastTrainedTimestamp();
          }
          
          setOperationState(prev => ({
            ...prev,
            inProgress: false,
            progress: { percent: 100, message: finalMessage },
            result: { success: overallSuccess, message: finalMessage, data: result.data },
          }));
          queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions'] }); 
        } else {
          // Handle cases where status is 200 but body indicates an error (e.g. result.success === false)
          const errorMessage = result.message || 'Training failed despite a 200 OK response.';
          console.error('Training failed (200 OK but error in body):', result);
          setOperationState(prev => ({
            ...prev,
            inProgress: false,
            result: { success: false, message: errorMessage, data: null },
          }));
          showToast(errorMessage, 'error');
        }
      } else if (response.status === 202) { 
        const { prediction_id, message: acceptanceMessage } = await response.json();
        showToast(acceptanceMessage || `Training job submitted. ID: ${prediction_id}`, 'info');
        setOperationState(prev => ({
          ...prev,
          type: 'training',
          progress: { percent: 5, message: `Training job ${prediction_id} submitted. Awaiting completion...` }
        }));

        pollForCompletion(
          prediction_id,
          'training',
          async (pollingData) => { // onSuccess for poll
            let finalMessage = 'Training completed successfully via polling.'; // Default if no specific message from pollingData
            let overallSuccess = true;
            let detailedResultsData = null; // To hold specific results like counts

            // If pollingData contains the full response from the status endpoint for training:
            if (pollingData && typeof pollingData === 'object') {
              finalMessage = pollingData.message || finalMessage;
              detailedResultsData = pollingData;

              // Handle lastTrainedAt timestamp
              if (pollingData.lastTrainedAt) {
                console.log('[Poll Success] Setting lastTrainedAt:', pollingData.lastTrainedAt);
                setLastTrainedTimestamp(pollingData.lastTrainedAt);
              } else {
                console.log('[Poll Success] No lastTrainedAt in response, fetching from API');
                fetchLastTrainedTimestamp();
              }
            }

            setOperationState(prev => ({
              ...prev,
              progress: { percent: 90, message: 'Training completed via polling. Now tagging transactions...' },
            }));
            showToast('Training completed successfully via polling! Now tagging...', 'success');
            
            const successfullyTrainedTransactions = transactionsToTrain; 
            if(successfullyTrainedTransactions.length > 0) {
              const tagResult = await tagTransactionsAsTrained(successfullyTrainedTransactions);
              // Update finalMessage based on tagging result, potentially incorporating original training message
              const baseTrainingMessage = (pollingData && pollingData.message) ? pollingData.message : 'Training (polled) complete.';
              finalMessage = `${baseTrainingMessage} Tagged ${tagResult.successCount} of ${successfullyTrainedTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed tagging.` : ''}`;
              showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
              if (tagResult.failCount > 0) overallSuccess = false;
              if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
              }
            }
            
            console.log('[Poll Success - Training]', { pollingData, finalMessage, overallSuccess, detailedResultsData }); // DEBUG LOG

            setOperationState(prev => ({
              ...prev,
              inProgress: false,
              progress: { percent: 100, message: finalMessage },
              result: { success: overallSuccess, message: finalMessage, data: detailedResultsData }, // Store potentially richer data
            }));
            fetchLastTrainedTimestamp();
            queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions'] });
          },
          (errorMessage) => { // onError for poll
            setOperationState(prev => ({
              ...prev,
              inProgress: false,
              result: { success: false, message: errorMessage, data: null },
            }));
            showToast(errorMessage, 'error');
          }
        );
      } else { 
        const errorData = await response.json().catch(() => ({ message: `Training request failed with status ${response.status}.` }));
        const message = errorData.message || errorData.error || `Training request failed: ${response.statusText}`;
        console.error('Training request failed:', message);
        setOperationState(prev => ({
            ...prev,
            inProgress: false,
            result: { success: false, message: message, data: null },
          }));
        showToast(message, 'error');
      }
    } catch (error) {
      console.error('Error during training submission or initial response handling:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during training.';
      setOperationState(prev => ({
        ...prev,
        inProgress: false,
        result: { success: false, message: errorMessage, data: null },
      }));
      showToast(errorMessage, 'error');
    }
  }, [transactions, categories, selectedIds, showToast, queryClient, pollForCompletion, fetchLastTrainedTimestamp, tagTransactionsAsTrained]);

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
                setOperationState(prev => ({ ...prev, progress: { percent: 95, message: 'Training (all reviewed) completed. Now tagging transactions...' } }));
                
                let finalMessage = syncResult.message || 'Training (all reviewed) successful.';
                let overallSuccess = true;

                if(allEligibleTransactions.length > 0) {
                  const tagResult = await tagTransactionsAsTrained(allEligibleTransactions);
                  finalMessage = `Training (all reviewed) complete. Tagged ${tagResult.successCount} of ${allEligibleTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed tagging.` : ''}`;
                  showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
                  if (tagResult.failCount > 0) overallSuccess = false;
                  if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                    queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
                  }
                }

                setOperationState(prev => ({ 
                    ...prev, 
                    inProgress: false,
                    type: 'training',
                    progress: { percent: 100, message: finalMessage }, 
                    result: { success: overallSuccess, message: finalMessage, data: syncResult.data === undefined ? null : syncResult.data }
                }));
                fetchLastTrainedTimestamp();
                queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions'] }); 
            } else {
                throw new Error(syncResult.message || 'Training API (all reviewed) returned success status but unexpected content.');
            }
         } else if (response.status === 202) { // Asynchronous, polling required
           const asyncResult = await response.json();
           const predictionId = asyncResult.prediction_id || asyncResult.predictionId;
           if (!predictionId) throw new Error('Training API (all reviewed) did not return a prediction ID.');

           setOperationState(prev => ({ ...prev, progress: { ...prev.progress, message: `Training job ${predictionId} (all reviewed) submitted. Polling...`}}));

           await pollForCompletion(predictionId, 'training', 
               async (pollingData) => { // onSuccess for polling
                   let finalMessage = 'Training (all reviewed) via polling successful.';
                   let overallSuccess = true;
                   let detailedResultsData = null;

                   if (pollingData && typeof pollingData === 'object') {
                     finalMessage = pollingData.message || finalMessage;
                     detailedResultsData = pollingData; 
                   }

                   // It's important that allEligibleTransactions is correctly captured in this closure
                   console.log(`[Poll Success - Train All Reviewed] About to tag ${allEligibleTransactions?.length || 0} transactions.`);

                   setOperationState(prev => ({ ...prev, type:'training', progress: { percent: 95, message: 'Training API (all reviewed) complete. Now tagging transactions...' } }));
                   
                   if(allEligibleTransactions && allEligibleTransactions.length > 0) {
                     const tagResult = await tagTransactionsAsTrained(allEligibleTransactions);
                     const baseTrainingMessage = (pollingData && pollingData.message) ? pollingData.message : 'Training (all reviewed, polled) complete.';
                     finalMessage = `${baseTrainingMessage} Tagged ${tagResult.successCount} of ${allEligibleTransactions.length}. ${tagResult.failCount > 0 ? `${tagResult.failCount} failed tagging.` : ''}`;
                     showToast(finalMessage, tagResult.failCount > 0 ? 'error' : 'success');
                     if (tagResult.failCount > 0) overallSuccess = false;
                     if (tagResult.successCount > 0 || tagResult.failCount === 0) {
                       queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
                     }
                   } else {
                     console.warn('[Poll Success - Train All Reviewed] No eligible transactions found for tagging at polling completion.');
                   }
                   
                   console.log('[Poll Success - Train All Reviewed] Data:', { pollingData, finalMessage, overallSuccess, detailedResultsData });

                   setOperationState(prev => ({ 
                      ...prev, 
                      inProgress: false,
                      progress: { percent: 100, message: finalMessage }, 
                      result: { success: overallSuccess, message: finalMessage, data: detailedResultsData }
                   }));
                   fetchLastTrainedTimestamp();
                   queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions'] });
               }, 
               (errorMessage) => { // onError for polling
                   console.error('[Poll Error - Train All Reviewed] Error:', errorMessage);
                   showToast(`Training job ${predictionId} (all reviewed) failed: ${errorMessage}`, 'error');
                   setOperationState({ inProgress: false, type: 'training', progress: { percent: 0, message: '' }, result: { success: false, message: `Polling failed: ${errorMessage}`, data: null } });
                   // setTimeout(resetOperationState, 3000); // Consider if this auto-reset is still desired
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

  const categorizeSelected = useCallback(async (useEnhancedLogic: boolean = false) => {
    if (selectedIds.size === 0) {
      showToast("Please select transactions to categorize.", 'info');
      return;
    }

    // Filter out transactions that might already have pending predictions from another source,
    // or are not suitable for categorization (e.g., already categorized and locked).
    // For this example, we'll assume all selected are uncategorized or eligible.
    const transactionsToCategorize = transactions.filter(tx => 
      selectedIds.has(tx.lunchMoneyId)
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

      // Handle specific error codes first
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({ error: 'Subscription check failed or access denied.' }));
        const message = errorData.message || errorData.error || 'Categorization failed: Subscription inactive or trial expired.';
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

      if (response.status === 409) { 
        const errorData = await response.json().catch(() => ({ error: 'An error occurred processing the server response.' }));
        const message = errorData.message || errorData.error || 'Embedding dimension mismatch. Please re-train your model.';
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

      // Process successful responses (200 or 202)
      if (response.status === 200) {
        const responseData = await response.json();
        
        // --- BEGIN DEBUG LOGGING ---
        console.log('[DEBUG] Checking sync categorize response:', {
            responseOk: response.ok,
            status: responseData.status,
            statusType: typeof responseData.status,
            results: responseData.results,
            resultsType: typeof responseData.results,
            isResultsArray: Array.isArray(responseData.results),
            conditionResult: (response.ok && responseData.status === 'completed' && responseData.results) 
        });
        // --- END DEBUG LOGGING ---

        // Check for status:"completed" and presence of results for synchronous success
        if (response.ok && responseData.status === 'completed' && responseData.results) { 
            setOperationState(prev => ({
              ...prev,
              inProgress: false, 
              type: 'none',
              result: { success: true, message: responseData.message || 'Categorization completed synchronously.', data: responseData.results },
              progress: { percent: 100, message: 'Completed!' }
            }));
            if (onCategorizationComplete) {
              onCategorizationComplete(responseData.results, transactionsToCategorizeIds);
            }
            showToast(responseData.message || 'Categorization completed!', 'success');
        } else {
            // Handle 200 OK but unexpected body (e.g., status not 'completed', or no results)
            const errorMessage = responseData.message || 'Categorization completed synchronously but with unexpected response format.';
            console.error('Categorization failed (200 OK but unexpected body):', responseData);
            setOperationState(prev => ({
                ...prev,
                inProgress: false,
                type: 'none',
                result: { success: false, message: errorMessage, data: null },
                progress: { percent: 0, message: '' }
            }));
            showToast(errorMessage, 'error');
        }

      } else if (response.status === 202) { 
        const responseData = await response.json();
        const predictionId = responseData.prediction_id;
        const acceptanceMessage = responseData.message;

        if (!predictionId) {
            throw new Error('Categorization job started but did not return a prediction ID.');
        }

        showToast(acceptanceMessage || `Categorization job submitted. ID: ${predictionId}`, 'info');
        setOperationState(prev => ({ 
          ...prev, 
          progress: { percent: 10, message: `Categorization job ${predictionId} started. Waiting for results...` }
        }));

        await pollForCompletion(
          predictionId,
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
      } else { // Other non-200/202 errors
        const errorData = await response.json().catch(() => ({ message: `Categorization request failed with status ${response.status}.` }));
        const message = errorData.message || errorData.error || `Categorization request failed: ${response.statusText}`;
        throw new Error(message);
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
  }, [selectedIds, transactions, showToast, onCategorizationComplete, pollForCompletion]);

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