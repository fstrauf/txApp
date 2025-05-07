import { useState, useCallback, useEffect } from 'react';
import { Transaction, Category } from '../types';

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
  onCategorizationComplete?: (results: any[]) => void;
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
      if (!response.ok) {
        console.warn(`Failed to fetch last trained timestamp: ${response.status}`);
        setLastTrainedTimestamp(null);
        return;
      }
      const data = await response.json();
      const timestamp = data.lastTrainedAt || null;
      setLastTrainedTimestamp(timestamp);
      if (timestamp) console.log('Fetched last trained timestamp:', timestamp);
    } catch (error) {
      console.error('Error fetching last trained timestamp:', error);
      setLastTrainedTimestamp(null);
      showToast('Could not load last trained time', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchLastTrainedTimestamp();
  }, [fetchLastTrainedTimestamp]);

  const pollForCompletion = useCallback(async (
    predictionId: string, 
    type: 'training' | 'categorizing',
    onSuccess: (results?: any[]) => void, 
    onError: (message: string) => void
  ) => {
    const maxPolls = 120;
    const pollInterval = 5000; 
    let pollCount = 0;
    const updateProgress = (percent: number, message: string) => {
      setOperationState(prev => ({ ...prev, progress: { percent, message } }));
    };

    updateProgress(5, `${type === 'training' ? 'Training' : 'Categorization'} started...`);

    while (pollCount < maxPolls) {
      pollCount++;
      try {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        const simulateProgress = Math.min(95, 5 + Math.floor((pollCount / maxPolls) * 90));
        updateProgress(simulateProgress, `${type === 'training' ? 'Training' : 'Categorization'} in progress...`);
        
        if (pollCount > 5) { 
            console.log(`Simulating ${type} completion for ${predictionId}`);
            updateProgress(100, `${type === 'training' ? 'Training' : 'Categorization'} completed successfully!`);
            onSuccess(type === 'categorizing' ? [{ /* simulated results */ }] : undefined);
            return;
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : `Polling failed for ${type}`;
        console.error(`Polling error (${type}, ID: ${predictionId}):`, error);
        onError(message);
        return;
      }
    }
    onError(`${type === 'training' ? 'Training' : 'Categorization'} timed out after ${maxPolls} attempts.`);
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

    try {
      for (let i = 0; i < idsToTag.length; i += batchSize) {
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
        return { successCount, failCount: failCount + (idsToTag.length - i) };
    }

  }, [updateTransactions]);

  const trainSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one transaction.", 'info');
      return;
    }
    
    const clearedTransactionsToTrain = transactions.filter(tx =>
      selectedIds.includes(tx.lunchMoneyId) && tx.originalData?.status === 'cleared'
    );
    
    if (clearedTransactionsToTrain.length < 10) {
      showToast(`Need at least 10 'cleared' transactions for training. Found ${clearedTransactionsToTrain.length} eligible out of ${selectedIds.length} selected.`, 'error');
      return;
    }
    
    const trainingPayloadItems = clearedTransactionsToTrain.map(tx => {
      const categoryId = tx.originalData?.category_id?.toString();
      if (!categoryId) return null;
      return { 
        description: tx.description, Category: categoryId, 
        money_in: tx.is_income, amount: tx.amount 
      };
    }).filter(item => item !== null) as TrainingDataItem[];

    if (trainingPayloadItems.length < 10) {
        showToast(`Only ${trainingPayloadItems.length} selected transactions have required category data. Need 10.`, 'error');
        return;
    }
    
    setOperationState({ inProgress: true, type: 'training', progress: { percent: 0, message: 'Starting training...' }, result: { success: false, message: null, data: null } });

    try {
      const apiPayload = { transactions: trainingPayloadItems };
      await new Promise(res => setTimeout(res, 1000)); 
      const simulatedResponse = { status: 202, json: async () => ({ prediction_id: `train-${Date.now()}` }) };

      if (simulatedResponse.status === 403) throw new Error('Subscription inactive');

      if (simulatedResponse.status === 200) {
         setOperationState(prev => ({ ...prev, progress: { percent: 100, message: 'Training complete!' }, result: { success: true, message: 'Completed', data: null } }));
         const tagResult = await tagTransactionsAsTrained(clearedTransactionsToTrain);
         showToast(`Tagging: ${tagResult.successCount} OK, ${tagResult.failCount} failed`, tagResult.failCount > 0 ? 'error' : 'success');
         fetchLastTrainedTimestamp();
         setTimeout(resetOperationState, 2000);
      } else if (simulatedResponse.status === 202) {
         const data = await simulatedResponse.json();
         const predictionId = data.prediction_id;
         if (!predictionId) throw new Error('No prediction ID received');
         await pollForCompletion(predictionId, 'training', 
            async () => {
                const tagResult = await tagTransactionsAsTrained(clearedTransactionsToTrain);
                showToast(`Tagging: ${tagResult.successCount} OK, ${tagResult.failCount} failed`, tagResult.failCount > 0 ? 'error' : 'success');
                fetchLastTrainedTimestamp();
                setTimeout(resetOperationState, 2000);
            }, 
            (errorMessage) => {
                showToast(`Training failed: ${errorMessage}`, 'error');
                setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: errorMessage, data: null } });
            }
         );
      } else {
        throw new Error(`Training request failed`);
      }
    } catch (error) {       
        const message = error instanceof Error ? error.message : 'Failed to start training';
        showToast(message, 'error');
        setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: message, data: null } });
    }
  }, [selectedIds, transactions, showToast, setOperationState, resetOperationState, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp]);

  const trainAllReviewed = useCallback(async () => {
      setOperationState({ inProgress: true, type: 'training', progress: { percent: 0, message: 'Fetching cleared transactions...' }, result: { success: false, message: null, data: null } });
      try {
          const endDate = new Date();
          const startDate = subMonths(endDate, 60);
          const params = new URLSearchParams({
              start_date: format(startDate, 'yyyy-MM-dd'),
              end_date: format(endDate, 'yyyy-MM-dd'),
              status: 'cleared',
          });
          const fetchResponse = await fetch(`/api/lunch-money/transactions?${params}`);
          if (!fetchResponse.ok) throw new Error('Failed to fetch cleared transactions');
          const fetchData = await fetchResponse.json();
          const clearedTransactions = fetchData.transactions as Transaction[];

          const trainingPayloadItems = clearedTransactions.map(tx => {
             const categoryId = tx.originalData?.category_id?.toString();
             if (!categoryId) return null;
             return { description: tx.description, Category: categoryId, money_in: tx.is_income, amount: tx.amount };
          }).filter(item => item !== null) as TrainingDataItem[];

          if (trainingPayloadItems.length < 10) {
              throw new Error(`Need at least 10 'cleared' transactions with category IDs. Found ${trainingPayloadItems.length}.`);
          }

          setOperationState(prev => ({ ...prev, progress: { ...prev.progress, message: 'Starting training (all reviewed)...' } }));
          const apiPayload = { transactions: trainingPayloadItems };
          await new Promise(res => setTimeout(res, 1000)); 
          const simulatedResponse = { status: 202, json: async () => ({ prediction_id: `train-all-${Date.now()}` }) };

          if (simulatedResponse.status === 403) throw new Error('Subscription inactive');
          
          if (simulatedResponse.status === 202) {
            const data = await simulatedResponse.json();
            const predictionId = data.prediction_id;
            if (!predictionId) throw new Error('No prediction ID received');
            await pollForCompletion(predictionId, 'training', 
                async () => { 
                    const tagResult = await tagTransactionsAsTrained(clearedTransactions);
                    showToast(`Tagging: ${tagResult.successCount} OK, ${tagResult.failCount} failed`, tagResult.failCount > 0 ? 'error' : 'success');
                    fetchLastTrainedTimestamp();
                    setTimeout(resetOperationState, 2000);
                }, 
                (errorMessage) => { 
                    showToast(`Training failed: ${errorMessage}`, 'error');
                    setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: errorMessage, data: null } });
                }
             );
          } else { throw new Error('Training request failed'); }

      } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to train all reviewed';
          showToast(message, 'error');
          setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: message, data: null } });
      }
  }, [showToast, setOperationState, resetOperationState, pollForCompletion, tagTransactionsAsTrained, fetchLastTrainedTimestamp]);

  const categorizeSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      showToast("Please select transactions to categorize.", 'info');
      return;
    }
    const transactionsToCategorize = transactions.filter(tx => selectedIds.includes(tx.lunchMoneyId));
    if (transactionsToCategorize.length === 0) return;

    const categorizationPayload = transactionsToCategorize.map(tx => ({
        description: tx.description, money_in: tx.is_income, amount: tx.amount
    })) as CategorizationDataItem[];

    setOperationState({ inProgress: true, type: 'categorizing', progress: { percent: 0, message: 'Starting categorization...' }, result: { success: false, message: null, data: null } });

    try {
      await new Promise(res => setTimeout(res, 1000)); 
      const simulatedResponse = { status: 202, json: async () => ({ prediction_id: `cat-${Date.now()}` }) };

      if (simulatedResponse.status === 403) throw new Error('Subscription inactive');
      
      if (simulatedResponse.status === 202) {
        const data = await simulatedResponse.json();
        const predictionId = data.prediction_id;
        if (!predictionId) throw new Error('No prediction ID received');
        await pollForCompletion(predictionId, 'categorizing', 
            (results) => {
                showToast('Categorization complete!', 'success');
                if (onCategorizationComplete) onCategorizationComplete(results || []); 
                setTimeout(resetOperationState, 2000);
            }, 
            (errorMessage) => {
                showToast(`Categorization failed: ${errorMessage}`, 'error');
                setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: errorMessage, data: null } });
            }
         );
      } else { throw new Error('Categorization request failed'); }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start categorization';
        showToast(message, 'error');
        setOperationState({ inProgress: false, type: 'none', progress: { percent: 0, message: '' }, result: { success: false, message: message, data: null } });
    }
  }, [selectedIds, transactions, showToast, setOperationState, resetOperationState, pollForCompletion, onCategorizationComplete]);

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