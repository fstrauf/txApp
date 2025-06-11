'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ValidationTransaction } from './ValidateTransactionsTab';

interface ValidationControlsProps {
  selectedTransactions: Set<string>;
  filteredTransactions: ValidationTransaction[];
  showOnlyUnvalidated: boolean;
  filterCategory: string;
  sortBy: 'date' | 'amount' | 'confidence';
  sortDirection: 'asc' | 'desc';
  categories: string[];
  validatedCount: number;
  createNewSpreadsheetMode: boolean;
  isProcessing: boolean;
  onSelectAll: () => void;
  onValidateSelected: () => void;
  onShowOnlyUnvalidatedChange: (show: boolean) => void;
  onFilterCategoryChange: (category: string) => void;
  onSortChange: (field: 'date' | 'amount' | 'confidence') => void;
  onSortDirectionToggle: () => void;
  onCompleteValidation: () => void;
}

const ValidationControls: React.FC<ValidationControlsProps> = ({
  selectedTransactions,
  filteredTransactions,
  showOnlyUnvalidated,
  filterCategory,
  sortBy,
  sortDirection,
  categories,
  validatedCount,
  createNewSpreadsheetMode,
  isProcessing,
  onSelectAll,
  onValidateSelected,
  onShowOnlyUnvalidatedChange,
  onFilterCategoryChange,
  onSortChange,
  onSortDirectionToggle,
  onCompleteValidation
}) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {selectedTransactions.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedTransactions.size > 0 && (
            <button
              onClick={onValidateSelected}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Validate Selected ({selectedTransactions.size})
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyUnvalidated}
            onChange={(e) => onShowOnlyUnvalidatedChange(e.target.checked)}
            className="rounded"
          />
          Show only unvalidated
        </label>

        <select
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="all">All categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="confidence">Confidence</option>
            <option value="amount">Amount</option>
            <option value="date">Date</option>
          </select>
          <button
            onClick={onSortDirectionToggle}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Complete Validation Button */}
      <div className="border-t pt-4 mt-4">
        {validatedCount === 0 ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 mb-2">Validate at least one transaction to continue</p>
            <button
              disabled={true}
              className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              Complete Validation (0 transactions)
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {createNewSpreadsheetMode 
                ? `Ready to create new spreadsheet with ${validatedCount} transaction${validatedCount !== 1 ? 's' : ''}`
                : `Ready to write ${validatedCount} transaction${validatedCount !== 1 ? 's' : ''} to your Google Sheet`
              }
            </p>
            <button
              onClick={onCompleteValidation}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {createNewSpreadsheetMode ? 'Creating New Spreadsheet...' : 'Writing to Google Sheet...'}
                </span>
              ) : (
                createNewSpreadsheetMode 
                  ? `🎉 Create New Spreadsheet (${validatedCount} transactions)`
                  : `✅ Complete Validation & Write to Sheet (${validatedCount} transactions)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationControls; 