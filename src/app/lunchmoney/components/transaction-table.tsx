import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import CategorySelect from './category-select';
import { Transaction, Category } from './types';
import NoteInput from './note-input'; // Import the new component
import TransactionRow from './TransactionRow'; // Import the new Row component
import { useSelectionContext } from './SelectionContext';
// import { PendingUpdateInfo } from '../hooks/use-categorization'; // Import PendingUpdateInfo

// Define PendingUpdateInfo directly if import is problematic
interface PendingUpdateInfo {
  predictedCategoryId: string | null;
  predictedCategoryName: string | null;
  originalCategoryId: string | null;
  originalCategoryName: string | null;
  score?: number;
  is_low_confidence?: boolean;
  low_confidence_reason?: string;
}

type TransactionTableProps = {
  filteredTransactions: Transaction[];
  pendingCategoryUpdates: Record<string, PendingUpdateInfo>;
  categories: (string | Category)[];
  handleCategoryChange: (transactionId: string, categoryValue: string) => void;
  applyPredictedCategory: (transactionId: string) => void;
  applyingIndividual: string | null;
  cancelSinglePrediction: (transactionId: string) => void;
  getCategoryNameById: (categoryId: string | null) => string | null;
  loading: boolean;
  handleNoteChange: (transactionId: string, newNote: string) => Promise<void>; // Add prop for handling note changes
  isAdminMode: boolean; // Add Admin Mode prop
  updatingCategory: string | null;
  successfulUpdates: Record<string, boolean>;
  updatingNoteId: string | null; // Add prop for loading state
};

const TransactionTable = React.memo(({
  filteredTransactions,
  pendingCategoryUpdates,
  categories,
  handleCategoryChange,
  applyPredictedCategory,
  applyingIndividual,
  cancelSinglePrediction,
  getCategoryNameById,
  loading,
  handleNoteChange,
  isAdminMode,
  updatingCategory,
  successfulUpdates,
  updatingNoteId,
}: TransactionTableProps) => {
  const { isSelected, toggleSelection, selectedIds, clearSelection } = useSelectionContext();

  // Select all logic
  const allIds = filteredTransactions.map(tx => tx.lunchMoneyId);
  const allSelected = allIds.every(id => isSelected(id));
  const someSelected = allIds.some(id => isSelected(id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      allIds.forEach(id => {
        if (!isSelected(id)) toggleSelection(id);
      });
    }
  };

  // Ref and effect for indeterminate state
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  // Determine if the Actions column should be shown based on pending updates
  const showActionsColumn = Object.keys(pendingCategoryUpdates).length > 0;

  if (!loading && filteredTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-surface rounded-lg border border-gray-100 shadow-sm">
        No transactions found for the selected criteria, have you added your API key in Settings?
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full bg-surface text-xs">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">
              <label className="inline-flex items-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
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
            {isAdminMode && ( // Conditionally render Original Name header
              <th className="px-4 py-3 text-left font-medium">Original Name</th>
            )}
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Predicted Category</th>
            {showActionsColumn && (
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
              const pendingUpdate = pendingCategoryUpdates[transaction.lunchMoneyId];
              
              return (
                <TransactionRow
                  key={transaction.lunchMoneyId}
                  transaction={transaction}
                  isSelected={isSelected(transaction.lunchMoneyId)}
                  handleSelectTransaction={toggleSelection}
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
                  showActionsColumn={showActionsColumn}
                  isAdminMode={isAdminMode} // Pass Admin Mode down to Row
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
