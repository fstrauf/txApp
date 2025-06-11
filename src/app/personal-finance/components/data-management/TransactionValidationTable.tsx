'use client';

import React from 'react';
import { CheckIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { ValidationTransaction } from './ValidateTransactionsTab';

interface TransactionValidationTableProps {
  transactions: ValidationTransaction[];
  selectedTransactions: Set<string>;
  editingTransaction: string | null;
  editCategory: string;
  onTransactionSelect: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onValidateTransaction: (id: string) => void;
  onEditCategory: (id: string, category: string) => void;
  onStartEditing: (transaction: ValidationTransaction) => void;
  onStopEditing: () => void;
  onEditCategoryChange: (category: string) => void;
}

const TransactionValidationTable: React.FC<TransactionValidationTableProps> = ({
  transactions,
  selectedTransactions,
  editingTransaction,
  editCategory,
  onTransactionSelect,
  onSelectAll,
  onValidateTransaction,
  onEditCategory,
  onStartEditing,
  onStopEditing,
  onEditCategoryChange
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
                  className="rounded"
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
              <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={(e) => onTransactionSelect(transaction.id, e.target.checked)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {transaction.description}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className={transaction.isDebit ? 'text-red-600' : 'text-green-600'}>
                    {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingTransaction === transaction.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => onEditCategoryChange(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => onEditCategory(transaction.id, editCategory)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={onStopEditing}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{transaction.category}</span>
                      <button
                        onClick={() => onStartEditing(transaction)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(transaction.confidence)}`}>
                    {getConfidenceText(transaction.confidence)} ({Math.round((transaction.confidence || 0) * 100)}%)
                  </span>
                </td>
                <td className="px-4 py-3">
                  {transaction.isValidated ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
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
                  {!transaction.isValidated && (
                    <button
                      onClick={() => onValidateTransaction(transaction.id)}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
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