import React from 'react';
import { DashboardStats } from '../../utils/dashboardStats';
import { useConsolidatedSpreadsheetData } from '../../hooks/useConsolidatedSpreadsheetData';
import { mockSavingsData } from '../../utils/mockData';
import DashboardCharts from '../DashboardCharts';
import DataOverview from '../DataOverview';
import { AdvancedFinancialAnalytics } from '../AdvancedFinancialAnalytics';

interface DashboardStatisticsProps {
  stats: DashboardStats;
  filteredTransactions: any[];
  isFirstTimeUser?: boolean;
}

export const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({ 
  stats, 
  filteredTransactions, 
  isFirstTimeUser = false 
}) => {
  const [currentTimeFilter, setCurrentTimeFilter] = React.useState('all');
  
  // Use consolidated hook only for base currency and data freshness indicators
  const consolidatedData = useConsolidatedSpreadsheetData();
  
  // For first-time users, use mock savings data instead of real data
  const savingsData = isFirstTimeUser ? {
    netAssetValue: mockSavingsData.latestNetAssetValue,
    quarter: mockSavingsData.latestQuarter,
    formattedValue: mockSavingsData.formattedValue,
    runway: mockSavingsData.runwayMonths
  } : stats.runwayMonths ? {
    netAssetValue: stats.totalSavings || 0,
    quarter: stats.savingsQuarter || '',
    formattedValue: `$${(stats.totalSavings || 0).toLocaleString()}`,
    runway: stats.runwayMonths
  } : null;
  
  // Use the enhanced data freshness indicators from consolidated hook
  const hasExpiredToken = isFirstTimeUser ? false : consolidatedData.hasExpiredToken;
  const isUsingCachedData = isFirstTimeUser ? false : consolidatedData.isUsingCachedData;

  // Calculate the last month name and year
  const getLastMonthName = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate annual income projection
  const annualIncomeProjection = stats.monthlyAverageIncome * 12;

  const lastMonthName = getLastMonthName();

  // Show cached data warning when using cached data due to expired token
  const showCachedDataWarning = isUsingCachedData;

  return (
    <div className="space-y-8">

      {/* Show warning banner when using cached data */}
      {showCachedDataWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-xs sm:text-sm font-medium text-amber-800">
                Showing cached data - Google Sheets access expired
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-amber-700">
                Income, expenses, savings, and runway data is from your last sync. Use "Re-link Spreadsheet" to get the latest data.
              </p>
              {consolidatedData.lastDataRefresh && (
                <p className="mt-1 text-xs sm:text-xs text-amber-600">
                  Last updated: {consolidatedData.lastDataRefresh.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} at {consolidatedData.lastDataRefresh.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Condensed Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border ${showCachedDataWarning ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            Income
            {showCachedDataWarning && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Cached
              </span>
            )}
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-green-600">
                ${Math.round(stats.monthlyAverageIncome).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Monthly Average</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-lg font-semibold text-green-500">
                ${Math.round(stats.lastMonthIncome).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{lastMonthName}</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-lg font-semibold text-green-700">
                ${Math.round(annualIncomeProjection).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Annual Projection</p>
            </div>
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border ${showCachedDataWarning ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            Expenses
            {showCachedDataWarning && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Cached
              </span>
            )}
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-red-600">
                ${Math.round(stats.monthlyAverageExpenses).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Monthly Average</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-lg font-semibold text-red-500">
                ${Math.round(stats.lastMonthExpenses).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{lastMonthName}</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-lg font-semibold text-red-700">
                ${Math.round(stats.annualExpenseProjection).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Annual Projection</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border ${showCachedDataWarning ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            Savings
            {showCachedDataWarning && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Cached
              </span>
            )}
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-blue-600">
                ${Math.round(stats.monthlyAverageSavings).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Monthly Average</p>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-500">
                    ${Math.round(stats.lastMonthSavings).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{lastMonthName}</p>
                </div>
                <div className="text-right">
                  {stats.lastMonthIncome > 0 ? (
                    stats.lastMonthSavings >= 0 ? (
                      <div>
                        <p className="text-xs font-medium text-green-600">
                          {Math.round((stats.lastMonthSavings / stats.lastMonthIncome) * 100)}%
                        </p>
                        <p className="text-xs text-gray-400">Savings Rate</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-red-600">
                          {stats.totalSavings && stats.totalSavings > 0 
                            ? `${(Math.abs(stats.lastMonthSavings) / stats.totalSavings * 100).toFixed(2)}%`
                            : 'N/A'
                          }
                        </p>
                        <p className="text-xs text-gray-400">Burn Rate</p>
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-gray-400">N/A</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-lg font-semibold text-blue-700">
                ${Math.round(stats.monthlyAverageSavings * 12).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Annual Projection</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border ${showCachedDataWarning && savingsData ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
          <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            Runway
            {showCachedDataWarning && savingsData && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Cached
              </span>
            )}
          </h4>
          <div className="space-y-3">
            {savingsData ? (
              <>
                <div>
                  <p className="text-lg font-semibold text-purple-600">
                    ${Math.round(savingsData.netAssetValue).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total Savings</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-lg font-semibold text-purple-500">
                    {savingsData.runway} months
                  </p>
                  <p className="text-sm text-gray-500">
                    {savingsData.runway >= 12 
                      ? `(${Math.round(savingsData.runway / 12 * 10) / 10} years)`
                      : 'Financial runway'
                    }
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-400">
                    ${Math.round(savingsData.netAssetValue).toLocaleString()} ÷ ${Math.round(stats.monthlyAverageExpenses).toLocaleString()}/month
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-400">N/A</p>
                <p className="text-sm text-gray-500">Link spreadsheet to see runway</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <DataOverview />

      {/* Dashboard Visualizations */}
      <DashboardCharts 
        transactions={filteredTransactions}
        onTimeFilterChange={setCurrentTimeFilter} 
      />

      {/* Advanced Financial Analytics Section */}
      {filteredTransactions.length > 5 && (
        <AdvancedFinancialAnalytics 
          transactions={filteredTransactions} 
          autoAnalyze={true} // Always auto-analyze for demo data to show capabilities
          className="mt-4 sm:mt-6"
        />
      )}
    </div>
  );
}; 