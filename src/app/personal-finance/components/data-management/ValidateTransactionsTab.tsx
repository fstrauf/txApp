'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import ValidationControls from './ValidationControls';
import TransactionValidationTable from './TransactionValidationTable';
import Pagination from './Pagination';

export interface ValidationTransaction {
  id: string;
  date: string;
  description: string;
  narrative?: string;
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
  paginatedTransactions: ValidationTransaction[];
  editingTransaction: string | null;
  editCategory: string;
  createNewSpreadsheetMode: boolean;
  showCurrencySelection: boolean;
  newSpreadsheetCurrency: string;
  isProcessing: boolean;
  isValidatingAllRemaining: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  validatedCount: number;
  totalFilteredItems: number;
  onValidateTransaction: (id: string) => void;
  onValidateAllRemaining: () => void;
  onEditCategory: (id: string, category: string) => void;
  onStartEditing: (transaction: ValidationTransaction) => void;
  onStopEditing: () => void;
  onEditCategoryChange: (category: string) => void;
  onCompleteValidation: () => void;
  onCurrencySelection: (selectedCurrency: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ValidateTransactionsTab: React.FC<ValidateTransactionsTabProps> = ({
  validationTransactions,
  paginatedTransactions,
  editingTransaction,
  editCategory,
  createNewSpreadsheetMode,
  showCurrencySelection,
  newSpreadsheetCurrency,
  isProcessing,
  isValidatingAllRemaining,
  currentPage,
  pageSize,
  totalPages,
  validatedCount,
  totalFilteredItems,
  onValidateTransaction,
  onValidateAllRemaining,
  onEditCategory,
  onStartEditing,
  onStopEditing,
  onEditCategoryChange,
  onCompleteValidation,
  onCurrencySelection,
  onPageChange,
  onPageSizeChange
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

  // Note: Filtering and sorting is now handled at the parent level before pagination

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
        filteredTransactions={validationTransactions}
        validatedCount={validatedCount}
        createNewSpreadsheetMode={createNewSpreadsheetMode}
        showCurrencySelection={showCurrencySelection}
        newSpreadsheetCurrency={newSpreadsheetCurrency}
        isProcessing={isProcessing}
        isValidatingAllRemaining={isValidatingAllRemaining}
        onValidateAllRemaining={onValidateAllRemaining}
        onCompleteValidation={onCompleteValidation}
        onCurrencySelection={onCurrencySelection}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalFilteredItems}
        validatedCount={validatedCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* Transactions Table */}
      <TransactionValidationTable
        transactions={paginatedTransactions}
        categories={categories}
        onValidateTransaction={onValidateTransaction}
        onEditCategory={onEditCategory}
      />

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalFilteredItems}
          validatedCount={validatedCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default ValidateTransactionsTab; 