import React from 'react';
import { ImportStatus, OperationType } from './types';
import HelpTooltip from '@/components/shared/HelpTooltip';

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
  handleCancelCategorization,
  lastTrainedTimestamp
}: CategorizationControlsProps) => {
  const hasPendingUpdates = Object.keys(pendingCategoryUpdates).length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleTrainSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Train Selected ({selectedTransactionsCount})
        </button>
        <HelpTooltip content="Train your custom model with all you transactions and correct categorisation. We recommend using as many transaction as possible here. A label will appear next to transactions that are included in the training set." />
        <button
          onClick={handleCategorizeSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Categorize Selected ({selectedTransactionsCount})
        </button>
        <HelpTooltip content="Automatically categorise transactions based on the training set. This will generate suggestions, that you can choose to apply." />
      </div>

      {hasPendingUpdates && (
        <div className="flex items-center gap-3 border-l border-gray-300 pl-3 ml-3 mt-3 sm:mt-0 flex-wrap">
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