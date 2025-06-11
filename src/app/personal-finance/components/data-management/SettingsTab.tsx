'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';
import { 
  InformationCircleIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SettingsTabProps {
  baseCurrency: string;
  onBaseCurrencyChange: (currency: string) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  baseCurrency,
  onBaseCurrencyChange
}) => {
  const { userData } = usePersonalFinanceStore();
  const { getValidAccessToken } = useIncrementalAuth();
  const [isLoadingFromSpreadsheet, setIsLoadingFromSpreadsheet] = useState(false);
  const [spreadsheetBaseCurrency, setSpreadsheetBaseCurrency] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load base currency from spreadsheet Config tab on component mount
  useEffect(() => {
    if (userData.spreadsheetId) {
      loadBaseCurrencyFromSpreadsheet();
    }
  }, [userData.spreadsheetId]);

  const loadBaseCurrencyFromSpreadsheet = async () => {
    if (!userData.spreadsheetId) {
      setLoadError('No spreadsheet linked');
      return;
    }

    setIsLoadingFromSpreadsheet(true);
    setLoadError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get valid Google access token');
      }

      const response = await fetch('/api/sheets/read-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          spreadsheetId: userData.spreadsheetId,
          range: 'Config!B2' // Read base currency from Config tab, cell B2
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to read config: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if we got a valid currency value
      if (result.values && result.values.length > 0 && result.values[0].length > 0) {
        const currencyFromSheet = String(result.values[0][0]).toUpperCase().trim();
        if (currencyFromSheet && currencyFromSheet.length === 3) {
          setSpreadsheetBaseCurrency(currencyFromSheet);
          // Auto-update the current base currency if it's different
          if (currencyFromSheet !== baseCurrency) {
            onBaseCurrencyChange(currencyFromSheet);
          }
        } else {
          setLoadError('Invalid currency format in spreadsheet (expected 3-letter code)');
        }
      } else {
        setLoadError('No base currency found in Config tab cell B2');
      }
    } catch (error: any) {
      console.error('Error loading base currency from spreadsheet:', error);
      setLoadError(error.message || 'Failed to load base currency from spreadsheet');
    } finally {
      setIsLoadingFromSpreadsheet(false);
    }
  };

  const handleBaseCurrencyChange = (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    onBaseCurrencyChange(upperCurrency);
    
    // Update spreadsheet if different from what's stored there
    if (spreadsheetBaseCurrency && upperCurrency !== spreadsheetBaseCurrency) {
      updateBaseCurrencyInSpreadsheet(upperCurrency);
    }
  };

  const updateBaseCurrencyInSpreadsheet = async (currency: string) => {
    if (!userData.spreadsheetId) return;

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Unable to get valid Google access token');
      }

      const response = await fetch('/api/sheets/update-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          spreadsheetId: userData.spreadsheetId,
          range: 'Config!B2',
          values: [[currency]]
        })
      });

      if (response.ok) {
        setSpreadsheetBaseCurrency(currency);
        setLoadError(null);
      } else {
        console.warn('Failed to update base currency in spreadsheet');
      }
    } catch (error) {
      console.error('Error updating base currency in spreadsheet:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Info Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-gray-800">
            <p className="font-medium mb-1">Currency Settings</p>
            <p>Configure your base currency for multi-currency transaction handling. All transactions will be converted to your base currency when imported.</p>
          </div>
        </div>
      </div>

      {/* Spreadsheet Base Currency Status */}
      {userData.spreadsheetId && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-800">Spreadsheet Configuration</h4>
            <button
              onClick={loadBaseCurrencyFromSpreadsheet}
              disabled={isLoadingFromSpreadsheet}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3 w-3 ${isLoadingFromSpreadsheet ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>
          
          {isLoadingFromSpreadsheet ? (
            <div className="text-sm text-gray-600">Loading base currency from Config tab...</div>
          ) : loadError ? (
            <div className="text-sm text-red-600">
              <p className="font-medium">Error:</p>
              <p>{loadError}</p>
              <p className="mt-1 text-xs">Make sure your spreadsheet has a "Config" tab with the base currency in cell B2</p>
            </div>
          ) : spreadsheetBaseCurrency ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  Base currency from spreadsheet: <strong>{spreadsheetBaseCurrency}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No base currency configured in spreadsheet</div>
          )}
        </div>
      )}

      {/* Base Currency Setting */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Base Currency</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="baseCurrency" className="block text-sm font-medium text-gray-700 mb-2">
              Select your primary currency
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                id="baseCurrency"
                value={baseCurrency}
                onChange={(e) => handleBaseCurrencyChange(e.target.value)}
                placeholder="e.g., USD, EUR, GBP, AUD"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                maxLength={3}
              />
              <span className="text-sm text-gray-500">3-letter currency code</span>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Uses <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Frankfurter API</a> for free currency conversion
            </p>
          </div>

          {/* Current setting display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Base currency set to <strong>{baseCurrency}</strong>
                {spreadsheetBaseCurrency && baseCurrency !== spreadsheetBaseCurrency && (
                  <span className="text-amber-700 ml-2">
                    (differs from spreadsheet: {spreadsheetBaseCurrency})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Feature preview */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Multi-Currency Features</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Automatic currency detection from CSV files</li>
              <li>• Real-time conversion to your base currency</li>
              <li>• Historical exchange rates for accurate conversion</li>
              <li>• Both original and converted amounts stored in spreadsheet</li>
              <li>• Base currency synced with spreadsheet Config tab</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab; 