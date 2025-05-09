import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { useToast } from './use-toast';
import { useSelection } from './use-selection';
import { useQueryClient } from '@tanstack/react-query';

interface UseAdminOperationsProps {
  allTransactions: Transaction[];
  selectedIds: string[];
}

export function useAdminOperations({ 
  allTransactions: currentAllTransactions,
  selectedIds: currentSelectedIds 
}: UseAdminOperationsProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const queryClient = useQueryClient();

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [filterNoPayee, setFilterNoPayee] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferOriginalNames = useCallback(async () => {
    console.log('[useAdminOperations] handleTransferOriginalNames CALLED. Selected IDs:', currentSelectedIds, 'All Transactions Count:', currentAllTransactions.length);
    if (currentSelectedIds.length === 0) {
      showInfo('Please select transactions to transfer original names.');
      console.log('[useAdminOperations] No selected IDs, returning from handleTransferOriginalNames.');
      return;
    }

    setIsTransferring(true);
    showInfo(`Processing ${currentSelectedIds.length} selected transaction(s)...`);

    const transactionsToProcess = currentSelectedIds.map(id => {
      const transaction = currentAllTransactions.find(tx => tx.lunchMoneyId === id);
      console.log(`[useAdminOperations] Checking TxID ${id}:`, {
        found: !!transaction,
        description: transaction?.description,
        originalData: transaction?.originalData,
        originalPayee: transaction?.originalData?.payee,
        originalName: transaction?.originalData?.original_name
      });
      if (transaction && 
          transaction.originalData && 
          transaction.originalData.original_name &&
          transaction.description !== transaction.originalData.original_name) {
        return {
          lunchMoneyId: id,
          newDescription: transaction.originalData.original_name,
        };
      }
      return null;
    }).filter(Boolean) as Array<{ lunchMoneyId: string; newDescription: string }>;

    console.log('[useAdminOperations] transactionsToProcess (using original_name):', transactionsToProcess);
    if (transactionsToProcess.length === 0) {
      showInfo('No transactions required original name transfer (e.g., description already matches original payee, or no original payee available).');
      setIsTransferring(false);
      console.log('[useAdminOperations] No transactions to process, returning from handleTransferOriginalNames.');
      return;
    }

    console.log(`[useAdminOperations] About to Promise.allSettled for ${transactionsToProcess.length} transactions.`);
    let successCount = 0;
    let failCount = 0;

    const results = await Promise.allSettled(
      transactionsToProcess.map(txToUpdate => 
        fetch('/api/lunch-money/transactions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: txToUpdate.lunchMoneyId,
            payee: txToUpdate.newDescription,
          }),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}`}));
            throw new Error(errorData.error || `Failed to update description for ${txToUpdate.lunchMoneyId}`);
          }
          return response.json();
        })
      )
    );

    results.forEach((result, index) => {
      const txInfo = transactionsToProcess[index];
      if (result.status === 'fulfilled') {
        successCount++;
        console.log(`Successfully transferred name for ${txInfo.lunchMoneyId}`);
      } else {
        failCount++;
        console.error(`Failed to transfer name for ${txInfo.lunchMoneyId}:`, result.reason);
      }
    });

    if (successCount > 0) {
      showSuccess(`${successCount} transaction(s) had their descriptions updated from original names.`);
      queryClient.invalidateQueries({ queryKey: ['lunchMoneyTransactions'] });
    }
    if (failCount > 0) {
      showError(`${failCount} transaction(s) failed to update.`);
    }
    if (successCount === 0 && failCount === 0) {
        showInfo('No transactions were processed for name transfer.');
    }

    setIsTransferring(false);
  }, [currentSelectedIds, currentAllTransactions, queryClient, showInfo, showSuccess, showError]);

  return {
    isAdminMode,
    setIsAdminMode,
    filterNoPayee,
    setFilterNoPayee,
    handleTransferOriginalNames,
    isTransferringNames: isTransferring,
  };
} 