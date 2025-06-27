import React from 'react';

interface LoadingStateProps {
  isRefreshing?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isRefreshing = false }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Loading Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Loading your financial data...</h3>
            <p className="text-sm sm:text-base text-blue-700">
              {isRefreshing ? 'Refreshing your latest transaction data from Google Sheets' : 'Fetching your transaction data and calculating statistics'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading Dashboard Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3 w-16"></div>
          <div className="space-y-3">
            <div>
              <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="border-t pt-3">
              <div className="h-6 bg-gray-300 rounded w-28 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3 w-20"></div>
          <div className="space-y-3">
            <div>
              <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="border-t pt-3">
              <div className="h-6 bg-gray-300 rounded w-28 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Secondary Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-3 bg-gray-200 rounded mb-2 w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Loading Charts Skeleton */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}; 