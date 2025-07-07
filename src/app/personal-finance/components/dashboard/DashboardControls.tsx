import React from 'react';
import { DocumentPlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import posthog from 'posthog-js';

interface DashboardControlsProps {
  lastDataRefresh?: Date;
  baseCurrency: string;
  hideTransfer: boolean;
  onHideTransferChange: (checked: boolean) => void;
  onConnectDataClick: () => void;
  onHowItWorksClick: () => void;
  onManualRefresh: () => void;
  spreadsheetName: string | null;
  showConnectDataButton: boolean;
  showMonthlyReminder: boolean;
  onSetMonthlyReminder: () => void;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  transactionCount: number;
  status: string;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  lastDataRefresh,
  baseCurrency,
  hideTransfer,
  onHideTransferChange,
  onConnectDataClick,
  onHowItWorksClick,
  onManualRefresh,
  spreadsheetName,
  showConnectDataButton,
  showMonthlyReminder,
  onSetMonthlyReminder,
  isFirstTimeUser,
  isLoading,
  transactionCount,
  status,
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className='text-xs sm:text-sm text-gray-600'>
            Last updated: {lastDataRefresh ? 
      new Date(lastDataRefresh).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) : 
      'Never'}
          </div>

          <div className='text-xs sm:text-sm text-gray-600'>
            Base currency: <span className="font-medium text-gray-800">{baseCurrency}</span>
          </div>

          {/* Connect Data Button */}
          <button
            onClick={() => {
              posthog.capture('pf_connect_data_clicked', {
                component: 'dashboard_controls',
                is_first_time_user: isFirstTimeUser,
                status: status,
                transaction_count: transactionCount
              });
              onConnectDataClick();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {status === 'loading' 
              ? 'Loading...'
              : status === 'unauthenticated'
                ? 'Get Your Google Sheet'
                : isFirstTimeUser 
                  ? 'Get Your Google Sheet' 
                  : 'Add Your Data'
            }
          </button>

          {/* How This Works Button */}
          <button
            onClick={() => {
              posthog.capture('pf_how_it_works_clicked', {
                component: 'dashboard_controls',
                is_first_time_user: isFirstTimeUser
              });
              onHowItWorksClick();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {isFirstTimeUser ? 'Watch 90-Second Setup Video' : 'See The Magic Behind It'}
          </button>
        </div>

        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
          {/* Hide Transfer Toggle - only for real data */}
          {!isFirstTimeUser && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Hide Transfer:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideTransfer}
                  onChange={(e) => {
                    posthog.capture('pf_hide_transfer_toggled', {
                      component: 'dashboard_controls',
                      hide_transfer: e.target.checked,
                      transaction_count: transactionCount
                    });
                    onHideTransferChange(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 