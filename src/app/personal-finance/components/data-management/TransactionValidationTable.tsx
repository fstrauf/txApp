'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Select from '@/components/ui/Select';
import type { ValidationTransaction } from './ValidateTransactionsTab';

interface TransactionValidationTableProps {
  transactions: ValidationTransaction[];
  selectedTransactions: Set<string>;
  categories: string[];
  onTransactionSelect: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onValidateTransaction: (id: string) => void;
  onEditCategory: (id: string, category: string) => void;
}

const TransactionValidationTable: React.FC<TransactionValidationTableProps> = ({
  transactions,
  selectedTransactions,
  categories,
  onTransactionSelect,
  onSelectAll,
  onValidateTransaction,
  onEditCategory
}) => {
  const getConfidenceColor = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'text-purple-600 bg-purple-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number = 0) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Confidence</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <tr 
                key={transaction.id} 
                className={`
                  ${transaction.isValidated 
                    ? 'bg-green-50 border-l-4 border-l-green-400' 
                    : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }
                  transition-colors duration-200
                `}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={(e) => onTransactionSelect(transaction.id, e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={transaction.narrative}>
                  {transaction.narrative || transaction.description}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className={transaction.isDebit ? 'text-red-600' : 'text-green-600'}>
                    {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="min-w-[120px]">
                    <Select
                      value={transaction.category}
                      onChange={(newCategory) => {
                        // Update category and automatically validate if changed
                        onEditCategory(transaction.id, newCategory);
                        if (newCategory !== transaction.category) {
                          onValidateTransaction(transaction.id);
                        }
                      }}
                      options={categories.map(cat => ({ value: cat, label: cat }))}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                    {getConfidenceText(transaction.confidence)} ({Math.round((transaction.confidence || 0) * 100)}%)
                  </span>
                </td>
                <td className="px-4 py-3">
                  {transaction.isValidated ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Validated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {transaction.isValidated ? (
                    <button
                      disabled
                      className="px-3 py-1 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                    >
                      Validated
                    </button>
                  ) : (
                    <button
                      onClick={() => onValidateTransaction(transaction.id)}
                      className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                    >
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionValidationTable; 