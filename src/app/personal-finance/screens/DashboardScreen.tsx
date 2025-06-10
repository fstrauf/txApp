'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardStats } from '../utils/dashboardStats';
import { Header } from '@/components/ui/Header';
import { 
  DocumentPlusIcon,
  ArrowPathIcon,
  LinkIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DashboardCharts from '../components/DashboardCharts';
import DataOverview from '../components/DataOverview';
import DataManagementDrawer from '../components/DataManagementDrawer';
import HelpDrawer from '@/components/shared/HelpDrawer';

const DashboardScreen: React.FC = () => {
  const { processTransactionData, updateSpreadsheetInfo } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'dashboard', 
    progress: getProgress() 
  });

  // Use the consolidated dashboard hook
  const {
    dashboardStats,
    filteredTransactions,
    isFirstTimeUser,
    spreadsheetLinked,
    spreadsheetUrl,
    hideTransfer,
    isLoading,
    error,
    setHideTransfer,
    handleRefreshData,
    clearError
  } = useDashboard();

  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);

  // Generate mock data for first-time users
  const mockStats = {
    monthlyAverageIncome: 4200,
    monthlyAverageSavings: 1100,
    monthlyAverageExpenses: 3100,
    lastMonthExpenses: 2850,
    lastMonthIncome: 4400,
    annualExpenseProjection: 37200,
    lastDataRefresh: new Date(),
  };

  // Use mock data for first-time users, real data otherwise
  const displayStats = isFirstTimeUser ? mockStats : dashboardStats;
  const displayTransactions = isFirstTimeUser ? [] : filteredTransactions;

  // Ensure help drawer is closed when dashboard loads (e.g., returning from validation screen)
  useEffect(() => {
    setIsHelpDrawerOpen(false);
  }, []);

  // Event handlers
  const handleLinkSpreadsheet = () => {
    trackAction('link_spreadsheet_clicked', {
      is_first_time: isFirstTimeUser
    });
    setIsHelpDrawerOpen(true);
  };

  const handleSpreadsheetLinked = (data: { spreadsheetId: string; spreadsheetUrl: string }) => {
    console.log('🔗 Spreadsheet linked, updating store:', data);
    
    // Update the store with the spreadsheet information
    updateSpreadsheetInfo(data.spreadsheetId, data.spreadsheetUrl);
    
    setIsHelpDrawerOpen(false);
    // The useDashboard hook will automatically handle status updates
  };

  const handleTransactionsFromGoogleSheets = async (transactions: any[]) => {
    // Check if these are categorized transactions needing validation (from CSV upload)
    const hasCategoryPredictions = transactions.some(t => t.predicted_category || t.confidence !== undefined);
    
    if (hasCategoryPredictions) {
      // These are newly categorized transactions that need validation
      setIsHelpDrawerOpen(false); // Close the help drawer
      
      trackAction('csv_transactions_categorized', {
        transaction_count: transactions.length,
        expense_count: transactions.filter(t => t.isDebit).length,
        income_count: transactions.filter(t => !t.isDebit).length
      });
      
      // Navigate to validation screen
      processTransactionData(transactions); // Store in app state for validation screen
      goToScreen('transactionValidation');
      
    } else {
      // These are direct imports from Google Sheets (already categorized)
      processTransactionData(transactions);
      
      // Close the help drawer
      setIsHelpDrawerOpen(false);
      
      trackAction('google_sheets_imported_to_dashboard', {
        transaction_count: transactions.length,
        expense_count: transactions.filter(t => t.isDebit).length,
        income_count: transactions.filter(t => !t.isDebit).length
      });

      // The useDashboard hook will automatically handle stats calculation and state updates
    }
  };

  const handleManualRefresh = async () => {
    trackAction('refresh_data_clicked', {
      has_existing_data: !!dashboardStats,
      has_spreadsheet_url: !!spreadsheetUrl
    });

    await handleRefreshData();
  };

  // Helper function to extract spreadsheet ID from URL
  const extractSpreadsheetId = (url: string): string | null => {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <Header 
        variant="gradient"
        size="xl"
        badge={{
          text: "Personal Finance Dashboard",
          variant: "success"
        }}
        // subtitle={`Last updated: ${displayStats?.lastDataRefresh ? 
        //   new Date(displayStats.lastDataRefresh).toLocaleDateString() : 
        //   'Never'}`}
      >
        Your Financial Overview
      </Header>

      {/* Demo Data Banner for First-Time Users */}
      {isFirstTimeUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">This is demo data</h3>
              <p className="text-blue-700 mb-4">
                You're seeing sample financial data to preview what your dashboard could look like. 
                Connect your bank transactions or Google Sheet to see your real financial overview.
              </p>
              <button
                onClick={handleLinkSpreadsheet}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Connect My Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Dashboard Statistics */}
      {displayStats && (
        <>
          {/* Top Level Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                
              <div className='text-sm text-gray-600'>
                Last updated: {displayStats?.lastDataRefresh ? 
          new Date(displayStats.lastDataRefresh).toLocaleDateString() : 
          'Never'}
              </div>

                {/* Manage Data Button */}
                <button
                  onClick={handleLinkSpreadsheet}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <DocumentPlusIcon className="h-4 w-4" />
                  {isFirstTimeUser ? 'Connect Your Data' : 'Manage Data'}
                </button>
              </div>

<div className='flex items-center gap-2'>
                              {/* Hide Transfer Toggle - only for real data */}
                              {!isFirstTimeUser && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Hide Transfer:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideTransfer}
                        onChange={(e) => setHideTransfer(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

              <div className="text-sm text-gray-600">
                {isFirstTimeUser 
                  ? 'Demo mode - showing sample data'
                  : `Affects both KPIs and charts • ${displayTransactions.length} transactions shown`
                }
              </div>
            </div>
          </div>
          </div>

          <DashboardStatistics stats={displayStats} filteredTransactions={displayTransactions} />
        </>
      )}



      {/* No Data State */}
      {!displayStats && !isLoading && (
        <div className="text-center py-12">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-6">
            {spreadsheetLinked 
              ? "Refresh your data from your linked spreadsheet to see your financial overview."
              : "Link a Google Spreadsheet or upload transaction data to see your financial overview."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {spreadsheetLinked ? (
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Refresh Data
              </button>
            ) : (
              <button
                onClick={() => setIsHelpDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Link Google Sheet
              </button>
            )}
            <button
              onClick={() => setIsHelpDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Upload CSV Data
            </button>
          </div>
        </div>
      )}

      {/* Data Management Help Drawer */}
      <HelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={() => setIsHelpDrawerOpen(false)}
        title="Data Management"
        size="large"
      >
        <DataManagementDrawer
          spreadsheetLinked={spreadsheetLinked}
          spreadsheetUrl={spreadsheetUrl}
          onSpreadsheetLinked={handleSpreadsheetLinked}
          onTransactionsFromGoogleSheets={handleTransactionsFromGoogleSheets}
          onRefreshData={handleRefreshData}
          isLoading={isLoading}
          onClose={() => setIsHelpDrawerOpen(false)}
        />
      </HelpDrawer>
    </div>
  );
};

// Dashboard Statistics Component
const DashboardStatistics: React.FC<{ stats: DashboardStats; filteredTransactions: any[] }> = ({ stats, filteredTransactions }) => {
  const [currentTimeFilter, setCurrentTimeFilter] = React.useState('all');

  // Calculate the last month name and year
  const getLastMonthName = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const lastMonthName = getLastMonthName();

  return (
    <div className="space-y-8">
      {/* Debug Component - Remove this in production */}
      {/* <DashboardDebugger dashboardStats={stats} timeFilter={currentTimeFilter} /> */}
      
      {/* Condensed Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Income</h4>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-green-600">
                ${stats.monthlyAverageIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Monthly Average</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-xl font-semibold text-green-500">
                ${stats.lastMonthIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{lastMonthName}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Expenses</h4>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-red-600">
                ${stats.monthlyAverageExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Monthly Average</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-xl font-semibold text-red-500">
                ${stats.lastMonthExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{lastMonthName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Savings</h4>
          <p className="text-2xl font-bold text-blue-600">
            ${stats.monthlyAverageSavings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {stats.monthlyAverageIncome > 0 ? 
              `${Math.round((stats.monthlyAverageSavings / stats.monthlyAverageIncome) * 100)}% savings rate` :
              'Savings rate calculation unavailable'
            }
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Annual Projection</h4>
          <p className="text-2xl font-bold text-purple-600">
            ${stats.annualExpenseProjection.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Based on monthly average</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Financial Health</h4>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.monthlyAverageSavings > 0 ? 'Positive' : 'Needs Work'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {stats.monthlyAverageSavings > stats.monthlyAverageExpenses * 0.2 ? 
              'Great savings rate!' : 
              'Consider optimizing expenses'
            }
          </p>
        </div>
      </div>

      {/* Data Overview */}
      <DataOverview />

      {/* Dashboard Visualizations */}
      <DashboardCharts 
        transactions={filteredTransactions}
        onTimeFilterChange={setCurrentTimeFilter} 
      />
    </div>
  );
};

export default DashboardScreen; 