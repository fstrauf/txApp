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

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Link Existing Spreadsheet */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">Link Existing Spreadsheet</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect the Expense Sorted sheet you already have
              </p>
              
              {/* Current spreadsheet status */}
              {spreadsheetLinked && spreadsheetUrl ? (
                <div className={`rounded-lg p-3 mb-4 ${isExpiredAccessError ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-2">
                    {isExpiredAccessError ? (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className={`text-xs ${isExpiredAccessError ? 'text-amber-800' : 'text-green-800'}`}>
                      <p className="font-medium">
                        {isExpiredAccessError ? 'Access Expired' : 'Connected'}
                      </p>
                      <p className={`break-all mt-1 ${isExpiredAccessError ? 'text-amber-600' : 'text-green-600'}`}>
                        {spreadsheetUrl}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">No spreadsheet connected</p>
                      <p className="text-amber-600 mt-1">Link a sheet to enable data sync</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <SpreadsheetLinker 
            onSuccess={onSpreadsheetLinked} 
            onCreateNewWithData={onCreateNewWithData}
          />
        </div>

        {/* Create New Spreadsheet */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <DocumentPlusIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">Create New Spreadsheet</h4>
              <p className="text-sm text-gray-600 mb-4">
                Upload your data and we'll create a personalized spreadsheet
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-xs text-blue-800">
                  <p className="font-medium">What you'll get:</p>
                  <ul className="text-blue-600 mt-1 space-y-1">
                    <li>• Automated expense categorization</li>
                    <li>• Monthly spending summaries</li>
                    <li>• Real-time dashboard sync</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Recommended Option - Upload CSV */}
            <div className="relative">
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
              <button
                onClick={onSwitchToUpload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                Upload CSV Data
              </button>
            </div>
            
            {/* Alternative Option - Create from Template */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-500 px-2">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              <button
                onClick={onCreateNewWithData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                Create from Template
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Start with an empty spreadsheet template
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Actions - Only show if spreadsheet is linked */}
      {spreadsheetLinked && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Refresh Data */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Refresh Data</h4>
                <p className="text-xs text-gray-600">Get latest transactions from your sheet</p>
              </div>
            </div>
            <button
              onClick={onRefreshData}
              disabled={isLoading || isExpiredAccessError}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            {isExpiredAccessError && (
              <p className="text-xs text-amber-600 text-center">Re-link spreadsheet to enable refresh</p>
            )}
          </div>

          {/* Open Spreadsheet */}
          {spreadsheetUrl && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <EyeIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Open Sheet</h4>
                  <p className="text-xs text-gray-600">View your spreadsheet in Google Sheets</p>
                </div>
              </div>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Open in New Tab
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageDataTab; 