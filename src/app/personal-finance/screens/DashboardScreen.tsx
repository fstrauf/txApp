'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
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
import { useSession } from 'next-auth/react';
import { SpreadsheetLinker } from '../components/SpreadsheetLinker';
import { GoogleSheetsUploadArea } from '../components/GoogleSheetsUploadArea';
import { useIncrementalAuth } from '@/hooks/useIncrementalAuth';

interface DashboardStats {
  monthlyAverageIncome: number;
  monthlyAverageSavings: number;
  monthlyAverageExpenses: number;
  lastMonthExpenses: number;
  annualExpenseProjection: number;
  lastDataRefresh?: Date;
}

const DashboardScreen: React.FC = () => {
  const { data: session } = useSession();
  const { userData, processTransactionData } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'dashboard', 
    progress: getProgress() 
  });
  const { hasSpreadsheetAccess, getValidAccessToken } = useIncrementalAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [spreadsheetLinked, setSpreadsheetLinked] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSpreadsheetLinker, setShowSpreadsheetLinker] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  // Check if user has linked spreadsheet and transaction data
  useEffect(() => {
    checkSpreadsheetStatus();
  }, [session, userData]);

  const checkSpreadsheetStatus = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/dashboard/status');
      const data = await response.json();
      
      if (response.ok) {
        setSpreadsheetLinked(!!data.spreadsheetUrl);
        setSpreadsheetUrl(data.spreadsheetUrl);
        
        // Check if we have actual transaction data
        const hasTransactionData = userData.transactions && userData.transactions.length > 0;
        setIsFirstTimeUser(!data.spreadsheetUrl && !hasTransactionData);
        
        if (data.spreadsheetUrl || hasTransactionData) {
          // Calculate stats from actual transaction data if available
          if (hasTransactionData) {
            const calculatedStats = calculateStatsFromTransactions(userData.transactions!);
            setDashboardStats(calculatedStats);
          } else if (data.stats) {
            setDashboardStats(data.stats);
          }
        }
      }
    } catch (error) {
      console.error('Error checking spreadsheet status:', error);
    }
  };

  // Calculate dashboard statistics from transaction data
  const calculateStatsFromTransactions = (transactions: any[]): DashboardStats => {
    if (!transactions.length) {
      return {
        monthlyAverageIncome: 0,
        monthlyAverageExpenses: 0,
        monthlyAverageSavings: 0,
        lastMonthExpenses: 0,
        annualExpenseProjection: 0,
        lastDataRefresh: new Date(),
      };
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    
    // === SMART DATE LOGIC ===
    // Calculate actual data span
    const transactionDates = transactions.map(t => new Date(t.date));
    const oldestDate = new Date(Math.min(...transactionDates.map(d => d.getTime())));
    const newestDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
    
    // Calculate actual months spanned
    const actualMonths = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Determine which transactions to use and how many months to divide by
    let transactionsToUse = transactions;
    let monthsToUseForAverage = actualMonths;
    
    if (actualMonths > 12) {
      // Use rolling 12-month window (last 12 months only)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      
      transactionsToUse = transactions.filter(t => new Date(t.date) >= twelveMonthsAgo);
      monthsToUseForAverage = 12;
    }
    // If ≤ 12 months, use all data and actual months (already set above)
    
    // === CALCULATE INCOME AND EXPENSES ===
    const expenses = transactionsToUse.filter(t => t.isDebit || t.amount < 0);
    const income = transactionsToUse.filter(t => !t.isDebit && t.amount > 0);
    
    const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate monthly averages using smart division
    const monthlyAverageIncome = totalIncome / monthsToUseForAverage;
    const monthlyAverageExpenses = totalExpenses / monthsToUseForAverage;
    const monthlyAverageSavings = monthlyAverageIncome - monthlyAverageExpenses;
    
    // === LAST MONTH EXPENSES (fixed date filtering) ===
    const lastMonthExpenses = expenses
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= lastMonth && transactionDate <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      monthlyAverageIncome: Math.round(monthlyAverageIncome),
      monthlyAverageExpenses: Math.round(monthlyAverageExpenses),
      monthlyAverageSavings: Math.round(monthlyAverageSavings),
      lastMonthExpenses: Math.round(lastMonthExpenses),
      annualExpenseProjection: Math.round(monthlyAverageExpenses * 12),
      lastDataRefresh: new Date(),
    };
  };

  const handleLinkSpreadsheet = () => {
    trackAction('link_spreadsheet_clicked', {
      is_first_time: isFirstTimeUser
    });
    setShowSpreadsheetLinker(true);
  };

  const handleSpreadsheetLinked = (data: { spreadsheetId: string; spreadsheetUrl: string }) => {
    setShowSpreadsheetLinker(false);
    setSpreadsheetLinked(true);
    setIsFirstTimeUser(false);
    // Refresh dashboard status
    checkSpreadsheetStatus();
  };

  const handleTransactionsFromGoogleSheets = async (transactions: any[]) => {
    // Process the transactions through the store
    processTransactionData(transactions);
    
    // Calculate and set dashboard stats
    const calculatedStats = calculateStatsFromTransactions(transactions);
    setDashboardStats(calculatedStats);
    
    // Update state
    setSpreadsheetLinked(true);
    setIsFirstTimeUser(false);
    setShowSpreadsheetLinker(false);
    
    trackAction('google_sheets_imported_to_dashboard', {
      transaction_count: transactions.length,
      expense_count: transactions.filter(t => t.isDebit).length,
      income_count: transactions.filter(t => !t.isDebit).length
    });

    // Try to save the spreadsheet URL to the database for future use
    // We need to get the spreadsheet URL from the current GoogleSheetsUploadArea state
    // This is a bit tricky since the component doesn't expose it, but we can enhance this later
    // For now, just refresh the dashboard status to pick up any changes
    setTimeout(() => {
      checkSpreadsheetStatus();
    }, 1000);
  };

  const handleRefreshData = async () => {
    if (!spreadsheetLinked && !spreadsheetUrl) {
      setError('No spreadsheet linked to refresh from');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    trackAction('refresh_data_clicked', {
      has_existing_data: !!dashboardStats,
      has_spreadsheet_url: !!spreadsheetUrl
    });

    try {
      // If we have a spreadsheet URL, try to refresh from it using existing API
      if (spreadsheetUrl) {
        const accessToken = await getValidAccessToken();
        
        if (!accessToken) {
          setError('Please reconnect to Google Sheets to refresh data');
          return;
        }

        // Extract spreadsheet ID from URL
        const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
        if (!spreadsheetId) {
          setError('Invalid spreadsheet URL stored');
          return;
        }

        // Use the existing Google Sheets API to read data
        const response = await fetch('/api/sheets/read-expense-detail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ spreadsheetId })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to read from Google Sheets');
        }

        if (data.transactions && data.transactions.length > 0) {
          // Process the refreshed transactions
          handleTransactionsFromGoogleSheets(data.transactions);
        } else {
          setError('No transaction data found in the spreadsheet');
        }
      } else {
        // Fallback to dashboard API
        const response = await fetch('/api/dashboard/refresh', { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
          setDashboardStats(data.stats);
        } else {
          setError(data.error || 'Failed to refresh data');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to refresh data from spreadsheet');
    } finally {
      setIsLoading(false);
    }
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
    goToScreen('spendingAnalysisUpload');
  };

  const handleExplainThis = () => {
    trackAction('explain_this_clicked');
    // TODO: Open help drawer or modal
  };

  if (showSpreadsheetLinker) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Connect Your Google Sheet
          </h1>
          <p className="text-lg text-gray-600">
            Import your transaction data to create your personalized dashboard
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
          <GoogleSheetsUploadArea onTransactionsSelect={handleTransactionsFromGoogleSheets} />
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowSpreadsheetLinker(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  onClick={handleLinkSpreadsheet}
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
      {dashboardStats && <DashboardStatistics stats={dashboardStats} />}

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
                onClick={handleRefreshData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Refresh Data
              </button>
            ) : (
              <button
                onClick={handleLinkSpreadsheet}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Link Google Sheet
              </button>
            )}
            <button
              onClick={handleAddNewData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Upload CSV Data
            </button>
          </div>
        </div>
      )}
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
const DashboardStatistics: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const [currentTimeFilter, setCurrentTimeFilter] = React.useState('all');

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
          <h4 className="text-sm font-medium text-gray-500 mb-2">Last Month Expenses</h4>
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
      <DashboardCharts onTimeFilterChange={setCurrentTimeFilter} />
    </div>
  );
};

export default DashboardScreen; 