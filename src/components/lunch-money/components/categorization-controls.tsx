import React from 'react';
import { ImportStatus } from '../types';

type CategorizationControlsProps = {
  pendingCategoryUpdates: Record<string, {categoryId: string, score: number}>;
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
};

export default function CategorizationControls({
  pendingCategoryUpdates,
  applyingAll,
  applyAllPredictedCategories,
  handleImportTransactions,
  handleTrainSelected,
  handleCategorizeSelected,
  selectedTransactionsCount,
  loading,
  operationInProgress,
  importStatus,
  importMessage,
  handleCancelCategorization
}: CategorizationControlsProps) {
  const hasPendingUpdates = Object.keys(pendingCategoryUpdates).length > 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleTrainSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          Train Selected ({selectedTransactionsCount})
        </button>
        <button
          onClick={handleCategorizeSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 bg-secondary text-white font-medium rounded-lg shadow-sm hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          Categorize Selected ({selectedTransactionsCount})
        </button>
      </div>

      {importStatus !== 'idle' && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${
          importStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 
          importStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {importMessage}
        </div>
      )}

      {/* Categorization Results Banner */}
      {hasPendingUpdates && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/5 border border-secondary/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex-grow">
              <span className="font-medium text-secondary-dark">Predictions Ready:</span>
              <span className="ml-2 text-secondary-dark">{Object.keys(pendingCategoryUpdates).length} transactions categorized</span>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleCancelCategorization}
                disabled={applyingAll}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Cancel
              </button>
              <button
                onClick={applyAllPredictedCategories}
                disabled={applyingAll}
                className="px-6 py-2 bg-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {applyingAll ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  `Apply All (${Object.keys(pendingCategoryUpdates).length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 