import React, { Dispatch, SetStateAction, useMemo, useState, useEffect, Fragment } from 'react';
import { format } from 'date-fns';
import { Tab, TabGroup, TabList } from '@headlessui/react';

type TransactionFiltersProps = {
  initialStartDate: string;
  initialEndDate: string;
  onApplyDates: (startDate: string, endDate: string) => void;
  isApplying: boolean;
  operationInProgress: boolean;
  trainedCount: number;
  clearedCount: number;
  unclearedCount: number;
  lastTrainedTimestamp?: string | null;
  statusFilter: 'uncleared' | 'cleared';
  setStatusFilter: (filter: 'uncleared' | 'cleared') => void;
};

const TransactionFilters = React.memo(({
  initialStartDate,
  initialEndDate,
  onApplyDates,
  isApplying,
  operationInProgress,
  trainedCount,
  clearedCount,
  unclearedCount,
  lastTrainedTimestamp,
  statusFilter,
  setStatusFilter
}: TransactionFiltersProps) => {
  const [pendingStartDate, setPendingStartDate] = useState(initialStartDate);
  const [pendingEndDate, setPendingEndDate] = useState(initialEndDate);

  useEffect(() => {
    setPendingStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setPendingEndDate(initialEndDate);
  }, [initialEndDate]);

  const formattedTimestamp = useMemo(() => {
    if (!lastTrainedTimestamp) return 'Never';
    try {
      return format(new Date(lastTrainedTimestamp), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return 'Invalid Date';
    }
  }, [lastTrainedTimestamp]);

  const handleTabChange = (index: number) => {
    setStatusFilter(index === 1 ? 'cleared' : 'uncleared');
  };

  const handlePendingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setPendingStartDate(value);
    } else if (name === 'endDate') {
      setPendingEndDate(value);
    }
  };

  const handleApplyClick = () => {
    onApplyDates(pendingStartDate, pendingEndDate);
  };

  const tabBaseStyle = "px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const tabInactiveStyle = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
  const tabActiveSecondaryStyle = "bg-secondary border-secondary text-white";
  const tabActivePrimaryStyle = "bg-primary border-primary text-white";

  const isDisabled = operationInProgress || isApplying;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex items-end gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={pendingStartDate}
              onChange={handlePendingDateChange}
              className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
              disabled={isDisabled}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={pendingEndDate}
              onChange={handlePendingDateChange}
              className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:bg-gray-100"
              disabled={isDisabled}
            />
          </div>
          <button
            onClick={handleApplyClick}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            disabled={isDisabled}
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

      <div className="flex flex-row items-center justify-between">
      <TabGroup defaultIndex={statusFilter === 'cleared' ? 1 : 0} onChange={handleTabChange}>
        <TabList className="flex space-x-2">
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${tabBaseStyle} ${selected ? tabActiveSecondaryStyle : tabInactiveStyle}`}
              >
                Unreviewed ({unclearedCount})
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${tabBaseStyle} ${selected ? tabActivePrimaryStyle : tabInactiveStyle}`}
              >
                Reviewed ({clearedCount})
              </button>
            )}
          </Tab>
        </TabList>
      </TabGroup>
      <div className="flex flex-col ml-auto pl-4 text-right">
        <span className="text-sm text-primary font-medium">Trained: {trainedCount}</span>
        <span className="text-xs text-gray-400 mt-1">Last Trained: {formattedTimestamp}</span>
      </div>
      </div>

      
    </div>
  );
});

TransactionFilters.displayName = 'TransactionFilters';

export default TransactionFilters; 