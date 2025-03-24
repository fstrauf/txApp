import { useState, useCallback } from 'react';
import { Transaction, ImportStatus } from '../types';
import { useApi } from './use-api';
import { useToast } from './use-toast';

export function useImport() {
  const { importTransactions } = useApi();
  const { showSuccess, showError } = useToast();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [importedCount, setImportedCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Reset the import state
  const resetImport = useCallback(() => {
    setStatus('idle');
    setImportedCount(0);
    setError(null);
  }, []);

  // Import transactions from an array
  const importTransactionsToLunchMoney = useCallback(async (
    transactions: Transaction[], 
    onSuccess?: (count: number) => void,
    onError?: (error: string) => void
  ): Promise<number> => {
    if (!transactions.length) {
      const errorMsg = 'No transactions to import';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return 0;
    }

    setStatus('importing');
    setError(null);
    
    try {
      const response = await importTransactions(transactions);
      
      if (response.isError || !response.data) {
        const errorMsg = response.error || 'Failed to import transactions';
        setStatus('error');
        setError(errorMsg);
        if (onError) onError(errorMsg);
        showError(errorMsg);
        return 0;
      }
      
      const { count } = response.data;
      setImportedCount(count);
      setStatus('success');
      
      const successMsg = `Successfully imported ${count} transactions`;
      if (onSuccess) onSuccess(count);
      showSuccess(successMsg);
      
      return count;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import transactions';
      setStatus('error');
      setError(errorMsg);
      if (onError) onError(errorMsg);
      showError(errorMsg);
      return 0;
    }
  }, [importTransactions, showError, showSuccess]);

  return {
    importTransactionsToLunchMoney,
    resetImport,
    status,
    importedCount,
    error,
    isImporting: status === 'importing',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
} 