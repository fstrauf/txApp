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
            disabled={operationInProgress}
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
            disabled={operationInProgress}
          />
        </div>
        <button
          onClick={applyDateFilter}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          disabled={operationInProgress}
        >
          Apply Dates
        </button>
      </div>

      {/* Filter Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="text-sm font-medium text-gray-600">Filters:</div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary border-gray-300 rounded text-primary focus:ring-primary"
            checked={showOnlyUncategorized}
            onChange={() => {
              setShowOnlyUncategorized(!showOnlyUncategorized);
              if (!showOnlyUncategorized) {
                setShowOnlyCategorized(false);
              }
            }}
            disabled={operationInProgress}
          />
          <span className="ml-2 text-gray-700">Show only uncategorized</span>
        </label>

        {Object.keys(pendingCategoryUpdates).length > 0 && (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-secondary border-gray-300 rounded text-secondary focus:ring-secondary"
              checked={showOnlyCategorized}
              onChange={() => {
                setShowOnlyCategorized(!showOnlyCategorized);
                if (!showOnlyCategorized) {
                  setShowOnlyUncategorized(false);
                }
              }}
              disabled={operationInProgress}
            />
            <span className="ml-2 text-secondary-dark">Show only predictions</span>
          </label>
        )}
      </div>
    </div>
  );
} 