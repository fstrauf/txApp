import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { useApi } from './use-api';
import { useToast } from './use-toast';

type Tag = string | { name: string; id: string };

export function useTags() {
  const { updateTransactionTags, isLoading } = useApi();
  const { showSuccess, showError } = useToast();
  const [pendingTags, setPendingTags] = useState<Record<string, boolean>>({});

  // Extract tag names from a tag object or string
  const getTagName = useCallback((tag: Tag): string => {
    return typeof tag === 'string' ? tag : tag.name;
  }, []);

  // Convert tag to a consistent object format
  const normalizeTag = useCallback((tag: Tag): { name: string; id: string } => {
    if (typeof tag === 'string') {
      return { 
        name: tag, 
        id: `tag-${tag}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` 
      };
    }
    return tag;
  }, []);

  // Get all unique tags from transactions
  const getAllTags = useCallback((transactions: Transaction[]): { name: string; id: string }[] => {
    const uniqueTags = new Map<string, { name: string; id: string }>();
    
    transactions.forEach(tx => {
      if (!tx.tags || !Array.isArray(tx.tags)) return;
      
      tx.tags.forEach(tag => {
        const tagName = getTagName(tag);
        if (tagName && !uniqueTags.has(tagName.toLowerCase())) {
          uniqueTags.set(tagName.toLowerCase(), normalizeTag(tag));
        }
      });
    });
    
    return Array.from(uniqueTags.values());
  }, [getTagName, normalizeTag]);

  // Check if a transaction has a specific tag by name
  const hasTag = useCallback((transaction: Transaction, tagName: string): boolean => {
    if (!transaction.tags || !Array.isArray(transaction.tags)) return false;
    
    return transaction.tags.some(tag => 
      getTagName(tag).toLowerCase() === tagName.toLowerCase()
    );
  }, [getTagName]);

  // Add a tag to a transaction (local state update only)
  const addTagToTransaction = useCallback((transaction: Transaction, tagName: string): Transaction => {
    if (!tagName.trim() || hasTag(transaction, tagName)) return transaction;
    
    // Clone the existing tags array or create a new one
    const updatedTags = Array.isArray(transaction.tags) ? [...transaction.tags] : [];
    
    // Add the new tag
    updatedTags.push(normalizeTag(tagName));
    
    // Return updated transaction
    return {
      ...transaction,
      tags: updatedTags
    };
  }, [hasTag, normalizeTag]);

  // Remove a tag from a transaction (local state update only)
  const removeTagFromTransaction = useCallback((transaction: Transaction, tagName: string): Transaction => {
    if (!transaction.tags || !Array.isArray(transaction.tags)) return transaction;
    
    // Filter out the specified tag
    const updatedTags = transaction.tags.filter(tag => 
      getTagName(tag).toLowerCase() !== tagName.toLowerCase()
    );
    
    // Return updated transaction
    return {
      ...transaction,
      tags: updatedTags
    };
  }, [getTagName]);

  // Extract tag names as strings from a transaction
  const getTagNamesFromTransaction = useCallback((transaction: Transaction): string[] => {
    if (!transaction.tags || !Array.isArray(transaction.tags)) return [];
    return transaction.tags.map(tag => getTagName(tag));
  }, [getTagName]);

  // Mark a tag as pending
  const setTagPending = useCallback((transactionId: string, isPending: boolean) => {
    setPendingTags(prev => ({
      ...prev,
      [transactionId]: isPending
    }));
  }, []);

  // Check if a tag update is pending for a transaction
  const isTagPending = useCallback((transactionId: string): boolean => {
    return isLoading(`lunch-money/transactions`) || !!pendingTags[transactionId];
  }, [isLoading, pendingTags]);

  // Update transaction tags in the API and return updated transaction
  const updateTags = useCallback(async (
    transaction: Transaction, 
    tags: string[],
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ): Promise<Transaction | null> => {
    if (!transaction.lunchMoneyId) {
      const errorMsg = 'Transaction ID is missing';
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return null;
    }
    
    try {
      setTagPending(transaction.lunchMoneyId, true);
      
      const response = await updateTransactionTags(transaction.lunchMoneyId, tags);
      
      if (response.isError || !response.data) {
        const errorMsg = response.error || 'Failed to update tags';
        if (onError) onError(errorMsg);
        showError(errorMsg);
        return null;
      }
      
      // Create updated transaction object with new tags
      const updatedTransaction = {
        ...transaction,
        tags: tags.map(tag => normalizeTag(tag))
      };
      
      const successMsg = 'Tags updated successfully';
      if (onSuccess) onSuccess(successMsg);
      showSuccess(successMsg);
      
      return updatedTransaction;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update tags';
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      setTagPending(transaction.lunchMoneyId, false);
    }
  }, [normalizeTag, setTagPending, showError, showSuccess, updateTransactionTags]);

  // Process transactions with tag updates
  const processTagUpdates = useCallback(async (
    transactions: Transaction[],
    tagProcessor: (tx: Transaction) => { shouldUpdate: boolean; tags: string[] },
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    successMessage: string,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ): Promise<void> => {
    try {
      // Create an array of promises for each transaction update
      const updates = transactions.map(async tx => {
        const { shouldUpdate, tags } = tagProcessor(tx);
        
        // Skip if no update needed
        if (!shouldUpdate) return tx;
        
        // Update in API
        const result = await updateTags(tx, tags, undefined, onError);
        return result || tx;
      });
      
      // Wait for all updates to complete
      const results = await Promise.all(updates);
      
      // Update state with new transaction data
      updateTransactions(results);
      
      // Show success message
      if (onSuccess) {
        onSuccess(successMessage);
      }
      showSuccess(successMessage);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update tags';
      if (onError) onError(errorMsg);
      showError(errorMsg);
    }
  }, [showError, showSuccess, updateTags]);

  // Add a tag to multiple transactions
  const addTagToMultipleTransactions = useCallback(async (
    transactions: Transaction[],
    tagName: string,
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ): Promise<void> => {
    if (!tagName.trim()) {
      const errorMsg = 'Tag name cannot be empty';
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    return processTagUpdates(
      transactions,
      tx => {
        const shouldUpdate = !hasTag(tx, tagName);
        const currentTags = getTagNamesFromTransaction(tx);
        return {
          shouldUpdate,
          tags: shouldUpdate ? [...currentTags, tagName] : currentTags
        };
      },
      updateTransactions,
      `Added "${tagName}" tag to ${transactions.length} transaction(s)`,
      onSuccess,
      onError
    );
  }, [getTagNamesFromTransaction, hasTag, processTagUpdates, showError]);

  // Remove a tag from multiple transactions
  const removeTagFromMultipleTransactions = useCallback(async (
    transactions: Transaction[],
    tagName: string,
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ): Promise<void> => {
    if (!tagName.trim()) {
      const errorMsg = 'Tag name cannot be empty';
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    return processTagUpdates(
      transactions,
      tx => {
        const shouldUpdate = hasTag(tx, tagName);
        const currentTags = getTagNamesFromTransaction(tx);
        return {
          shouldUpdate,
          tags: shouldUpdate 
            ? currentTags.filter(name => name.toLowerCase() !== tagName.toLowerCase())
            : currentTags
        };
      },
      updateTransactions,
      `Removed "${tagName}" tag from ${transactions.length} transaction(s)`,
      onSuccess,
      onError
    );
  }, [getTagNamesFromTransaction, hasTag, processTagUpdates, showError]);
  
  // Handle "Trained" tag specifically for the ML workflow
  const tagTransactionsAsTrained = useCallback(async (
    transactions: Transaction[],
    updateTransactions: (updatedTransactions: Transaction[]) => void,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ): Promise<void> => {
    if (!transactions.length) return;
    
    try {
      // Filter out transactions that already have the "Trained" tag
      const transactionsToTag = transactions.filter(tx => !hasTag(tx, 'Trained'));
      
      if (transactionsToTag.length === 0) {
        const msg = 'All selected transactions are already tagged as "Trained"';
        if (onSuccess) onSuccess(msg);
        showSuccess(msg);
        return;
      }
      
      const progressMsg = `Applying "Trained" tag to ${transactionsToTag.length} transactions...`;
      if (onSuccess) onSuccess(progressMsg);
      showSuccess(progressMsg);
      
      await addTagToMultipleTransactions(
        transactionsToTag,
        'Trained',
        updateTransactions,
        onSuccess,
        onError
      );
    } catch (error) {
      const errorMsg = 'Failed to tag transactions as "Trained"';
      if (onError) onError(errorMsg);
      showError(errorMsg);
    }
  }, [addTagToMultipleTransactions, hasTag, showError, showSuccess]);

  return {
    // Tag utilities
    getTagName,
    normalizeTag,
    getAllTags,
    hasTag,
    
    // Local tag operations
    addTagToTransaction,
    removeTagFromTransaction,
    getTagNamesFromTransaction,
    
    // API tag operations
    updateTags,
    addTagToMultipleTransactions,
    removeTagFromMultipleTransactions,
    tagTransactionsAsTrained,
    
    // Loading states
    isTagPending
  };
} 