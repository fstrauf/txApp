import React from 'react';
import { DocumentPlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
            onClick={onConnectDataClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <DocumentPlusIcon className="h-4 w-4" />
            {status === 'loading' 
              ? 'Loading...'
              : status === 'unauthenticated'
                ? 'Claim Your Dashboard'
                : isFirstTimeUser 
                  ? 'Take Control of Your Data' 
                  : 'Power Up Your Data'
            }
          </button>

          {/* How This Works Button */}
          <button
            onClick={onHowItWorksClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
            See The Magic Behind It
          </button>

          <Tooltip content="Refresh your latest transaction data from your spreadsheet.">
            <Button
              variant="outline"
              size="sm"
              onClick={onManualRefresh}
              className="flex items-center gap-2"
            >
              Refresh
            </Button>
          </Tooltip>
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
                  onChange={(e) => onHideTransferChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          <div className="text-xs sm:text-sm text-gray-600">
            {isFirstTimeUser 
              ? 'Demo mode - showing sample data'
              : `${transactionCount} transactions shown`
            }
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {showConnectDataButton && (
          <Button
            onClick={onConnectDataClick}
            size="sm"
            className="bg-primary hover:bg-primary-dark"
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Connect Your Data
          </Button>
        )}

        <Button
          onClick={onHowItWorksClick}
          variant="outline"
          size="sm"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
          How It Works
        </Button>

        {showMonthlyReminder && (
           <Button
            onClick={onSetMonthlyReminder}
            variant="outline"
            size="sm"
          >
            Set Monthly Reminder
          </Button>
        )}
      </div>
    </div>
  );
}; 