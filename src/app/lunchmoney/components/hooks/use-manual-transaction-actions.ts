import { useState, useCallback } from 'react';
import { Transaction, Category } from '../types';
import { useToast } from './use-toast';
import { useTransactionData } from './use-transaction-data'; // To get updateTransaction for invalidation

interface UseManualTransactionActionsProps {
  // transactions: Transaction[]; // Potentially needed if optimistic updates are complex
  categories: Category[];
  // updateTransaction from useTransactionData is used via calling it from the hook itself
}

export function useManualTransactionActions() {
  const { showToast, showError, showSuccess } = useToast();
  const { updateTransaction, categories: allCategories } = useTransactionData(); // Get categories for name lookup

  const [updatingFields, setUpdatingFields] = useState<Record<string, { category?: boolean, note?: boolean }>>({});

  const handleManualCategoryChange = useCallback(async (transactionId: string, newCategoryId: string | null) => {
    if (!transactionId) return;

    setUpdatingFields(prev => ({ ...prev, [transactionId]: { ...prev[transactionId], category: true } }));

    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, categoryId: newCategoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category manually');
      }
      
      // Optimistic update handled by query invalidation via updateTransaction
      const categoryName = allCategories.find(c => c.id === newCategoryId)?.name || newCategoryId || 'Uncategorized';
      // We need the full transaction object to pass to updateTransaction if we were to update it here.
      // For now, relying on query invalidation by useTransactionData.updateTransaction to refresh.
      // This means we don't need the full transaction passed into this hook.
      // To make updateTransaction work correctly for optimistic UI, it expects the *updated* transaction.
      // However, the PATCH only returns a success/fail. We'd have to reconstruct or refetch.
      // Simplest for now: call updateTransaction with a minimal object just to trigger invalidation.
      updateTransaction({ lunchMoneyId: transactionId } as Transaction); // Trigger invalidation

      showSuccess(`Category updated to ${categoryName}.`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      showError(message);
    } finally {
      setUpdatingFields(prev => ({ ...prev, [transactionId]: { ...prev[transactionId], category: false } }));
    }
  }, [showToast, showError, showSuccess, updateTransaction, allCategories]);

  const handleNoteChange = useCallback(async (transactionId: string, newNote: string) => {
    if (!transactionId) return;

    setUpdatingFields(prev => ({ ...prev, [transactionId]: { ...prev[transactionId], note: true } }));
    
    try {
      const response = await fetch('/api/lunch-money/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, notes: newNote }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update note');
      }

      // Similar to category change, rely on query invalidation.
      updateTransaction({ lunchMoneyId: transactionId, notes: newNote } as Transaction); // Trigger invalidation
      showSuccess('Note updated.');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      showError(message);
    } finally {
      setUpdatingFields(prev => ({ ...prev, [transactionId]: { ...prev[transactionId], note: false } }));
    }
  }, [showToast, showError, showSuccess, updateTransaction]);

  const getUpdatingState = useCallback((transactionId: string, field: 'category' | 'note') => {
    return !!updatingFields[transactionId]?.[field];
  }, [updatingFields]);

  return {
    handleManualCategoryChange,
    handleNoteChange,
    getUpdatingState,
    // For direct check if needed, though getUpdatingState is more granular
    // isUpdatingCategory: (txId: string) => !!updatingFields[txId]?.category,
    // isUpdatingNote: (txId: string) => !!updatingFields[txId]?.note,
  };
} 