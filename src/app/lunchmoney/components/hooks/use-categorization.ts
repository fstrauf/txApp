import { useState, useCallback } from 'react';
import { Transaction, Category } from '../types';
import { useQueryClient } from '@tanstack/react-query';

export interface PendingUpdateInfo {
  predictedCategoryId: string | null;
  predictedCategoryName: string | null;
  originalCategoryId: string | null;
  originalCategoryName: string | null;
  score?: number; // Optional: if your API provides a confidence score
  is_low_confidence?: boolean;
  low_confidence_reason?: string;
}

export interface CategorizationState {
  pendingUpdates: Record<string, PendingUpdateInfo>;
  applying: {
    all: boolean;
    individual: string | null;
  };
  results: Map<string, {category: string, score: number}>;
  stats: {
    total: number;
    applied: number;
    failed: number;
  };
}

export function useCategorization() {
  const queryClient = useQueryClient();
  const [categorizationState, setCategorizationState] = useState<CategorizationState>({
    pendingUpdates: {},
    applying: {
      all: false,
      individual: null
    },
    results: new Map(),
    stats: {
      total: 0,
      applied: 0,
      failed: 0
    }
  });

  const updateTransactionsWithPredictions = (
    apiResults: any[], 
    processedTransactionIds: string[],
    allTransactions: Transaction[],
    categories: any[],
    onSuccess: (message: string) => void
  ) => {
    if (!apiResults || apiResults.length === 0) {
      console.log("[useCategorization] No API results to update transactions with");
      onSuccess("No new category predictions received.");
      return;
    }
    if (!processedTransactionIds || processedTransactionIds.length === 0) {
      console.log("[useCategorization] No transaction IDs provided for API results");
      onSuccess("No transactions were processed for categorization predictions.");
      return;
    }
    if (apiResults.length !== processedTransactionIds.length) {
      console.warn(
        `[useCategorization] Mismatch between API results count (${apiResults.length}) and transaction IDs count (${processedTransactionIds.length}). Proceeding with the shorter length.`
      );
    }
    
    console.log(`[useCategorization] Processing ${apiResults.length} prediction results for ${processedTransactionIds.length} transactions.`);
    console.log("[useCategorization] updateTransactionsWithPredictions called. Categories available locally:", JSON.stringify(categories.slice(0, 5)));
    
    const newPendingUpdates: Record<string, PendingUpdateInfo> = {};

    const getCategoryNameById_local = (id: string | null): string | null => {
      if (!id) return null;
      const category = categories.find(cat => typeof cat === 'object' && cat.id === id);
      return category && typeof category === 'object' ? category.name : null;
    };

    const numToProcess = Math.min(apiResults.length, processedTransactionIds.length);

    for (let i = 0; i < numToProcess; i++) {
      const prediction = apiResults[i];
      const transactionId = processedTransactionIds[i];

      if (!transactionId) {
        console.warn(`[useCategorization] Missing transaction ID at index ${i}`);
        continue;
      }

      const originalTransaction = allTransactions.find(t => t.lunchMoneyId === transactionId);
      if (!originalTransaction) {
        console.warn(`[useCategorization] Original transaction not found for ID: ${transactionId}`);
        continue;
      }

      let predictedCatId: string | null = prediction.category_id || prediction.predicted_category_id || prediction.predicted_category || null;
      let predictedCatName: string | null = prediction.category_name || prediction.predicted_category_name || null;
      const score = prediction.score || prediction.similarity_score;
      
      const adjustmentInfo = prediction.adjustment_info || {};
      const isLowConfidence = !!adjustmentInfo.is_low_confidence;
      const lowConfidenceReason = adjustmentInfo.reason || (isLowConfidence ? 'Low confidence prediction' : undefined);

      console.log(`[useCategorization] Processing prediction for TxID ${transactionId}: API raw predicted_category value: '${prediction.predicted_category}', Initial predictedCatId: '${predictedCatId}', Initial predictedCatName: '${predictedCatName}'`);

      if (predictedCatId && !predictedCatName) {
        console.log(`[useCategorization] TxID ${transactionId}: ID '${predictedCatId}' present, Name missing. Attempting lookup...`);
        predictedCatName = getCategoryNameById_local(predictedCatId);
        console.log(`[useCategorization] TxID ${transactionId}: Looked up ID '${predictedCatId}', got Name: '${predictedCatName}'`);
      }
      
      if (!predictedCatId && (!predictedCatName || predictedCatName.toLowerCase() === 'none' || predictedCatName.toLowerCase() === 'unknown')) {
        console.log(`[useCategorization] Prediction for ${transactionId} is 'None' or empty. Setting to null.`);
        predictedCatId = null;
        predictedCatName = null; 
      }

      const originalCatId = originalTransaction.originalData?.category_id || null;
      const originalCatName = getCategoryNameById_local(originalCatId) || originalTransaction.lunchMoneyCategory || null;

      newPendingUpdates[transactionId] = {
        predictedCategoryId: predictedCatId,
        predictedCategoryName: predictedCatName,
        originalCategoryId: originalCatId,
        originalCategoryName: originalCatName,
        ...(score !== undefined && { score: parseFloat(String(score)) }),
        ...(isLowConfidence && { is_low_confidence: true }),
        ...(isLowConfidence && lowConfidenceReason && { low_confidence_reason: lowConfidenceReason })
      };
      console.log(`[useCategorization] Stored for TxID ${transactionId}: PredictedID='${predictedCatId}', PredictedName='${predictedCatName}', LowConfidence=${isLowConfidence}`);
    }
        
    setCategorizationState(prev => ({
      ...prev,
      pendingUpdates: {
        ...prev.pendingUpdates,
        ...newPendingUpdates
      },
      stats: {
        ...prev.stats,
        total: Object.keys(prev.pendingUpdates).length + Object.keys(newPendingUpdates).length
      }
    }));
    
    const updatedPendingCount = Object.keys(newPendingUpdates).length;
    console.log("[useCategorization] Prepared", updatedPendingCount, "new/updated pending category updates.");
    
    if (updatedPendingCount > 0) {
        onSuccess(`${updatedPendingCount} transaction(s) have new category suggestions. Review and apply the changes.`);
    } else {
        onSuccess("No new category suggestions based on the latest predictions.");
    }
  };

  const resetCategorizationState = () => {
    setCategorizationState({
      pendingUpdates: {},
      applying: {
        all: false,
        individual: null
      },
      results: new Map(),
      stats: {
        total: 0,
        applied: 0,
        failed: 0
      }
    });
  };

  const applyPredictedCategory = async (
    transactionId: string,
    categories: any[],
    updateTransaction: (txId: string, categoryId: string | null, categoryName: string | null) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    const update = categorizationState.pendingUpdates[transactionId];
    if (!update) {
      console.error(`[useCategorization - applySingle] No pending update found for transaction ${transactionId}`);
      onError("No prediction found for this transaction.");
      return;
    }

    const categoryIdToApply = update.predictedCategoryId;
    const categoryNameToApply = update.predictedCategoryName;

    setCategorizationState(prev => ({
      ...prev,
      applying: { ...prev.applying, individual: transactionId }
    }));

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          categoryId: categoryIdToApply,
        })
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category via API');
      }
      
      updateTransaction(transactionId, categoryIdToApply, categoryNameToApply);
      
      setCategorizationState(prev => {
        const newPendingUpdates = {...prev.pendingUpdates};
        delete newPendingUpdates[transactionId];
        console.log(`[applyPredictedCategory] State Updater: Removing ${transactionId}. New count should be ${Object.keys(newPendingUpdates).length}`);
        
        return {
          ...prev,
          pendingUpdates: newPendingUpdates,
          applying: { ...prev.applying, individual: null },
          stats: { ...prev.stats, applied: prev.stats.applied + 1, total: prev.stats.total -1 }
        };
      });
      
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
      
      onSuccess('Category updated in Lunch Money');
      
    } catch (error) {
      console.error('[useCategorization - applySingle] Error updating category:', error);
      setCategorizationState(prev => ({
        ...prev,
        applying: { ...prev.applying, individual: null },
        stats: { ...prev.stats, failed: prev.stats.failed + 1 }
      }));
      onError(error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  const applyAllPredictedCategories = async (
    categoriesList: any[],
    updateTransaction: (txId: string, categoryId: string | null, categoryName: string | null) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    const transactionIdsWithPendingUpdates = Object.keys(categorizationState.pendingUpdates);
    if (transactionIdsWithPendingUpdates.length === 0) {
      onSuccess("No category predictions to apply.");
      return;
    }

    setCategorizationState(prev => ({ ...prev, applying: { ...prev.applying, all: true } }));

    let successCount = 0;
    let failCount = 0;
    const batchSize = 10;
    const appliedTxIdsForLocalUpdate: Array<{txId: string, catId: string | null, catName: string | null}> = [];

    for (let i = 0; i < transactionIdsWithPendingUpdates.length; i += batchSize) {
      const batchTxIds = transactionIdsWithPendingUpdates.slice(i, i + batchSize);
      
      const promises = batchTxIds.map(async (txId) => {
        const update = categorizationState.pendingUpdates[txId];
        if (!update) return { success: false, txId, error: "No pending update found during batch." };

        const categoryIdToApply = update.predictedCategoryId;
        const categoryNameToApply = update.predictedCategoryName;

        try {
          const response = await fetch('/api/lunch-money/transactions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: txId,
              categoryId: categoryIdToApply,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error for ${txId}`);
          }
          return { success: true, txId, appliedCategoryId: categoryIdToApply, appliedCategoryName: categoryNameToApply };
        } catch (error) {
          console.error(`[useCategorization - applyAll] Error updating transaction ${txId}:`, error);
          return { success: false, txId, error: error instanceof Error ? error.message : "Unknown API error" };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
          const appliedCatId = result.value.appliedCategoryId !== undefined ? result.value.appliedCategoryId : null;
          const appliedCatName = result.value.appliedCategoryName !== undefined ? result.value.appliedCategoryName : null;

          appliedTxIdsForLocalUpdate.push({
            txId: result.value.txId,
            catId: appliedCatId,
            catName: appliedCatName
          });
        } else {
          failCount++;
          if (result.status === 'rejected') {
            console.error(`[useCategorization - applyAll] Batch item rejected:`, result.reason);
          } else if (result.status === 'fulfilled' && !result.value.success) {
            console.error(`[useCategorization - applyAll] Batch item failed for ${result.value.txId}:`, result.value.error);
          }
        }
      });
    }

    appliedTxIdsForLocalUpdate.forEach(item => {
      updateTransaction(item.txId, item.catId ?? null, item.catName ?? null);
    });

    const newPendingUpdates = { ...categorizationState.pendingUpdates };
    appliedTxIdsForLocalUpdate.forEach(item => {
      delete newPendingUpdates[item.txId];
    });

    setCategorizationState(prev => ({
      ...prev,
      pendingUpdates: newPendingUpdates,
      applying: { ...prev.applying, all: false },
      stats: {
        ...prev.stats,
        applied: prev.stats.applied + successCount,
        failed: prev.stats.failed + failCount,
        total: Object.keys(newPendingUpdates).length
      }
    }));
    
    if (failCount > 0) {
      onError(`Applied ${successCount} categories. ${failCount} failed.`);
    } else {
      onSuccess(`Successfully applied ${successCount} category predictions.`);
    }

    if (successCount > 0) {
      console.log('[applyAllPredictedCategories] Invalidating counts query...');
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactionCounts'] });
    }
  };

  const cancelSinglePrediction = (
    transactionId: string,
    onSuccess?: (message: string) => void
  ) => {
    if (!categorizationState.pendingUpdates[transactionId]) {
      console.warn(`[useCategorization - cancelSingle] No pending update for ${transactionId} to cancel.`);
      return;
    }
    setCategorizationState(prev => {
      const newPendingUpdates = { ...prev.pendingUpdates };
      delete newPendingUpdates[transactionId];
      return {
        ...prev,
        pendingUpdates: newPendingUpdates,
        stats: {
          ...prev.stats,
          total: prev.stats.total - 1
        }
      };
    });
    if (onSuccess) {
      onSuccess("Category suggestion discarded.");
    }
  };

  return {
    categorizationState,
    setCategorizationState,
    resetCategorizationState,
    updateTransactionsWithPredictions,
    applyPredictedCategory,
    applyAllPredictedCategories,
    cancelSinglePrediction,
  };
} 