'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { useDashboard } from '../hooks/useDashboard';
import { calculateStatsFromTransactions, DashboardStats } from '../utils/dashboardStats';
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
import DashboardDebugger from '../components/DashboardDebugger';
import DataOverview from '../components/DataOverview';
import { SpreadsheetLinker } from '../components/SpreadsheetLinker';
import { GoogleSheetsUploadArea } from '../components/GoogleSheetsUploadArea';
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
    isRefreshing,
    error,
    setHideTransfer,
    handleRefreshData,
    clearError
  } = useDashboard();

  const [showSpreadsheetLinker, setShowSpreadsheetLinker] = useState(false);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);

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

  const handleOpenSpreadsheet = () => {
    trackAction('open_spreadsheet_clicked');
    // Open user's spreadsheet in new tab
    if (spreadsheetUrl) {
      window.open(spreadsheetUrl, '_blank');
    } else {
      // Fallback: get the latest URL from API
      fetch('/api/dashboard/status')
        .then(res => res.json())
        .then(data => {
          if (data.spreadsheetUrl) {
            window.open(data.spreadsheetUrl, '_blank');
          }
        })
        .catch(console.error);
    }
  };

  const handleAddNewData = () => {
    trackAction('add_new_data_clicked', {
      has_existing_data: !!dashboardStats
    });
    setIsHelpDrawerOpen(true);
  };

  const handleExplainThis = () => {
    trackAction('explain_this_clicked');
    setIsHelpDrawerOpen(true);
  };



  if (isFirstTimeUser) {
    return <FirstTimeUserDashboard onLinkSpreadsheet={handleLinkSpreadsheet} />;
  }

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
        subtitle={`Last updated: ${dashboardStats?.lastDataRefresh ? 
          new Date(dashboardStats.lastDataRefresh).toLocaleDateString() : 
          'Never'}`}
      >
        Your Financial Overview
      </Header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={handleRefreshData}
          disabled={isLoading}
          className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="font-medium text-blue-800">
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </span>
        </button>

        <button
          onClick={handleOpenSpreadsheet}
          className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200"
        >
          <LinkIcon className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">Open Sheet</span>
        </button>

        <button
          onClick={handleAddNewData}
          className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200"
        >
          <PlusCircleIcon className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-purple-800">Add New Data</span>
        </button>

        <button
          onClick={handleLinkSpreadsheet}
          className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors duration-200"
        >
          <DocumentPlusIcon className="h-5 w-5 text-orange-600" />
          <span className="font-medium text-orange-800">
            {spreadsheetLinked ? 'Change Sheet' : 'Link Sheet'}
          </span>
        </button>

        <button
          onClick={handleExplainThis}
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-800">Explain This</span>
        </button>
      </div>

      {/* Spreadsheet Status */}
      {spreadsheetLinked && spreadsheetUrl && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5C3.9,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3M14,17H8V15H14V17M16.5,13H7.5V11H16.5V13M16.5,9H7.5V7H16.5V9Z"/>
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-1">Google Sheet Connected</h4>
              <p className="text-sm text-green-700 mb-2">
                Your financial data is linked to your Google Spreadsheet
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleOpenSpreadsheet}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Open Spreadsheet
                </button>
                <button
                  onClick={() => setIsHelpDrawerOpen(true)}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Change Spreadsheet
                </button>
              </div>
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
      {dashboardStats && (
        <>
          {/* Top Level Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Settings:</span>
                
                {/* Hide Transfer Toggle */}
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
              </div>
              
              <div className="text-sm text-gray-600">
                Affects both KPIs and charts • {filteredTransactions.length} transactions shown
              </div>
            </div>
          </div>

          <DashboardStatistics stats={dashboardStats} filteredTransactions={filteredTransactions} />
        </>
      )}

      {/* No Data State */}
      {!dashboardStats && !isLoading && (
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
        title="Manage Your Data"
        size="large"
      >
        <DataManagementDrawer
          spreadsheetLinked={spreadsheetLinked}
          spreadsheetUrl={spreadsheetUrl}
          onSpreadsheetLinked={handleSpreadsheetLinked}
          onTransactionsFromGoogleSheets={handleTransactionsFromGoogleSheets}
          onRefreshData={handleRefreshData}
          onAddNewData={handleAddNewData}
          isLoading={isLoading}
          onClose={() => setIsHelpDrawerOpen(false)}
        />
      </HelpDrawer>
    </div>
  );
};

// First Time User Component
const FirstTimeUserDashboard: React.FC<{ onLinkSpreadsheet: () => void }> = ({ 
  onLinkSpreadsheet 
}) => {
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'dashboard', 
    progress: 0 
  });

  const handleSeeWithMyData = () => {
    trackAction('first_time_user_interested', {
      action: 'see_with_my_data'
    });
    onLinkSpreadsheet();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <Header 
        variant="gradient"
        size="xl"
        badge={{
          text: "Welcome",
          variant: "info"
        }}
        subtitle="See what your personal finance dashboard could look like"
      >
        Your Financial Dashboard
      </Header>

      {/* Mock Dashboard Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Here's what you could see with your data:</h3>
        
        {/* Mock Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Average Income</h4>
            <p className="text-3xl font-bold text-green-600">$4,200</p>
            <p className="text-sm text-gray-400">+8% from last year</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Average Expenses</h4>
            <p className="text-3xl font-bold text-red-600">$3,100</p>
            <p className="text-sm text-gray-400">Well within budget</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Savings</h4>
            <p className="text-3xl font-bold text-blue-600">$1,100</p>
            <p className="text-sm text-gray-400">26% savings rate</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          This is sample data. Connect your bank transactions to see your real financial overview 
          with personalized insights, spending analysis, and savings tracking.
        </p>

        <button
          onClick={handleSeeWithMyData}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          <DocumentPlusIcon className="h-5 w-5" />
          Yes, show me this with my data
        </button>
      </div>
    </div>
  );
};

// Dashboard Statistics Component
const DashboardStatistics: React.FC<{ stats: DashboardStats; filteredTransactions: any[] }> = ({ stats, filteredTransactions }) => {
  const [currentTimeFilter, setCurrentTimeFilter] = React.useState('all');

  // Calculate the last month name
  const getLastMonthName = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth.toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="space-y-8">
      {/* Debug Component - Remove this in production */}
      {/* <DashboardDebugger dashboardStats={stats} timeFilter={currentTimeFilter} /> */}
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Average Income</h4>
          <p className="text-3xl font-bold text-green-600">
            ${stats.monthlyAverageIncome.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Average Expenses</h4>
          <p className="text-3xl font-bold text-red-600">
            ${stats.monthlyAverageExpenses.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Savings</h4>
          <p className="text-3xl font-bold text-blue-600">
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
          <h4 className="text-sm font-medium text-gray-500 mb-2">{getLastMonthName()} Expenses</h4>
          <p className="text-3xl font-bold text-orange-600">
            ${stats.lastMonthExpenses.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Annual Projection</h4>
          <p className="text-3xl font-bold text-purple-600">
            ${stats.annualExpenseProjection.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">Based on monthly average</p>
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