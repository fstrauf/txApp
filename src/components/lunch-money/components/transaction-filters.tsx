import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { DateRange } from '../types';
import { format } from 'date-fns';
import { Switch, Field, Label } from '@headlessui/react';

type TransactionFiltersProps = {
  pendingDateRange: DateRange;
  handleDateRangeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyDateFilter: () => void;
  operationInProgress: boolean;
  isApplying: boolean;
  trainedCount: number;
  pendingCategoryUpdates: Record<string, {categoryId: string | null, score: number}>;
  lastTrainedTimestamp?: string | null;
  statusFilter: 'uncleared' | 'cleared';
  setStatusFilter: (filter: 'uncleared' | 'cleared') => void;
};

const TransactionFilters = ({
  pendingDateRange,
  handleDateRangeChange,
  applyDateFilter,
  operationInProgress,
  isApplying,
  trainedCount,
  lastTrainedTimestamp,
  statusFilter,
  setStatusFilter
}: TransactionFiltersProps) => {
  const formattedTimestamp = useMemo(() => {
    if (!lastTrainedTimestamp) return 'Never';
    try {
      return format(new Date(lastTrainedTimestamp), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return 'Invalid Date';
    }
  }, [lastTrainedTimestamp]);

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

        <div className="flex flex-col ml-auto pl-4 border-l border-gray-300">
          <span className="text-sm text-gray-600 font-medium">Trained: {trainedCount}</span>
          <span className="text-sm text-gray-500 mt-1">Last Trained: {formattedTimestamp}</span>
        </div>
      </div>

      <Field as="div" className="flex items-center gap-2 mt-4">
        <Switch
          checked={statusFilter === 'cleared'}
          onChange={(checked) => setStatusFilter(checked ? 'cleared' : 'uncleared')}
          className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-checked:bg-blue-600 data-disabled:cursor-not-allowed data-disabled:opacity-50"
          disabled={operationInProgress}
        >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
        <Label className="text-sm font-medium text-gray-700 cursor-pointer">Show Cleared Transactions</Label>
      </Field>
    </div>
  );
};

TransactionFilters.displayName = 'TransactionFilters';

export default TransactionFilters; 