
import { useState, useMemo } from 'react';
import { ValidationTransaction } from '../components/data-management/ValidateTransactionsTab';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import posthog from 'posthog-js';

export const useTransactionValidation = (initialTransactions: ValidationTransaction[] = []) => {
  const { data: session } = useSession();
  const { userData } = usePersonalFinanceStore();
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  const [validationTransactions, setValidationTransactions] = useState<ValidationTransaction[]>(initialTransactions);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [isValidatingAllRemaining, setIsValidatingAllRemaining] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteValidation = async (onSuccess: () => void) => {
    setIsCompleting(true);
    
    const validated = validationTransactions.filter(t => t.isValidated);
    const transactionsWithCurrency = validated.map(t => ({
      ...t,
      currency: t.originalCurrency || t.baseCurrency || userData.baseCurrency || 'USD'
    }));

    posthog.capture('pf_validation_completed', {
      validated_count: validated.length,
      unvalidated_count: validationTransactions.length - validated.length,
      is_first_time_user: !userData.spreadsheetId,
    });

    try {
      const accessToken = await requestSpreadsheetAccess();
      if (!accessToken) throw new Error('Could not obtain Google Sheets access token.');

      const response = await fetch('/api/sheets/append-validated-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transactions: transactionsWithCurrency,
          spreadsheetId: userData.spreadsheetId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API call failed with status ${response.status}`);
      }

      setValidationTransactions([]);
      onSuccess();

    } catch (error: any) {
      console.error('❌ Error completing validation:', error);
      // Optionally set an error state here to display to the user
    } finally {
      setIsCompleting(false);
    }
  };

  const handleValidateTransaction = (transactionId: string) => {
    setValidationTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, isValidated: true } : t
    ));
  };

  const handleValidateAllRemaining = async () => {
    setIsValidatingAllRemaining(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setValidationTransactions(prev => prev.map(t => 
      !t.isValidated ? { ...t, isValidated: true } : t
    ));
    setIsValidatingAllRemaining(false);
  };

  const handleEditCategory = (transactionId: string, newCategory: string) => {
    setValidationTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, category: newCategory, isValidated: true } : t
    ));
    setEditingTransaction(null);
    setEditCategory('');
  };

  const startEditingCategory = (transaction: ValidationTransaction) => {
    setEditingTransaction(transaction.id);
    setEditCategory(transaction.category);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return validationTransactions.slice(startIndex, endIndex);
  }, [validationTransactions, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(validationTransactions.length / pageSize);
  }, [validationTransactions, pageSize]);

  const validatedCount = useMemo(() => {
    return validationTransactions.filter(t => t.isValidated).length;
  }, [validationTransactions]);

  return {
    validationTransactions,
    setValidationTransactions,
    currentPage,
    pageSize,
    editingTransaction,
    editCategory,
    setEditCategory,
    isValidatingAllRemaining,
    isCompleting,
    paginatedTransactions,
    totalPages,
    validatedCount,
    totalFilteredItems: validationTransactions.length,
    handleValidateTransaction,
    handleValidateAllRemaining,
    handleEditCategory,
    startEditingCategory,
    stopEditing: () => setEditingTransaction(null),
    handlePageChange,
    handlePageSizeChange,
    handleCompleteValidation,
  };
}; 