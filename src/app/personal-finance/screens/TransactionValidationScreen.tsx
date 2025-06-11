'use client';

import React, { useState, useEffect } from 'react';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Header } from '@/components/ui/Header';
import { 
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
  predicted_category?: string;
  similarity_score?: number;
  confidence?: number;
  isValidated?: boolean;
  isSelected?: boolean;
  [key: string]: any; // Allow additional properties from different sources
}

interface ValidationScreenProps {
  transactions?: Transaction[];
  onValidationComplete?: (validatedTransactions: Transaction[]) => void;
  onCancel?: () => void;
}

const TransactionValidationScreen: React.FC<ValidationScreenProps> = ({
  transactions: initialTransactions,
  onValidationComplete,
  onCancel
}) => {
  const { goToScreen } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'transactionValidation', 
    progress: 80 
  });
  const { userData, processTransactionData } = usePersonalFinanceStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showOnlyUnvalidated, setShowOnlyUnvalidated] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize transactions from props or store
  useEffect(() => {
    let transactionsToUse = initialTransactions || userData.transactions || [];
    
    if (transactionsToUse.length > 0) {
      const transactionsWithIds = transactionsToUse.map((t, index) => ({
        ...t,
        id: t.id || `transaction-${index}`,
        isValidated: false,
        isSelected: false,
        confidence: (t as any).similarity_score || (t as any).confidence || Math.random() * 0.3 + 0.7, // Use existing confidence or generate
      }));
      setTransactions(transactionsWithIds);
    }
  }, [initialTransactions, userData.transactions]);

  // Get unique categories for filtering
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  // Filter and sort transactions
  const filteredAndSortedTransactions = transactions
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

  const handleTransactionSelect = (transactionId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (isSelected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredAndSortedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredAndSortedTransactions.map(t => t.id)));
    }
  };

  const handleValidateTransaction = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, isValidated: true } : t
    ));
    
    trackAction('transaction_validated', {
      transaction_id: transactionId,
      category: transactions.find(t => t.id === transactionId)?.category
    });
  };

  const handleValidateSelected = () => {
    const selectedIds = Array.from(selectedTransactions);
    setTransactions(prev => prev.map(t => 
      selectedIds.includes(t.id) ? { ...t, isValidated: true } : t
    ));
    
    trackAction('bulk_transactions_validated', {
      count: selectedIds.length,
      categories: selectedIds.map(id => transactions.find(t => t.id === id)?.category)
    });
    
    setSelectedTransactions(new Set());
  };

  const handleEditCategory = (transactionId: string, newCategory: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, category: newCategory, isValidated: true } : t
    ));
    setEditingTransaction(null);
    setEditCategory('');
    
    trackAction('transaction_category_edited', {
      transaction_id: transactionId,
      new_category: newCategory
    });
  };

  const startEditingCategory = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    setEditCategory(transaction.category);
  };

  const handleCompleteValidation = async () => {
    const validatedTransactions = transactions.filter(t => t.isValidated);
    
    trackAction('validation_completed', {
      total_transactions: transactions.length,
      validated_count: validatedTransactions.length,
      categories: Array.from(new Set(validatedTransactions.map(t => t.category)))
    });

    // Update the store with validated transactions
    processTransactionData(validatedTransactions);

    // If user has a spreadsheet, append the validated transactions and then refresh dashboard
    if (userData.spreadsheetId && validatedTransactions.length > 0) {
      setIsSubmitting(true); // Show loading state
      try {
        const response = await fetch('/api/sheets/append-validated-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: validatedTransactions,
            spreadsheetId: userData.spreadsheetId
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Successfully appended transactions to spreadsheet:', result);
          
          trackAction('transactions_appended_to_sheet', {
            appended_count: result.appendedCount || result.updatedRows || validatedTransactions.length,
            spreadsheet_id: userData.spreadsheetId
          });

          // Show success feedback
          setFeedback({
            type: 'success',
            message: `✅ Successfully saved ${result.updatedRows || validatedTransactions.length} transactions to your Google Sheet!`
          });

          // Wait a moment for user to see the success message
          setTimeout(() => {
            // Clear the local transaction data to force dashboard to refresh from spreadsheet
            processTransactionData([]);
            
            // Navigate to dashboard - the auto-refresh will kick in
            if (onValidationComplete) {
              onValidationComplete(validatedTransactions);
            } else {
              goToScreen('dashboard');
            }
          }, 1500);

        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save to Google Sheets');
        }
      } catch (error: any) {
        console.error('Error appending transactions:', error);
        setFeedback({
          type: 'error',
          message: `❌ Failed to save to Google Sheets: ${error.message}`
        });
        setIsSubmitting(false);
        
        // Still navigate after error, but with current data
        setTimeout(() => {
          if (onValidationComplete) {
            onValidationComplete(validatedTransactions);
          } else {
            goToScreen('spendingAnalysisResults');
          }
        }, 2000);
      }
    } else {
      // No spreadsheet linked, use original behavior
      if (onValidationComplete) {
        onValidationComplete(validatedTransactions);
      } else {
        goToScreen('spendingAnalysisResults');
      }
    }
  };

  const validatedCount = transactions.filter(t => t.isValidated).length;
  const totalCount = transactions.length;
  const progressPercentage = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;

  if (transactions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Transactions to Validate</h3>
          <p className="text-slate-500 mb-6">
            Upload and categorize transactions first to see validation options.
          </p>
          <button
            onClick={() => goToScreen('spendingAnalysisUpload')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm"
          >
            Upload Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <Header 
        variant="gradient"
        size="xl"
        badge={{
          text: `${validatedCount}/${totalCount} Validated`,
          variant: validatedCount === totalCount ? "success" : "info"
        }}
        subtitle="Review and approve the categorization suggestions"
      >
        Validate Your Transactions
      </Header>

      {/* Progress Bar */}
      <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Validation Progress</span>
          <span className="text-sm text-slate-500">{validatedCount} of {totalCount} completed</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200 text-slate-700 hover:text-slate-900"
            >
              {selectedTransactions.size === filteredAndSortedTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedTransactions.size > 0 && (
              <button
                onClick={handleValidateSelected}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 shadow-sm"
              >
                Validate Selected ({selectedTransactions.size})
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showOnlyUnvalidated}
                onChange={(e) => setShowOnlyUnvalidated(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              Show only unvalidated
            </label>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="confidence">Confidence</option>
              <option value="amount">Amount</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors duration-200 text-slate-600 hover:text-slate-800"
            >
              {sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTransactions.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedTransactions.has(transaction.id)}
                  onSelect={handleTransactionSelect}
                  onValidate={handleValidateTransaction}
                  onEdit={startEditingCategory}
                  isEditing={editingTransaction === transaction.id}
                  editValue={editCategory}
                  onEditValueChange={setEditCategory}
                  onEditSave={(newCategory) => handleEditCategory(transaction.id, newCategory)}
                  onEditCancel={() => {
                    setEditingTransaction(null);
                    setEditCategory('');
                  }}
                  isEven={index % 2 === 0}
                  availableCategories={categories}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`mt-6 p-4 rounded-lg border ${
          feedback.type === 'success' 
            ? 'bg-purple-50 border-purple-200 text-purple-700' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2 text-purple-600" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            )}
            {feedback.message}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="text-sm text-slate-600">
          {validatedCount} of {totalCount} transactions validated
        </div>
        
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 disabled:opacity-50 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleCompleteValidation}
            disabled={validatedCount === 0 || isSubmitting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting 
              ? `Saving to Google Sheets...` 
              : `Complete Validation (${validatedCount})`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// Individual transaction row component
interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onValidate: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onEditSave: (newCategory: string) => void;
  onEditCancel: () => void;
  isEven: boolean;
  availableCategories: string[];
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  isSelected,
  onSelect,
  onValidate,
  onEdit,
  isEditing,
  editValue,
  onEditValueChange,
  onEditSave,
  onEditCancel,
  isEven,
  availableCategories
}) => {
  const getConfidenceColor = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'text-purple-700 bg-purple-50 border border-purple-200';
    if (confidence >= 0.6) return 'text-amber-700 bg-amber-50 border border-amber-200';
    return 'text-red-700 bg-red-50 border border-red-200';
  };

  const getConfidenceText = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <tr className={`${
      transaction.isValidated 
        ? 'bg-purple-50' 
        : isEven 
          ? 'bg-white' 
          : 'bg-slate-50'
    } ${transaction.isValidated ? 'opacity-75' : ''} hover:bg-slate-100 transition-colors duration-150`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(transaction.id, e.target.checked)}
          className="h-4 w-4 accent-purple-600 border-slate-300 rounded"
          disabled={transaction.isValidated}
        />
      </td>
      <td className="px-4 py-3 text-sm text-slate-900">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`font-medium ${transaction.isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
          {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <select
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="px-2 py-1 text-sm border border-slate-300 rounded-md flex-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave(editValue);
                if (e.key === 'Escape') onEditCancel();
              }}
              autoFocus
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              onClick={() => onEditSave(editValue)}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors duration-200"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onEditCancel}
              className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className={`inline-flex items-center gap-1 ${
            transaction.isValidated 
              ? 'text-purple-700 font-medium' 
              : 'text-slate-900'
          }`}>
            {transaction.category}
            {transaction.isValidated && <CheckCircleIcon className="h-4 w-4 text-purple-600" />}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(transaction.confidence)}`}>
          {getConfidenceText(transaction.confidence)} ({Math.round((transaction.confidence || 0) * 100)}%)
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {!transaction.isValidated && (
            <>
              <button
                onClick={() => onValidate(transaction.id)}
                className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors duration-200"
                title="Validate"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(transaction)}
                className="p-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors duration-200"
                title="Edit category"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TransactionValidationScreen; 