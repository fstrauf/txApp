'use client';

import React from 'react';
import { SpreadsheetLinker } from '../SpreadsheetLinker';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';
import { 
  DocumentPlusIcon, 
  LinkIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ManageDataTabProps {
  spreadsheetLinked: boolean;
  spreadsheetUrl: string | null;
  onSpreadsheetLinked: (data: { spreadsheetId: string; spreadsheetUrl: string }) => void;
  onRefreshData: () => void;
  isLoading: boolean;
  onSwitchToUpload: () => void;
  onCreateNewWithData: () => void;
  error?: string | null;
  onClearError?: () => void;
}

const ManageDataTab: React.FC<ManageDataTabProps> = ({
  spreadsheetLinked,
  spreadsheetUrl,
  onSpreadsheetLinked,
  onRefreshData,
  isLoading,
  onSwitchToUpload,
  onCreateNewWithData,
  error,
  onClearError
}) => {
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  // Check if error is about expired Google Sheets access
  const isExpiredAccessError = Boolean(error && (
    error.includes('access expired') || 
    (error.includes('expired') && error.includes('Google Sheets')) ||
    error.includes('401') ||
    error.includes('Please use "Link Sheet" to reconnect')
  ));

  // Handle re-linking expired spreadsheet
  const handleRelinkSpreadsheet = async () => {
    if (!spreadsheetUrl) {
      console.error('No spreadsheet URL available for re-linking');
      return;
    }

    try {
      // Request new Google Sheets access
      const accessToken = await requestSpreadsheetAccess();
      console.log('✅ Re-authentication successful, access token obtained');

      // Re-link using the existing spreadsheet URL
      const response = await fetch('/api/dashboard/link-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Spreadsheet re-linked successfully');
        
        // Clear any existing errors
        if (onClearError) {
          onClearError();
        }
        
        // Update the linked spreadsheet info
        onSpreadsheetLinked(data);
        
        // Refresh data to verify connection
        await onRefreshData();
      } else {
        throw new Error(data.error || 'Failed to re-link spreadsheet');
      }
    } catch (error: any) {
      console.error('❌ Error re-linking spreadsheet:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Data Management Hub</p>
            <p>Link a Google Spreadsheet, refresh your data, or manage your existing data source. All your data operations are centralized here.</p>
          </div>
        </div>
      </div>

      {/* Error Display with Re-link Option */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800 mb-1">Connection Error</p>
              <p className="text-sm text-red-700">{error}</p>
              {isExpiredAccessError && spreadsheetUrl && (
                <div className="mt-3">
                  <button
                    onClick={handleRelinkSpreadsheet}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Re-link Spreadsheet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Spreadsheet Status or Link New */}
      {spreadsheetLinked && spreadsheetUrl ? (
        <div className={`border rounded-lg p-4 ${isExpiredAccessError ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start">
            {isExpiredAccessError ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className={`text-sm flex-1 ${isExpiredAccessError ? 'text-amber-800' : 'text-green-800'}`}>
              <p className="font-medium mb-1">
                {isExpiredAccessError ? 'Google Spreadsheet - Access Expired' : 'Google Spreadsheet Connected'}
              </p>
              <p className={`text-xs mt-1 break-all ${isExpiredAccessError ? 'text-amber-600' : 'text-green-600'}`}>
                {spreadsheetUrl}
              </p>
              {isExpiredAccessError && (
                <p className="text-xs text-amber-600 mt-1">Please re-authenticate to restore connection.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">No Spreadsheet Connected</p>
              <p>Link a Google Spreadsheet to enable automatic data sync and dashboard updates.</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Link/Change Spreadsheet */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <LinkIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">
                {spreadsheetLinked ? 'Change Spreadsheet' : 'Link Google Sheet'}
              </h4>
              <p className="text-sm text-gray-600">
                {spreadsheetLinked ? 'Connect a different sheet' : 'Connect your first sheet'}
              </p>
            </div>
          </div>
          <SpreadsheetLinker 
            onSuccess={onSpreadsheetLinked} 
            onCreateNewWithData={onCreateNewWithData}
          />
        </div>

        {/* Refresh Data */}
        {spreadsheetLinked && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Refresh Data</h4>
                <p className="text-sm text-gray-600">Get latest transactions from your sheet</p>
              </div>
            </div>
            <button
              onClick={onRefreshData}
              disabled={isLoading || isExpiredAccessError}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            {isExpiredAccessError && (
              <p className="text-xs text-amber-600 text-center">Re-link spreadsheet to enable refresh</p>
            )}
          </div>
        )}

        {/* Open Spreadsheet */}
        {spreadsheetLinked && spreadsheetUrl && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <EyeIcon className="h-6 w-6 text-gray-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Open Sheet</h4>
                <p className="text-sm text-gray-600">View your spreadsheet in Google Sheets</p>
              </div>
            </div>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              Open in New Tab
            </a>
          </div>
        )}
      </div>

      {/* Quick Access to Upload */}
      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
        <DocumentPlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <h4 className="font-medium text-gray-900 mb-1">Need to add more data?</h4>
        <p className="text-sm text-gray-600 mb-4">Upload CSV files to import additional transactions</p>
        <button
          onClick={onSwitchToUpload}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <DocumentPlusIcon className="h-4 w-4" />
          Go to Upload CSV
        </button>
      </div>
    </div>
  );
};

export default ManageDataTab; 