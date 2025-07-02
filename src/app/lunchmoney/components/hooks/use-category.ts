import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { useApi } from './use-api';
import { useTags } from './use-tags';
import { useToast } from './use-toast';

export function useCategory() {
  const { updateTransactionCategory, isLoading } = useApi();
  const { hasTag, removeTagFromTransaction } = useTags();
  const { showSuccess, showError } = useToast();
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [successfulUpdates, setSuccessfulUpdates] = useState<Record<string, boolean>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});

  // Clear all success indicators
  const clearSuccessfulUpdates = useCallback(() => {
    setSuccessfulUpdates({});
  }, []);

  // Track pending category updates for a transaction
  const setUpdatePending = useCallback((transactionId: string, isPending: boolean) => {
    setPendingUpdates(prev => ({
      ...prev,
      [transactionId]: isPending
    }));
  }, []);

  // Check if a category update is pending for a transaction
  const isUpdatePending = useCallback((transactionId: string): boolean => {
    return isLoading(`lunch-money/transactions`) || 
           !!pendingUpdates[transactionId] || 
           updatingCategory === transactionId;
  }, [isLoading, pendingUpdates, updatingCategory]);

  // Get category name by ID from categories list
  const getCategoryNameById = useCallback((categoryId: string | null, categories: any[]): string | null => {
    if (!categoryId) return null;
    
    const category = categories.find(cat => 
      typeof cat !== 'string' && cat.id === categoryId
    );
    
    return (category && typeof category !== 'string') ? category.name : categoryId;
  }, []);

  // Update a single transaction's category
  const updateCategory = useCallback(async (
    transaction: Transaction,
    categoryId: string | null,
    categories: any[],
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): Promise<Transaction | null> => {
    if (!transaction.lunchMoneyId) {
      const errorMsg = 'Transaction ID is missing';
      onError(errorMsg);
      showError(errorMsg);
      return null;
    }
    
    // Start loading state
    setUpdatingCategory(transaction.lunchMoneyId);
    setUpdatePending(transaction.lunchMoneyId, true);
    
    try {
      // Check if transaction has a "Trained" tag that needs to be removed
      const hasTrainedTag = hasTag(transaction, 'Trained');
      const updatedTx = hasTrainedTag 
        ? removeTagFromTransaction(transaction, 'Trained')
        : transaction;
      
      // Get current tags for API update
      const tagNames = hasTrainedTag && updatedTx.tags
        ? updatedTx.tags.map(tag => typeof tag === 'string' ? tag : tag.name) 
        : undefined;
      
      // Update category in API
      const response = await updateTransactionCategory(
        transaction.lunchMoneyId,
        categoryId === "none" ? null : categoryId,
        tagNames // Only send tags if we're removing the "Trained" tag
      );
      
      if (response.isError || !response.data) {
        const errorMsg = response.error || 'Failed to update category';
        onError(errorMsg);
        showError(errorMsg);
        return null;
      }
      
      // Find category name for display
      const normalizedCategoryId = categoryId === "none" ? null : categoryId;
      const categoryName = getCategoryNameById(normalizedCategoryId, categories);
      
      // Update local transaction object
      const updatedTransaction = {
        ...updatedTx,
        category: normalizedCategoryId,
        lunchMoneyCategory: categoryName,
        originalData: {
          ...updatedTx.originalData,
          category_id: normalizedCategoryId,
          category_name: categoryName
        }
      };
      
      // Show success indicator
      setSuccessfulUpdates(prev => ({
        ...prev,
        [transaction.lunchMoneyId]: true
      }));
      
      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setSuccessfulUpdates(prev => ({
          ...prev,
          [transaction.lunchMoneyId]: false
        }));
      }, 3000);
      
      // Show success toast
      const successMsg = hasTrainedTag 
        ? 'Category updated and "Trained" tag removed' 
        : 'Category updated in Lunch Money';
        
      onSuccess(successMsg);
      showSuccess(successMsg);
      
      return updatedTransaction;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update category';
      onError(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      setUpdatingCategory(null);
      setUpdatePending(transaction.lunchMoneyId, false);
    }
  }, [
    getCategoryNameById, 
    hasTag, 
    removeTagFromTransaction, 
    setUpdatePending, 
    showError, 
    showSuccess, 
    updateTransactionCategory
  ]);
  
  // Update categories in batch for multiple transactions
  const updateMultipleCategories = useCallback(async (
    transactions: Transaction[],
    categoryId: string | null,
    categories: any[],
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): Promise<void> => {
    if (transactions.length === 0) {
      const errorMsg = "No transactions selected";
      onError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    // Mark all transactions as pending updates
    transactions.forEach(tx => {
      if (tx.lunchMoneyId) {
        setUpdatePending(tx.lunchMoneyId, true);
      }
    });
    
    try {
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      const updatedTransactionsList = [...transactions];
      
      // Empty callbacks for individual updates
      const noOp = () => {};
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        // Create an array of promises for the batch
        const promises = batch.map(async (tx, index) => {
          try {
            const updatedTx = await updateCategory(
              tx,
              categoryId,
              categories,
              noOp,
              noOp
            );
            
            if (updatedTx) {
              successCount++;
              return { index: i + index, transaction: updatedTx };
            } else {
              failCount++;
              return null;
            }
          } catch {
            failCount++;
            return null;
          }
        });
        
        // Wait for all promises in this batch to complete
        const results = await Promise.all(promises);
        
        // Update the transactions list with successful updates
        results.forEach(result => {
          if (result) {
            updatedTransactionsList[result.index] = result.transaction;
          }
        });
      }
      
      // Update transactions in parent
      updateTransactions(updatedTransactionsList);
      
      // Show success toast
      const failMessage = failCount > 0 ? `, ${failCount} failed` : '';
      const successMsg = `Updated ${successCount} categories${failMessage}`;
      onSuccess(successMsg);
      showSuccess(successMsg);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update categories';
      onError(errorMsg);
      showError(errorMsg);
    } finally {
      // Clear pending state for all transactions
      transactions.forEach(tx => {
        if (tx.lunchMoneyId) {
          setUpdatePending(tx.lunchMoneyId, false);
        }
      });
    }
  }, [setUpdatePending, showError, showSuccess, updateCategory]);
  
  // Apply a predicted category to a transaction
  const applyPredictedCategory = useCallback(async (
    transaction: Transaction,
    pendingUpdates: Record<string, { categoryId: string; score: number }>,
    categories: any[],
    updateTransaction: (transaction: Transaction) => void,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ): Promise<void> => {
    if (!transaction.lunchMoneyId) {
      const errorMsg = 'Transaction ID is missing';
      onError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    const update = pendingUpdates[transaction.lunchMoneyId];
    if (!update) {
      const errorMsg = `No pending update found for transaction ${transaction.lunchMoneyId}`;
      onError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    const updatedTx = await updateCategory(
      transaction,
      update.categoryId,
      categories,
      onSuccess,
      onError
    );
    
    if (updatedTx) {
      updateTransaction(updatedTx);
    }
  }, [showError, updateCategory]);

  return {
    // Loading states
    updatingCategory,
    successfulUpdates,
    isUpdatePending,
    
    // Utilities
    clearSuccessfulUpdates,
    getCategoryNameById,
    
    // API operations
    updateCategory,
    updateMultipleCategories,
    applyPredictedCategory
  };
} 