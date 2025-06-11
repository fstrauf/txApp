'use client';

import React, { useState } from 'react';
import { 
  LinkIcon, 
  DocumentPlusIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

interface SpreadsheetLinkerProps {
  onSuccess: (data: { spreadsheetId: string; spreadsheetUrl: string }) => void;
  onCancel?: () => void;
  onCreateNewWithData?: () => void; // New prop for redirecting to CSV upload
}

export const SpreadsheetLinker: React.FC<SpreadsheetLinkerProps> = ({ 
  onSuccess, 
  onCancel,
  onCreateNewWithData
}) => {
  const { requestSpreadsheetAccess, hasSpreadsheetAccess } = useIncrementalAuth();
  const [linkingOption, setLinkingOption] = useState<'existing' | 'new' | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLinkExisting = async () => {
    if (!spreadsheetUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔗 Linking spreadsheet - checking OAuth permissions...');
      
      // First, ensure we have Google Sheets access
      let accessToken;
      try {
        accessToken = await requestSpreadsheetAccess();
        console.log('✅ OAuth permission granted');
      } catch (oauthError) {
        console.error('❌ OAuth permission failed:', oauthError);
        setError('Please grant access to Google Sheets to continue');
        setIsLoading(false);
        return;
      }

      console.log('📊 Linking spreadsheet to database...');
      const response = await fetch('/api/dashboard/link-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl: spreadsheetUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Spreadsheet linked successfully');
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data);
        }, 1500);
      } else {
        setError(data.error || 'Failed to link spreadsheet');
      }
    } catch (error) {
      console.error('❌ Error linking spreadsheet:', error);
      setError('Failed to link spreadsheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Instead of creating an empty spreadsheet, guide user to upload data first
    if (onCreateNewWithData) {
      onCreateNewWithData();
    } else {
      setError('Create new spreadsheet with data flow not available');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Spreadsheet Linked Successfully!
        </h3>
        <p className="text-gray-500">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  if (!linkingOption) {
    return (
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Connect Your Spreadsheet
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setLinkingOption('existing')}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-200"
          >
            <LinkIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-medium text-blue-800">Link Existing Spreadsheet</h4>
              <p className="text-sm text-blue-600 mt-1">
                Connect the Expense Sorted sheet you already have
              </p>              
            </div>
          </button>

          <button
            onClick={() => setLinkingOption('new')}
            className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors duration-200"
          >
            <DocumentPlusIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-medium text-green-800">Create New Spreadsheet</h4>
              <p className="text-sm text-green-600 mt-1">
                Upload your data and we'll create a personalized spreadsheet
              </p>
            </div>
          </button>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  if (linkingOption === 'existing') {
    return (
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Link Existing Spreadsheet
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheets URL
            </label>
            <input
              type="text"
              value={spreadsheetUrl}
              onChange={(e) => {
                setSpreadsheetUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Copy the URL from your Google Sheet's address bar
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What we'll do:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Connect to your existing Google Sheet</li>
              <li>• Read your transaction data for analysis</li>
              <li>• Append new categorized transactions</li>
              <li>• Keep all your existing data intact</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setLinkingOption(null)}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              onClick={handleLinkExisting}
              disabled={isLoading || !spreadsheetUrl.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Linking...' : 'Link Spreadsheet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (linkingOption === 'new') {
    return (
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Create New Spreadsheet
        </h3>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">What we'll create:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• New Google Sheet in your Drive</li>
              <li>• Pre-formatted with proper columns</li>
              <li>• Sample data to get you started</li>
              <li>• Ready for transaction imports</li>
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setLinkingOption(null)}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              onClick={handleCreateNew}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Spreadsheet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 