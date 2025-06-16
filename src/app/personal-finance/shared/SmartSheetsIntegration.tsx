'use client';

import React, { useState } from 'react';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { PrimaryButton } from './PrimaryButton';

import { 
  TableCellsIcon, 
  PlusIcon, 
  DocumentDuplicateIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

interface SmartSheetsIntegrationProps {
  transactions: Transaction[];
  onSuccess?: () => void;
  onSkip?: () => void;
}

type IntegrationStep = 'offer' | 'auth' | 'choice' | 'existing' | 'new' | 'success';

export const SmartSheetsIntegration: React.FC<SmartSheetsIntegrationProps> = ({ 
  transactions, 
  onSuccess,
  onSkip 
}) => {
  const { 
    requestSpreadsheetAccess, 
    isRequestingPermission, 
    hasSpreadsheetAccess, 
    isSignedIn,
    isGoogleLoaded
  } = useIncrementalAuth();
  
  const [currentStep, setCurrentStep] = useState<IntegrationStep>('offer');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGetStarted = async () => {
    if (!isSignedIn) {
      setError('Please sign in first to save to Google Sheets.');
      return;
    }

    setError(null);
    
    try {
      // Use centralized token handling that automatically handles expired/missing tokens
      console.log('Requesting Google Sheets permissions...');
      
      if (!isGoogleLoaded) {
        setError('Google services are still loading. Please try again in a moment.');
        return;
      }

      // Check if Google Client ID is configured
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        setError('Google OAuth is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
        return;
      }

      setCurrentStep('auth');
      
      const token = await requestSpreadsheetAccess();
      if (!token) {
        throw new Error('Unable to get valid Google access token. Please grant access to Google Sheets and try again.');
      }
      
      setAuthToken(token);
      setCurrentStep('choice');
      
    } catch (err: any) {
      console.error('Google Sheets permission error:', err);
      
      // Provide more specific error messages
      if (err.message.includes('popup_closed_by_user')) {
        setError('Permission popup was closed. Please try again and allow access to Google Sheets.');
      } else if (err.message.includes('access_denied')) {
        setError('Permission denied. Please allow access to Google Sheets to continue.');
      } else if (err.message.includes('Google Identity Services not loaded')) {
        setError('Google services failed to load. Please check your internet connection and try again.');
      } else if (err.message.includes('access token') || err.message.includes('grant access')) {
        setError('Google Sheets access required. Please grant permissions and try again.');
      } else {
        setError(`Permission error: ${err.message}. Please try again or check your Google account permissions.`);
      }
      setCurrentStep('offer');
    }
  };

  const handleCreateNew = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sheets/create-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          transactions,
          title: `Personal Finance Tracker - ${new Date().toLocaleDateString()}`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create spreadsheet');
      }

      setSuccessMessage(`Successfully created Google Sheet with ${transactions.length} transactions!`);
      setCurrentStep('success');
      
      // Open the new sheet in a new tab
      window.open(result.spreadsheetUrl, '_blank');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sheets/create-from-template-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          transactions,
          title: `ExpenseSorted Finance Tracker - ${new Date().toLocaleDateString()}`,
          baseCurrency: 'USD' // Default fallback, ideally this should come from props
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create from template');
      }

      setSuccessMessage(`Successfully created ExpenseSorted template with ${transactions.length} transactions in the new_transactions sheet!`);
      setCurrentStep('success');
      
      // Open the new sheet in a new tab
      window.open(result.spreadsheetUrl, '_blank');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      if (err.message.includes('Template not accessible')) {
        setError('Template temporarily unavailable. Please use "Simple New Sheet" or "Add to Existing" for now.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAppendToExisting = async () => {
    if (!spreadsheetUrl.trim()) {
      setError('Please enter a spreadsheet URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sheets/append-to-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          spreadsheetUrl,
          transactions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to append transactions');
      }

      setSuccessMessage(`Successfully added ${transactions.length} transactions to your existing sheet!`);
      setCurrentStep('success');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentStep === 'offer') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start">
          <TableCellsIcon className="h-8 w-8 text-green-600 mr-4 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Save to Google Sheets
            </h3>
            <p className="text-gray-600 mb-4">
              Keep your {transactions.length} categorized transactions organized in a Google Sheet. 
              Perfect for ongoing budget tracking, sharing with financial advisors, or building custom reports.
              {hasSpreadsheetAccess && (
                <span className="block mt-2 text-green-600 text-sm font-medium">
                  ✓ Google Sheets access already authorized
                </span>
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryButton
                onClick={handleGetStarted}
                disabled={isRequestingPermission || !isGoogleLoaded}
                className="flex items-center"
              >
                {isRequestingPermission ? (
                  'Requesting permission...'
                ) : !isGoogleLoaded ? (
                  'Loading Google services...'
                ) : (
                  <>
                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                    Yes, save to Google Sheets
                  </>
                )}
              </PrimaryButton>
              
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Skip for now
              </button>
            </div>

                         {error && (
               <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                 <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                 <p className="text-red-700 text-sm">{error}</p>
               </div>
             )}
             
     
           </div>
         </div>
       </div>
     );
  }

  if (currentStep === 'auth') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Requesting Google Sheets Permission
        </h3>
        <p className="text-gray-600">
          Please allow access to Google Sheets in the popup window...
        </p>
      </div>
    );
  }

  if (currentStep === 'choice') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          How would you like to save your transactions?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleCreateFromTemplate}
            className="p-6 border-2 border-green-300 bg-green-50 rounded-xl hover:border-green-400 hover:bg-green-100 transition-all text-left group"
            disabled={isProcessing}
          >
            <div className="flex items-center mb-3">
              <PlusIcon className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-800">ExpenseSorted Template</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Copy our full ExpenseSorted template with charts, analysis, and your transactions in new_transactions sheet
            </p>
            <div className="text-xs text-green-600 font-medium">
              ✓ Recommended - Complete solution
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Creates copy of: <a href="https://docs.google.com/spreadsheets/d/1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">Template link</a>
            </div>
            {isProcessing && (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                Creating your ExpenseSorted template...
              </div>
            )}
          </button>

          <button
            onClick={() => setCurrentStep('new')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-center mb-3">
              <PlusIcon className="h-6 w-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-800">Simple New Sheet</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Create a basic Google Sheet with just your transactions
            </p>
            <div className="text-xs text-blue-600 font-medium">
              ✓ Minimal approach
            </div>
          </button>

          <button
            onClick={() => setCurrentStep('existing')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="flex items-center mb-3">
              <DocumentDuplicateIcon className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-800">Add to Existing</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Add these transactions to a Google Sheet you already have
            </p>
            <div className="text-xs text-purple-600 font-medium">
              ✓ For existing trackers
            </div>
          </button>
        </div>

        <button
          onClick={() => setCurrentStep('offer')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to offer
        </button>
      </div>
    );
  }

  if (currentStep === 'new') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Create New Google Sheet
        </h3>
        
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">What we'll create for you:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• A new Google Sheet with {transactions.length} categorized transactions</li>
              <li>• Clean, organized format with Date, Description, Amount, Category columns</li>
              <li>• Ready for further analysis, sharing, or import into other tools</li>
              <li>• Automatically opens in a new tab when created</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <PrimaryButton
            onClick={handleCreateNew}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Creating sheet...' : 'Create My Finance Sheet'}
          </PrimaryButton>
          
          <button
            onClick={() => setCurrentStep('choice')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'existing') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Add to Existing Google Sheet
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheet URL
            </label>
            <input
              type="text"
              value={spreadsheetUrl}
              onChange={(e) => {
                setSpreadsheetUrl(e.target.value);
                setError(null); // Clear error when user types
              }}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Copy the URL from your Google Sheet's address bar
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What we'll do:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Add {transactions.length} new transactions to your existing sheet</li>
              <li>• Append to the end of your current data</li>
              <li>• Preserve all your existing data and formatting</li>
              <li>• Use standard column headers: Date, Description, Amount, Category, Type, Account</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <PrimaryButton
              onClick={handleAppendToExisting}
              disabled={isProcessing || !spreadsheetUrl.trim()}
              className="flex-1"
            >
              {isProcessing ? 'Adding transactions...' : 'Add Transactions'}
            </PrimaryButton>
            
            <button
              onClick={() => setCurrentStep('choice')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Success!
        </h3>
        <p className="text-gray-600 mb-4">
          {successMessage}
        </p>
        <p className="text-sm text-gray-500">
          Continuing to your spending analysis...
        </p>
      </div>
    );
  }

  return null;
}; 