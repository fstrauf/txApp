import React from 'react';
import { ArrowPathIcon, DocumentPlusIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface NoDataStateProps {
  spreadsheetLinked: boolean;
  isRefreshing: boolean;
  onRefreshClick: () => void;
  onConnectGoogleSheetsClick: () => void;
  onUploadBankDataClick: () => void;
}

export const NoDataState: React.FC<NoDataStateProps> = ({
  spreadsheetLinked,
  isRefreshing,
  onRefreshClick,
  onConnectGoogleSheetsClick,
  onUploadBankDataClick,
}) => {
  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Discover Your Financial Freedom?</h3>
      <p className="text-lg text-gray-700 mb-8">
        {spreadsheetLinked 
          ? "Your spreadsheet is connected! Refresh to unlock your personal runway calculation and see exactly how much time your money can buy."
          : "Upload your bank statements or connect your Google Sheets to discover how many months of freedom you already have saved up."
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
        {spreadsheetLinked ? (
          <button
            onClick={onRefreshClick}
            disabled={isRefreshing}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary-dark hover:to-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ArrowPathIcon className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Calculating Your Freedom...' : 'Calculate My Runway'}
          </button>
        ) : (
          <>
            <button
              onClick={onConnectGoogleSheetsClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <DocumentPlusIcon className="h-6 w-6" />
              Connect Google Sheets
            </button>
            <button
              onClick={onUploadBankDataClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusCircleIcon className="h-6 w-6" />
              Upload Bank Data
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>2 minutes</strong> to setup</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Instant</strong> runway calculation</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Your data</strong> stays yours</span>
        </div>
      </div>
    </div>
  );
}; 