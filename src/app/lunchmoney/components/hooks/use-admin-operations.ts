import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { useToast } from './use-toast';
import { useTransactionData } from './use-transaction-data';
import { useSelection } from './use-selection';

export function useAdminOperations() {
  const { showToast, showError, showSuccess, showInfo } = useToast(); // Added showInfo
  const { allTransactions, updateTransactions } = useTransactionData(); 
  const { selectedIds } = useSelection();

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [filterNoPayee, setFilterNoPayee] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferOriginalNames = useCallback(async () => {
    if (selectedIds.length === 0) {
      showInfo('Please select transactions to transfer original names.');
      return;
    }

    setIsTransferring(true);
    showInfo(`Attempting to transfer original names for ${selectedIds.length} transactions...`);

    const transactionsToUpdate: Partial<Transaction>[] = [];
    // let successCount = 0; // successCount will be transactionsToUpdate.length after filtering
    // let failCount = 0; // Assuming API call handles this or we simplify for now

    selectedIds.forEach(id => {
      const transaction = allTransactions.find(tx => tx.lunchMoneyId === id);
      // Ensure originalData and originalData.payee exist and are not already '[No Payee]'
      if (transaction && transaction.originalData && transaction.originalData.payee && transaction.originalData.payee !== '[No Payee]') {
        // Ensure there is an actual change to be made
        if (transaction.description !== transaction.originalData.payee) {
          transactionsToUpdate.push({
            lunchMoneyId: id,
            description: transaction.originalData.payee, // Transfer original payee to description
          });
        }
      }
    });

    if (transactionsToUpdate.length === 0) {
      showInfo('No transactions required original name transfer (e.g., payee already matches description or no original payee available).');
      setIsTransferring(false);
      return;
    }

    try {
      // Construct full transaction objects for the update, as updateTransactions might expect them
      const fullTransactionsToUpdate = transactionsToUpdate.map(partialTx => {
        const originalTx = allTransactions.find(tx => tx.lunchMoneyId === partialTx.lunchMoneyId);
        // Ensure originalTx is found before spreading, though it should be from the loop above
        if (!originalTx) throw new Error(`Transaction with ID ${partialTx.lunchMoneyId} not found for update.`);
        return { ...originalTx, ...partialTx } as Transaction;
      }).filter(Boolean); // Filter out any potential nulls if error handling was different

      if (fullTransactionsToUpdate.length > 0) {
        // updateTransactions will invalidate queries via useTransactionData
        updateTransactions(fullTransactionsToUpdate);
        showSuccess(`${fullTransactionsToUpdate.length} transaction(s) had their original names transferred to description.`);
      } else {
        // This case should be caught by the earlier check of transactionsToUpdate.length === 0
        showInfo('No valid transactions were prepared for original name transfer.');
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      showError(`Failed to transfer original names: ${message}`);
    } finally {
      setIsTransferring(false);
    }
  }, [selectedIds, allTransactions, updateTransactions, showInfo, showSuccess, showError]);

  return {
    isAdminMode,
    setIsAdminMode,
    filterNoPayee,
    setFilterNoPayee,
    handleTransferOriginalNames,
    isTransferringNames: isTransferring,
  };
} 