import React from 'react';
import { ImportStatus } from './types';
// import HelpTooltip from '@/components/shared/HelpTooltip'; // No longer needed

type CategorizationControlsProps = {
  pendingCategoryUpdates: Record<string, {categoryId: string | null, score: number}>;
  applyingAll: boolean;
  applyAllPredictedCategories: () => void;
  handleImportTransactions: () => void;
  handleTrainSelected: () => void;
  handleCategorizeSelected: () => void;
  selectedTransactionsCount: number;
  loading: boolean;
  operationInProgress: boolean;
  importStatus: ImportStatus;
  importMessage: string;
  handleCancelCategorization: () => void;
  lastTrainedTimestamp?: string | null;
};

const CategorizationControls = React.memo(({
  pendingCategoryUpdates,
  applyingAll,
  applyAllPredictedCategories,
  handleTrainSelected,
  handleCategorizeSelected,
  selectedTransactionsCount,
  operationInProgress,
  importStatus,
  importMessage,
  handleCancelCategorization
}: CategorizationControlsProps) => {
  const hasPendingUpdates = Object.keys(pendingCategoryUpdates).length > 0;

  return (
    <div className="flex flex-row items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm flex-wrap">
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleTrainSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed w-full text-left"
        >
          Train Selected ({selectedTransactionsCount})
        </button>
        <button
          onClick={handleCategorizeSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed w-full text-left"
        >
          Categorize Selected ({selectedTransactionsCount})
        </button>
      </div>

      <div className="text-sm text-gray-600 max-w-xs">
        Use reviewed transactions to Train your model. Categorise transactions that need review.
      </div>

      {hasPendingUpdates && (
        <div className="flex items-center gap-3 border-l border-gray-300 pl-4 ml-4 mt-3 sm:mt-0 flex-wrap">
          <span className="text-sm font-medium text-secondary-dark">
            {Object.keys(pendingCategoryUpdates).length} predictions ready
          </span>
          <button
            onClick={applyAllPredictedCategories}
            disabled={applyingAll || operationInProgress}
            className="px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-secondary text-white hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {applyingAll ? 'Applying...' : 'Apply All'}
          </button>
          <button
            onClick={handleCancelCategorization}
            disabled={applyingAll || operationInProgress}
            className="px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      )}

      {importStatus !== 'idle' && (
        <span className={`text-sm ml-4 ${importStatus === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {importMessage}
        </span>
      )}
    </div>
  );
});

CategorizationControls.displayName = 'CategorizationControls';

export default CategorizationControls; 