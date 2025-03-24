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
  importMessage
}: CategorizationControlsProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleImportTransactions}
          disabled={loading || selectedTransactionsCount === 0 || importStatus === 'importing' || operationInProgress}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          {importStatus === 'importing' ? 'Importing...' : 'Import All to Database'}
        </button>
        <button
          onClick={handleTrainSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          Train with Selected ({selectedTransactionsCount})
        </button>
        <button
          onClick={handleCategorizeSelected}
          disabled={selectedTransactionsCount === 0 || operationInProgress}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          Categorize Selected ({selectedTransactionsCount})
        </button>
      </div>

      {importStatus !== 'idle' && (
        <div className={`mt-4 p-4 rounded ${
          importStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-100' : 
          importStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100' : 
          'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
        }`}>
          {importMessage}
        </div>
      )}

      {/* Categorization Results Banner */}
      {Object.keys(pendingCategoryUpdates).length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <span className="font-medium text-amber-800 dark:text-amber-300">Categorization Results:</span>
              <span className="ml-2 text-amber-800 dark:text-amber-300">{Object.keys(pendingCategoryUpdates).length} transactions categorized</span>
            </div>
            
            <button
              onClick={applyAllPredictedCategories}
              disabled={applyingAll || Object.keys(pendingCategoryUpdates).length === 0}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
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
                `Apply All Categories (${Object.keys(pendingCategoryUpdates).length})`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 