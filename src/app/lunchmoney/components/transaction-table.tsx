import React from 'react';
import { format } from 'date-fns';
import CategorySelect from './category-select';
import { Transaction, Category } from './types';
import NoteInput from './note-input'; // Import the new component
import TransactionRow from './TransactionRow'; // Import the new Row component

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
  cancelSinglePrediction: (transactionId: string) => void;
  getCategoryNameById: (categoryId: string | null) => string | null;
  loading: boolean;
  handleNoteChange: (transactionId: string, newNote: string) => Promise<void>; // Add prop for handling note changes
  updatingNoteId: string | null; // Add prop for loading state
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
  cancelSinglePrediction,
  getCategoryNameById,
  loading,
  handleNoteChange, // Destructure new prop
  updatingNoteId,  // Destructure new prop
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
                {/* <span className="ml-2 font-medium">Select</span> */}
              </label>
            </th>
            <th className="px-4 py-3 text-left font-medium w-32">Date</th>
            <th className="px-4 py-3 text-left font-medium">Description</th>
            <th className="px-4 py-3 text-left font-medium">Amount</th>
            <th className="px-4 py-3 text-left font-medium">Notes</th>
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
              <td colSpan={8} className="text-center py-12 text-gray-500">
                Loading transactions...
              </td>
            </tr>
          ) : (
            filteredTransactions.map((transaction) => {
              const isSelected = selectedTransactions.includes(transaction.lunchMoneyId);
              const pendingUpdate = pendingCategoryUpdates[transaction.lunchMoneyId];
              
              return (
                <TransactionRow
                  key={transaction.lunchMoneyId}
                  transaction={transaction}
                  isSelected={isSelected}
                  handleSelectTransaction={handleSelectTransaction}
                  pendingUpdate={pendingUpdate}
                  categories={categories}
                  handleCategoryChange={handleCategoryChange}
                  updatingCategory={updatingCategory}
                  successfulUpdates={successfulUpdates}
                  applyPredictedCategory={applyPredictedCategory}
                  applyingIndividual={applyingIndividual}
                  cancelSinglePrediction={cancelSinglePrediction}
                  getCategoryNameById={getCategoryNameById}
                  handleNoteChange={handleNoteChange}
                  updatingNoteId={updatingNoteId}
                />
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
