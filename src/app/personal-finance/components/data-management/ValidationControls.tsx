'use client';

import React from 'react';
import Select from '@/components/ui/Select';
import type { ValidationTransaction } from './ValidateTransactionsTab';

interface ValidationControlsProps {
  filteredTransactions: ValidationTransaction[];
  validatedCount: number;
  createNewSpreadsheetMode: boolean;
  showCurrencySelection: boolean;
  newSpreadsheetCurrency: string;
  isProcessing: boolean;
  isValidatingAllRemaining: boolean;
  onValidateAllRemaining: () => void;
  onCompleteValidation: () => void;
  onCurrencySelection: (selectedCurrency: string) => void;
}

const ValidationControls: React.FC<ValidationControlsProps> = ({
  filteredTransactions,
  validatedCount,
  createNewSpreadsheetMode,
  showCurrencySelection,
  newSpreadsheetCurrency,
  isProcessing,
  isValidatingAllRemaining,
  onValidateAllRemaining,
  onCompleteValidation,
  onCurrencySelection
}) => {
  const unvalidatedCount = filteredTransactions.filter(t => !t.isValidated).length;
  const allValidated = unvalidatedCount === 0;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-500">Step 1:</span>
          <button
            onClick={onValidateAllRemaining}
            disabled={isValidatingAllRemaining || allValidated}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              allValidated 
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : isValidatingAllRemaining
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {allValidated 
              ? '✔ All Validated' 
              : isValidatingAllRemaining 
                ? 'Validating...' 
                : `Complete Validation (${unvalidatedCount})`}
          </button>

          <span className="text-xs font-semibold text-gray-500 ml-6">Step 2:</span>
          <button
            onClick={onCompleteValidation}
            disabled={isProcessing || !allValidated || (showCurrencySelection && createNewSpreadsheetMode && !newSpreadsheetCurrency)}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? 'Writing to Sheet...'
              : `Write to Sheet (${validatedCount})`
            }
          </button>
        </div>
      </div>
      
      {allValidated && showCurrencySelection && createNewSpreadsheetMode && (
         <div className="border-t pt-4">
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                options={[
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                    { value: 'GBP', label: 'GBP - British Pound' },
                    { value: 'JPY', label: 'JPY - Japanese Yen' },
                    { value: 'CHF', label: 'CHF - Swiss Franc' },
                    { value: 'CAD', label: 'CAD - Canadian Dollar' },
                    { value: 'AUD', label: 'AUD - Australian Dollar' },
                    { value: 'NZD', label: 'NZD - New Zealand Dollar' }
                ]}
              />
            </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default ValidationControls; 