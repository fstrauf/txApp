import React from 'react';
import { useSelectionContext } from './SelectionContext';
// import { ImportStatus } from './types'; // Type no longer needed
// import HelpTooltip from '@/components/shared/HelpTooltip'; // No longer needed

// Define PendingUpdateInfo directly if import is problematic
interface PendingUpdateInfo {
  predictedCategoryId: string | null;
  predictedCategoryName: string | null;
  originalCategoryId: string | null;
  originalCategoryName: string | null;
  score?: number;
}

interface CategorizationControlsProps {
  pendingCategoryUpdates: Record<string, PendingUpdateInfo>; // Use local PendingUpdateInfo
  applyingAll: boolean;
  applyAllPredictedCategories: () => void;
  // handleImportTransactions: () => void; // Removed
  handleTrainSelected: () => void;
  handleCategorizeSelected: () => void;
  handleTrainAllReviewed: () => void;
  loading: boolean;
  operationInProgress: boolean;
  // importStatus: ImportStatus; // Removed
  // importMessage: string; // Removed
  handleCancelCategorization: () => void;
  lastTrainedTimestamp: string | null;
}

const CategorizationControls = React.memo(({
  pendingCategoryUpdates,
  applyingAll,
  applyAllPredictedCategories,
  handleTrainSelected,
  handleCategorizeSelected,
  handleTrainAllReviewed,
  operationInProgress,
  // importStatus, // Removed
  // importMessage, // Removed
  handleCancelCategorization
}: CategorizationControlsProps) => {
  const hasPendingUpdates = Object.keys(pendingCategoryUpdates).length > 0;
  const { selectedIds } = useSelectionContext();
  const selectedTransactionsCount = selectedIds.size;

  // Log received props on render
  console.log('[CategorizationControls Render] Received pending updates count:', Object.keys(pendingCategoryUpdates).length, 'Prop Object:', pendingCategoryUpdates);

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm h-full">
      <div className="flex items-start gap-4">
        {/* <button
          onClick={handleTrainSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed w-full text-left whitespace-nowrap"
          title="Train model using only the currently selected transactions."
        >
          Train Selected ({selectedTransactionsCount})
        </button> */}
        <button 
          onClick={handleTrainAllReviewed}
          disabled={operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed w-full text-left whitespace-nowrap"
          title="Train model using all your transactions that have a category assigned (fetched from Lunch Money)."
        >
          Train All Reviewed
        </button>
        <button
          onClick={handleCategorizeSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed w-full text-left whitespace-nowrap"
          title="Suggest categories for the currently selected transactions based on trained model."
        >
          Categorize Selected ({selectedTransactionsCount})
        </button>

      </div>
      <div className="text-sm text-gray-600 grow mt-1">
        Use reviewed transactions to Train your model. Categorise transactions that need review.
      </div>

      {hasPendingUpdates && (
        <div className="flex items-center gap-3 border-t border-gray-200 pt-3 mt-3 flex-wrap">
          <span className="text-sm font-medium text-secondary-dark whitespace-nowrap">
            {Object.keys(pendingCategoryUpdates).length} predictions ready
          </span>
          <button
            onClick={applyAllPredictedCategories}
            disabled={applyingAll || operationInProgress}
            className="px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {applyingAll ? 'Applying...' : 'Apply All'}
          </button>
          <button
            onClick={handleCancelCategorization}
            disabled={applyingAll || operationInProgress}
            className="px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});

CategorizationControls.displayName = 'CategorizationControls';

export default CategorizationControls; 