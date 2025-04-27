import React from 'react';
import { format } from 'date-fns';
import CategorySelect from './category-select';
import { Transaction, Category } from '../types';

type TransactionTableProps = {
  filteredTransactions: Transaction[];
  selectedTransactions: string[];
  handleSelectTransaction: (txId: string) => void;
  handleSelectAll: () => void;
  pendingCategoryUpdates: Record<string, {categoryId: string | null, score: number}>;
  categories: (string | Category)[];
  handleCategoryChange: (transactionId: string, categoryValue: string) => void;
  updatingCategory: string | null;
  successfulUpdates: Record<string, boolean>;
  applyPredictedCategory: (transactionId: string) => void;
  applyingIndividual: string | null;
  getCategoryNameById: (categoryId: string | null) => string | null;
  loading: boolean;
};

const TransactionTable = React.memo(({
  filteredTransactions,
  selectedTransactions,
  handleSelectTransaction,
  handleSelectAll,
  pendingCategoryUpdates,
  categories,
  handleCategoryChange,
  updatingCategory,
  successfulUpdates,
  applyPredictedCategory,
  applyingIndividual,
  getCategoryNameById,
  loading
}: TransactionTableProps) => {
  if (!loading && filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-surface rounded-lg border border-gray-100 shadow-sm">
        No transactions found for the selected criteria, have you added your API key in Settings?
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full bg-surface text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={
                    filteredTransactions.length > 0 && 
                    filteredTransactions.every(tx => selectedTransactions.includes(tx.lunchMoneyId))
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 accent-primary border-gray-300 rounded"
                />
                <span className="ml-2 font-medium">Select</span>
              </label>
            </th>
            <th className="px-4 py-3 text-left font-medium w-32">Date</th>
            <th className="px-4 py-3 text-left font-medium">Description</th>
            <th className="px-4 py-3 text-left font-medium">Amount</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Predicted Category</th>
            {Object.keys(pendingCategoryUpdates).length > 0 && (
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-gray-500">
                Loading transactions...
              </td>
            </tr>
          ) : (
            filteredTransactions.map((transaction) => {
            const pendingUpdate = pendingCategoryUpdates[transaction.lunchMoneyId];
            const hasPendingUpdate = !!pendingUpdate;
            
            return (
              <tr key={transaction.lunchMoneyId} className={`hover:bg-gray-50 ${ 
                hasPendingUpdate ? 'bg-secondary/5' : 'bg-surface'
              }`}>
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(transaction.lunchMoneyId)}
                    onChange={() => handleSelectTransaction(transaction.lunchMoneyId)}
                    className="h-4 w-4 accent-primary border-gray-300 rounded"
                  />
                </td>
                <td className="px-4 py-3 align-top text-gray-700 w-32">
                  {typeof transaction.date === 'string' 
                    ? transaction.date 
                    : transaction.date instanceof Date 
                      ? format(transaction.date, 'yyyy-MM-dd')
                      : 'Invalid date'
                  }
                  {transaction.tags && Array.isArray(transaction.tags) && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {transaction.tags?.filter((tag: any) => 
                        (typeof tag === 'string' ? tag : tag.name)?.toLowerCase() !== 'tx-categorized'
                      ).map((tag: any, idx: number) => (
                        <span 
                          key={`${typeof tag === 'string' ? tag : tag.name || tag.id || idx}-${idx}`}
                          className="text-xs bg-primary text-white rounded-full px-2 py-0.5 font-medium">
                          {typeof tag === 'string' ? tag : tag.name || 'Tag'}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-gray-800">
                  {typeof transaction.description === 'object' 
                    ? JSON.stringify(transaction.description) 
                    : transaction.description}
                </td>
                <td className={`px-4 py-3 align-top font-medium ${transaction.is_income ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.is_income ? '+' : '-'}
                  {typeof transaction.amount === 'number' 
                    ? Math.abs(transaction.amount).toFixed(2) 
                    : Math.abs(parseFloat(String(transaction.amount))).toFixed(2)}
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.is_income ? 'Income' : 'Expense'}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <CategorySelect
                    transaction={transaction}
                    categories={categories}
                    handleCategoryChange={handleCategoryChange}
                    updatingCategory={updatingCategory}
                    successfulUpdates={successfulUpdates}
                    hasPendingUpdate={hasPendingUpdate}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  {hasPendingUpdate ? (
                    <div className="flex items-center">
                      <span className="font-medium text-secondary-dark">
                        {pendingUpdate.categoryId === "none" ? "Uncategorized" : 
                          getCategoryNameById(pendingUpdate.categoryId) || pendingUpdate.categoryId}
                      </span>
                      {pendingUpdate.score > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({Math.round(pendingUpdate.score * 100)}% match)
                        </span>
                      )}
                    </div>
                  ) : (
                    transaction.predictedCategory || <span className="text-gray-400 italic">Not predicted</span>
                  )}
                </td>
                
                {/* Actions column for Apply button */}
                {Object.keys(pendingCategoryUpdates).length > 0 && (
                  <td className="px-4 py-3 align-top">
                    {hasPendingUpdate && (
                      <button
                        onClick={() => applyPredictedCategory(transaction.lunchMoneyId)}
                        disabled={applyingIndividual === transaction.lunchMoneyId || successfulUpdates[transaction.lunchMoneyId]}
                        className={`px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 ${
                          successfulUpdates[transaction.lunchMoneyId]
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                            : 'bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed'
                        }`}
                      >
                        {applyingIndividual === transaction.lunchMoneyId ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Applying
                          </span>
                        ) : successfulUpdates[transaction.lunchMoneyId] ? (
                          <span className="flex items-center">
                            <svg className="h-3 w-3 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Applied
                          </span>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

TransactionTable.displayName = 'TransactionTable';

export default TransactionTable;
