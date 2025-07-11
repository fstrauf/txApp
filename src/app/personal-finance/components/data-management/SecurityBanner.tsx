import React from 'react';

const SecurityBanner = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 mb-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-blue-800">
          Your data stays secure in your Google Sheets
        </h3>
      </div>
    </div>
  </div>
);

export default SecurityBanner; 