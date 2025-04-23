import React from 'react';
import { DateRange } from '../types';

type TransactionFiltersProps = {
  pendingDateRange: DateRange;
  handleDateRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyDateFilter: () => void;
  operationInProgress: boolean;
  isApplying: boolean;
  showOnlyUncategorized: boolean;
  setShowOnlyUncategorized: (value: boolean) => void;
  showOnlyCategorized: boolean;
  setShowOnlyCategorized: (value: boolean) => void;
  pendingCategoryUpdates: Record<string, {categoryId: string, score: number}>;
  trainedCount: number;
  uncategorizedCount: number;
};

export default function TransactionFilters({
  pendingDateRange,
  handleDateRangeChange,
  applyDateFilter,
  operationInProgress,
  isApplying,
}: TransactionFiltersProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={pendingDateRange.startDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
            disabled={operationInProgress || isApplying}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={pendingDateRange.endDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
            disabled={operationInProgress || isApplying}
          />
        </div>
        <button
          onClick={applyDateFilter}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          disabled={operationInProgress || isApplying}
        >
          {isApplying ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying...
            </>
          ) : (
            'Apply Dates'
          )}
        </button>
      </div>
    </div>
  );
} 