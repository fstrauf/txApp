'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Select from '@/components/ui/Select';
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
  showCurrencySelection: boolean;
  newSpreadsheetCurrency: string;
  isProcessing: boolean;
  onSelectAll: () => void;
  onValidateSelected: () => void;
  onValidateAllRemaining: () => void;
  onShowOnlyUnvalidatedChange: (show: boolean) => void;
  onFilterCategoryChange: (category: string) => void;
  onSortChange: (field: 'date' | 'amount' | 'confidence') => void;
  onSortDirectionToggle: () => void;
  onCompleteValidation: () => void;
  onCurrencySelection: (selectedCurrency: string) => void;
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
  showCurrencySelection,
  newSpreadsheetCurrency,
  isProcessing,
  onSelectAll,
  onValidateSelected,
  onValidateAllRemaining,
  onShowOnlyUnvalidatedChange,
  onFilterCategoryChange,
  onSortChange,
  onSortDirectionToggle,
  onCompleteValidation,
  onCurrencySelection
}) => {
  // Calculate remaining unvalidated transactions
  const unvalidatedCount = filteredTransactions.filter(t => !t.isValidated).length;
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-4 mb-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onSelectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {selectedTransactions.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedTransactions.size > 0 && (
            <button
              onClick={onValidateSelected}
              className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              Validate Selected ({selectedTransactions.size})
            </button>
          )}
          {unvalidatedCount > 0 && (
            <button
              onClick={onValidateAllRemaining}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              Validate All Remaining ({unvalidatedCount})
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm flex-shrink-0">
          <input
            type="checkbox"
            checked={showOnlyUnvalidated}
            onChange={(e) => onShowOnlyUnvalidatedChange(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="whitespace-nowrap">Show only unvalidated</span>
        </label>

        <div className="flex-shrink-0">
          <Select
            value={filterCategory}
            onChange={onFilterCategoryChange}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            size="sm"
            className="min-w-[140px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
          <Select
            value={sortBy}
            onChange={(value) => onSortChange(value as 'date' | 'amount' | 'confidence')}
            options={[
              { value: 'confidence', label: 'Confidence' },
              { value: 'amount', label: 'Amount' },
              { value: 'date', label: 'Date' }
            ]}
            size="sm"
            className="min-w-[100px]"
          />
          <button
            onClick={onSortDirectionToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          >
            {sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Complete Validation Button */}
      <div className="border-t pt-4 mt-4">
        {/* Currency Selection for New Spreadsheets */}
        {showCurrencySelection && createNewSpreadsheetMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-3">Select Base Currency</h4>
            <p className="text-sm text-blue-700 mb-4">
              Choose your primary currency. All transactions will be converted to this currency in your new spreadsheet.
            </p>
            
            <div className="max-w-xs mx-auto mb-4">
              <Select
                value={newSpreadsheetCurrency}
                onChange={onCurrencySelection}
                placeholder="Select a currency..."
                label="Base Currency"
                variant="blue"
                optGroups={[
                  {
                    label: 'Major Currencies',
                    options: [
                      { value: 'USD', label: 'USD - US Dollar' },
                      { value: 'EUR', label: 'EUR - Euro' },
                      { value: 'GBP', label: 'GBP - British Pound' },
                      { value: 'JPY', label: 'JPY - Japanese Yen' },
                      { value: 'CHF', label: 'CHF - Swiss Franc' },
                      { value: 'CAD', label: 'CAD - Canadian Dollar' },
                      { value: 'AUD', label: 'AUD - Australian Dollar' },
                      { value: 'NZD', label: 'NZD - New Zealand Dollar' }
                    ]
                  },
                  {
                    label: 'European Currencies',
                    options: [
                      { value: 'SEK', label: 'SEK - Swedish Krona' },
                      { value: 'NOK', label: 'NOK - Norwegian Krone' },
                      { value: 'DKK', label: 'DKK - Danish Krone' },
                      { value: 'PLN', label: 'PLN - Polish Złoty' },
                      { value: 'CZK', label: 'CZK - Czech Koruna' },
                      { value: 'HUF', label: 'HUF - Hungarian Forint' },
                      { value: 'BGN', label: 'BGN - Bulgarian Lev' },
                      { value: 'RON', label: 'RON - Romanian Leu' }
                    ]
                  },
                  {
                    label: 'Other Currencies',
                    options: [
                      { value: 'CNY', label: 'CNY - Chinese Yuan' },
                      { value: 'INR', label: 'INR - Indian Rupee' },
                      { value: 'KRW', label: 'KRW - South Korean Won' },
                      { value: 'SGD', label: 'SGD - Singapore Dollar' },
                      { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
                      { value: 'MXN', label: 'MXN - Mexican Peso' },
                      { value: 'BRL', label: 'BRL - Brazilian Real' },
                      { value: 'ZAR', label: 'ZAR - South African Rand' }
                    ]
                  }
                ]}
              />
            </div>
            
            <div className="text-center">
              <p className="text-xs text-blue-600">
                More currencies available via <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="underline">Frankfurter API</a>
              </p>
            </div>
          </div>
        )}

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
        ) : showCurrencySelection && createNewSpreadsheetMode ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Please select your base currency to create a new spreadsheet with {validatedCount} transaction{validatedCount !== 1 ? 's' : ''}
            </p>
            <button
              disabled={true}
              className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              ⬆️ Select Currency Above
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
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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