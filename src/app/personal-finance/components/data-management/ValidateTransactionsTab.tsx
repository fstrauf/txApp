'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import ValidationControls from './ValidationControls';
import TransactionValidationTable from './TransactionValidationTable';

export interface ValidationTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  baseCurrency?: string;
  category: string;
  account: string;
  isDebit: boolean;
  predicted_category?: string;
  similarity_score?: number;
  confidence?: number;
  isValidated?: boolean;
  isSelected?: boolean;
  [key: string]: any;
}

interface ValidateTransactionsTabProps {
  validationTransactions: ValidationTransaction[];
  selectedTransactions: Set<string>;
  editingTransaction: string | null;
  editCategory: string;
  sortBy: 'date' | 'amount' | 'confidence';
  sortDirection: 'asc' | 'desc';
  filterCategory: string;
  showOnlyUnvalidated: boolean;
  createNewSpreadsheetMode: boolean;
  showCurrencySelection: boolean;
  newSpreadsheetCurrency: string;
  isProcessing: boolean;
  isValidatingAllRemaining: boolean;
  onTransactionSelect: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onValidateTransaction: (id: string) => void;
  onValidateSelected: () => void;
  onValidateAllRemaining: () => void;
  onEditCategory: (id: string, category: string) => void;
  onStartEditing: (transaction: ValidationTransaction) => void;
  onStopEditing: () => void;
  onEditCategoryChange: (category: string) => void;
  onSortChange: (field: 'date' | 'amount' | 'confidence') => void;
  onSortDirectionToggle: () => void;
  onFilterCategoryChange: (category: string) => void;
  onShowOnlyUnvalidatedChange: (show: boolean) => void;
  onCompleteValidation: () => void;
  onCurrencySelection: (selectedCurrency: string) => void;
}

const ValidateTransactionsTab: React.FC<ValidateTransactionsTabProps> = ({
  validationTransactions,
  selectedTransactions,
  editingTransaction,
  editCategory,
  sortBy,
  sortDirection,
  filterCategory,
  showOnlyUnvalidated,
  createNewSpreadsheetMode,
  showCurrencySelection,
  newSpreadsheetCurrency,
  isProcessing,
  isValidatingAllRemaining,
  onTransactionSelect,
  onSelectAll,
  onValidateTransaction,
  onValidateSelected,
  onValidateAllRemaining,
  onEditCategory,
  onStartEditing,
  onStopEditing,
  onEditCategoryChange,
  onSortChange,
  onSortDirectionToggle,
  onFilterCategoryChange,
  onShowOnlyUnvalidatedChange,
  onCompleteValidation,
  onCurrencySelection
}) => {
  const { userData } = usePersonalFinanceStore();

  // Get unique categories from existing spreadsheet data (userData.transactions)
  // This gives users their actual categories they've been using
  const categories = React.useMemo(() => {
    const existingCategories = new Set<string>();
    
    // Add categories from existing spreadsheet data
    if (userData.transactions && userData.transactions.length > 0) {
      userData.transactions.forEach(transaction => {
        if (transaction.category && transaction.category.trim() !== '') {
          existingCategories.add(transaction.category.trim());
        }
      });
    }
    
    // Also add categories from validation transactions as fallback
    validationTransactions.forEach(transaction => {
      if (transaction.category && transaction.category.trim() !== '') {
        existingCategories.add(transaction.category.trim());
      }
    });
    
    // Convert to sorted array
    return Array.from(existingCategories).sort();
  }, [userData.transactions, validationTransactions]);

  // Filter and sort validation transactions
  const filteredValidationTransactions = validationTransactions
    .filter(t => {
      if (showOnlyUnvalidated && t.isValidated) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'amount':
          aVal = Math.abs(a.amount);
          bVal = Math.abs(b.amount);
          break;
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        default:
          return 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const validatedCount = validationTransactions.filter(t => t.isValidated).length;
  const totalValidationCount = validationTransactions.length;
  const progressPercentage = totalValidationCount > 0 ? (validatedCount / totalValidationCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Validation Progress</span>
          <span className="text-sm text-blue-600">{validatedCount} of {totalValidationCount} completed</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Validation Controls */}
      <ValidationControls
        selectedTransactions={selectedTransactions}
        filteredTransactions={filteredValidationTransactions}
        showOnlyUnvalidated={showOnlyUnvalidated}
        filterCategory={filterCategory}
        sortBy={sortBy}
        sortDirection={sortDirection}
        categories={categories}
        validatedCount={validatedCount}
        createNewSpreadsheetMode={createNewSpreadsheetMode}
        showCurrencySelection={showCurrencySelection}
        newSpreadsheetCurrency={newSpreadsheetCurrency}
        isProcessing={isProcessing}
        isValidatingAllRemaining={isValidatingAllRemaining}
        onSelectAll={onSelectAll}
        onValidateSelected={onValidateSelected}
        onValidateAllRemaining={onValidateAllRemaining}
        onShowOnlyUnvalidatedChange={onShowOnlyUnvalidatedChange}
        onFilterCategoryChange={onFilterCategoryChange}
        onSortChange={onSortChange}
        onSortDirectionToggle={onSortDirectionToggle}
        onCompleteValidation={onCompleteValidation}
        onCurrencySelection={onCurrencySelection}
      />

      {/* Transactions Table */}
      <TransactionValidationTable
        transactions={filteredValidationTransactions}
        selectedTransactions={selectedTransactions}
        categories={categories}
        onTransactionSelect={onTransactionSelect}
        onSelectAll={onSelectAll}
        onValidateTransaction={onValidateTransaction}
        onEditCategory={onEditCategory}
      />
    </div>
  );
};

export default ValidateTransactionsTab; 