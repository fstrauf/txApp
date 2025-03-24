import React from 'react';
import { DateRange } from '../types';

type TransactionFiltersProps = {
  pendingDateRange: DateRange;
  handleDateRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyDateFilter: () => void;
  operationInProgress: boolean;
  showOnlyUncategorized: boolean;
  setShowOnlyUncategorized: (value: boolean) => void;
  showOnlyCategorized: boolean;
  setShowOnlyCategorized: (value: boolean) => void;
  pendingCategoryUpdates: Record<string, {categoryId: string, score: number}>;
};

export default function TransactionFilters({
  pendingDateRange,
  handleDateRangeChange,
  applyDateFilter,
  operationInProgress,
  showOnlyUncategorized,
  setShowOnlyUncategorized,
  showOnlyCategorized,
  setShowOnlyCategorized,
  pendingCategoryUpdates
}: TransactionFiltersProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={pendingDateRange.startDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 rounded text-sm"
            disabled={operationInProgress}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={pendingDateRange.endDate}
            onChange={handleDateRangeChange}
            className="p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 rounded text-sm"
            disabled={operationInProgress}
          />
        </div>
        <button
          onClick={applyDateFilter}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 md:mt-5"
          disabled={operationInProgress}
        >
          Apply Date Filter
        </button>
      </div>

      {/* Filter Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="text-sm font-medium">Filters:</div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-blue-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
            checked={showOnlyUncategorized}
            onChange={() => {
              setShowOnlyUncategorized(!showOnlyUncategorized);
              if (!showOnlyUncategorized) {
                setShowOnlyCategorized(false);
              }
            }}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show only uncategorized transactions</span>
        </label>

        {Object.keys(pendingCategoryUpdates).length > 0 && (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
              checked={showOnlyCategorized}
              onChange={() => {
                setShowOnlyCategorized(!showOnlyCategorized);
                if (!showOnlyCategorized) {
                  setShowOnlyUncategorized(false);
                }
              }}
            />
            <span className="ml-2 text-amber-800 dark:text-amber-300">Show only categorized predictions</span>
          </label>
        )}
      </div>
    </div>
  );
} 