'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { DashboardStats } from '../utils/dashboardStats';
import { Header } from '@/components/ui/Header';
import { 
  DocumentPlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import DashboardCharts from '../components/DashboardCharts';
import DataOverview from '../components/DataOverview';
import DataManagementDrawer from '../components/DataManagementDrawer';
import HowItWorksDrawer from '../components/HowItWorksDrawer';
import MonthlyReminderToast from '../components/MonthlyReminderToast';
import HelpDrawer from '@/components/shared/HelpDrawer';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import { useConsolidatedSpreadsheetData } from '../hooks/useConsolidatedSpreadsheetData';

import { mockTransactions, mockSavingsData } from '../utils/mockData';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { AdvancedFinancialAnalytics } from '../components/AdvancedFinancialAnalytics';
import { ErrorDisplayBox } from '../components/ErrorDisplayBox';
import PostHogApiSurvey from '@/components/shared/PostHogApiSurvey';
import { DEMO_DASHBOARD_HEADLINE_TEST, DEMO_DASHBOARD_CTA_TEST, getVariantDisplayText } from '../utils/abTestingConfig';


const DashboardScreen: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userData, processTransactionData, updateSpreadsheetInfo } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'dashboard', 
    progress: getProgress() 
  });
  const { requestSpreadsheetAccess } = useIncrementalAuth();
  // Get base currency from consolidated hook
  const { baseCurrency, spreadsheetName } = useConsolidatedSpreadsheetData();

  // A/B Testing for demo dashboard messaging
  const headlineVariant = posthog.getFeatureFlag('demo-dashboard-headline') as string;
  const ctaButtonVariant = posthog.getFeatureFlag('demo-dashboard-cta-button') as string;

  // Get headline text based on A/B test variant
  const getHeadlineText = () => {
    return getVariantDisplayText(DEMO_DASHBOARD_HEADLINE_TEST, headlineVariant || 'control');
  };

  // Get CTA button text based on A/B test variant
  const getCtaButtonText = () => {
    // Handle loading states first
    if (status === 'loading') {
      return 'Loading...';
    }
    
    // Get A/B test variant text, fallback to default based on auth status
    const variantText = getVariantDisplayText(DEMO_DASHBOARD_CTA_TEST, ctaButtonVariant || 'control');
    
    // For control variant, customize based on auth status
    if ((ctaButtonVariant || 'control') === 'control') {
      return status === 'unauthenticated' 
        ? 'Make This Dashboard Yours'
        : 'Make This My Dashboard';
    }
    
    return variantText;
  };

  // Use the TanStack Query dashboard hook
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
    refetchStatus,
    clearError
  } = useDashboardQuery();

  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'ai-insights'>('overview');

  const [dataManagementDefaultTab, setDataManagementDefaultTab] = useState<'manage' | 'upload' | 'validate' | 'settings'>('manage');
  const [userToastStatus, setUserToastStatus] = useState<string | null>(null);
  const [showExitSurvey, setShowExitSurvey] = useState(false);

  // Fetch user's monthly reminder toast status
  useEffect(() => {
    const fetchToastStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/monthly-reminder-toast', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserToastStatus(data.status);
          } else {
            console.error('Failed to fetch toast status:', response.statusText);
          }
        } catch (error) {
          console.error('Failed to fetch toast status:', error);
        }
      }
    };

    fetchToastStatus();
  }, [session?.user?.email]);

  // Generate mock data for first-time users
  const mockStats: DashboardStats = {
    monthlyAverageIncome: 5040,
    monthlyAverageSavings: 3232,
    monthlyAverageExpenses: mockSavingsData.monthlyBurnRate,
    lastMonthExpenses: 2850,
    lastMonthIncome: 4400,
    lastMonthSavings: 1550, // lastMonthIncome - lastMonthExpenses = 4400 - 2850
    annualExpenseProjection: mockSavingsData.monthlyBurnRate * 12,
    lastDataRefresh: new Date(),
    // Add runway calculation for first-time users
    runwayMonths: mockSavingsData.runwayMonths,
    totalSavings: mockSavingsData.latestNetAssetValue,
    savingsQuarter: mockSavingsData.latestQuarter,
  };

  // Use mock data for first-time users, real data otherwise
  const displayStats = isFirstTimeUser ? mockStats : dashboardStats;
  const displayTransactions = isFirstTimeUser ? mockTransactions : filteredTransactions;

  // No separate transaction insights hook needed - using existing AI system

  // Track dashboard screen view
  useEffect(() => {
    posthog.capture('dashboard_screen_viewed', {
      is_first_time_user: isFirstTimeUser,
      spreadsheet_linked: spreadsheetLinked,
      has_transactions: (displayTransactions?.length || 0) > 0,
      user_authenticated: !!session?.user?.id,
      transaction_count: displayTransactions?.length || 0,
      has_error: !!error,
      is_loading: isLoading,
      has_stats: !!displayStats
    });
  }, [isFirstTimeUser, spreadsheetLinked, displayTransactions?.length, session?.user?.id, error, isLoading, displayStats]);

  // Track A/B test exposure when demo banner is shown
  useEffect(() => {
    if (isFirstTimeUser) {
      posthog.capture('demo_dashboard_banner_viewed', {
        headline_variant: headlineVariant || 'control',
        cta_variant: ctaButtonVariant || 'control',
        is_first_time_user: isFirstTimeUser,
        user_authenticated: !!session?.user?.id
      });

      // Also send experiment exposure events for PostHog experiments
      if (headlineVariant) {
        posthog.capture('$experiment_started', {
          $feature_flag: 'demo-dashboard-headline',
          $feature_flag_response: headlineVariant
        });
      }
      
      if (ctaButtonVariant) {
        posthog.capture('$experiment_started', {
          $feature_flag: 'demo-dashboard-cta-button', 
          $feature_flag_response: ctaButtonVariant
        });
      }
    }
  }, [isFirstTimeUser, headlineVariant, ctaButtonVariant, session?.user?.id]);



  // Temporarily populate store with mock data for first-time users to enable charts/overview
  // but only if there's no existing real data
  useEffect(() => {
    if (isFirstTimeUser && (!userData.transactions || userData.transactions.length === 0)) {
      // Only set mock data if there's no real data and user is first-time
      processTransactionData(mockTransactions);
    } else if (!isFirstTimeUser && userData.transactions && userData.transactions.length > 0) {
      // If user is no longer first-time but has mock data, clear it to show real data
      const hasMockData = userData.transactions.some(t => t.id?.startsWith('mock-'));
      if (hasMockData) {
        // Clear mock data - real data will be loaded by the queries
        processTransactionData([]);
      }
    }
  }, [isFirstTimeUser, userData.transactions, processTransactionData]);

  // Comprehensive loading state - show loading if we're fetching initial data
  const isInitialLoading = isLoading && !dashboardStats && spreadsheetLinked && !isFirstTimeUser;
  const showLoadingState = isInitialLoading || (isRefreshing && !error);

  // Ensure drawers are closed when dashboard loads (e.g., returning from validation screen)
  useEffect(() => {
    setIsHelpDrawerOpen(false);
    setIsHowItWorksOpen(false);
  }, []);

  // Check if user has uploaded any data in this session
  const hasUploadedDataInSession = () => {
    // For exit survey purposes, we only care if they linked a spreadsheet 
    // in this session, not if they have historical data
    return spreadsheetLinked;
  };

  // Handle data management drawer close with exit survey logic
  const handleDataManagementDrawerClose = () => {
    console.log('🚪 Data management drawer closing - checking for exit survey...');
    console.log('📊 Upload state:', { 
      spreadsheetLinked, 
      hasTransactions: userData.transactions?.length || 0,
      hasUploadedDataInSession: hasUploadedDataInSession()
    });
    
    posthog.capture('dashboard_data_management_drawer_closed', {
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id
    });
    
    // Close the drawer first
    setIsHelpDrawerOpen(false);
    
    // Show exit survey if user hasn't uploaded any data in this session
    if (!hasUploadedDataInSession()) {
      console.log('📋 No data uploaded in this session, showing exit survey...');
      setShowExitSurvey(true);
    } else {
      console.log('✅ User has uploaded data in this session, not showing exit survey');
    }
  };

  // Event handlers
  const handleLinkSpreadsheet = () => {
    trackAction('link_spreadsheet_clicked', {
      is_first_time: isFirstTimeUser,
      is_authenticated: status === 'authenticated'
    });

    posthog.capture('dashboard_data_management_drawer_opened', {
      source: 'link_spreadsheet_button',
      is_first_time_user: isFirstTimeUser,
      user_authenticated: status === 'authenticated',
      default_tab: 'manage'
    });

    // Check authentication status
    if (status === 'loading') {
      // Still loading session, wait a moment
      return;
    }

    if (status === 'unauthenticated') {
      // User is not authenticated, redirect to login with return URL
      trackAction('redirect_to_login_from_dashboard', {
        source: 'make_this_my_dashboard_button'
      });
      
      // Redirect to login with callback to return to personal finance dashboard
      const callbackUrl = encodeURIComponent('/personal-finance');
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    // User is authenticated, proceed with normal flow
    setDataManagementDefaultTab('manage');
    setIsHelpDrawerOpen(true);
  };

  const handleSetMonthlyReminder = () => {
    trackAction('monthly_reminder_clicked', {
      user_has_data: !isFirstTimeUser
    });

    posthog.capture('dashboard_data_management_drawer_opened', {
      source: 'monthly_reminder_button',
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id,
      default_tab: 'settings'
    });

    setDataManagementDefaultTab('settings');
    setIsHelpDrawerOpen(true);
  };

  const handleSpreadsheetLinked = (data: { spreadsheetId: string; spreadsheetUrl: string }) => {
    console.log('🔗 Spreadsheet linked, updating store and refreshing status:', data);
    
    posthog.capture('dashboard_spreadsheet_linked_successfully', {
      spreadsheet_id: data.spreadsheetId,
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id
    });
    
    // Update the store with the spreadsheet information
    updateSpreadsheetInfo(data.spreadsheetId, data.spreadsheetUrl);
    
    // Refresh the dashboard status to pick up the new spreadsheet information
    refetchStatus();
    
    setIsHelpDrawerOpen(false);
    // The useDashboardQuery hook will automatically handle status updates
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

      posthog.capture('dashboard_csv_transactions_uploaded', {
        transaction_count: transactions.length,
        expense_count: transactions.filter(t => t.isDebit).length,
        income_count: transactions.filter(t => !t.isDebit).length,
        is_first_time_user: isFirstTimeUser,
        needs_validation: true
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

      posthog.capture('dashboard_google_sheets_imported', {
        transaction_count: transactions.length,
        expense_count: transactions.filter(t => t.isDebit).length,
        income_count: transactions.filter(t => !t.isDebit).length,
        is_first_time_user: isFirstTimeUser,
        needs_validation: false
      });

      // The useDashboard hook will automatically handle stats calculation and state updates
    }
  };

  const handleManualRefresh = async () => {
    trackAction('refresh_data_clicked', {
      has_existing_data: !!dashboardStats,
      has_spreadsheet_url: !!spreadsheetUrl
    });

    posthog.capture('dashboard_manual_refresh_clicked', {
      has_existing_data: !!dashboardStats,
      has_spreadsheet_url: !!spreadsheetUrl,
      is_first_time_user: isFirstTimeUser,
      transaction_count: displayTransactions.length
    });

    await handleRefreshData();
  };

  // Handle re-linking expired spreadsheet
  const handleRelinkSpreadsheet = async () => {
    if (!spreadsheetUrl) {
      console.error('No spreadsheet URL available for re-linking');
      return;
    }

    try {
      trackAction('relink_expired_spreadsheet_clicked', {
        has_spreadsheet_url: !!spreadsheetUrl
      });

      posthog.capture('dashboard_relink_spreadsheet_attempted', {
        has_spreadsheet_url: !!spreadsheetUrl,
        is_first_time_user: isFirstTimeUser,
        error_type: 'expired_access'
      });

      // Request new Google Sheets access
      const accessToken = await requestSpreadsheetAccess();
      console.log('✅ Re-authentication successful, access token obtained');

      // Re-link using the existing spreadsheet URL
      const response = await fetch('/api/dashboard/link-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Spreadsheet re-linked successfully');
        
        // Update the store with the spreadsheet information
        updateSpreadsheetInfo(data.spreadsheetId, data.spreadsheetUrl);
        
        // Clear any existing errors and refresh data
        clearError();
        await handleRefreshData();
        
        trackAction('spreadsheet_relinked_successfully', {
          spreadsheet_id: data.spreadsheetId
        });

        posthog.capture('dashboard_relink_spreadsheet_successful', {
          spreadsheet_id: data.spreadsheetId,
          is_first_time_user: isFirstTimeUser
        });
      } else {
        throw new Error(data.error || 'Failed to re-link spreadsheet');
      }
    } catch (error: any) {
      console.error('❌ Error re-linking spreadsheet:', error);
      trackAction('spreadsheet_relink_failed', {
        error: error.message
      });

      posthog.capture('dashboard_relink_spreadsheet_failed', {
        error_message: error.message,
        is_first_time_user: isFirstTimeUser,
        has_spreadsheet_url: !!spreadsheetUrl
      });
    }
  };



  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 w-full">
      <Header 
        variant="gradient"
        size="xl"
      >
        Your Financial Freedom Dashboard
      </Header>

      {/* Demo Data Banner for First-Time Users */}
      {isFirstTimeUser && (
        <div className="bg-gradient-to-r from-primary to-secondary-dark rounded-xl p-4 sm:p-8 border border-primary-light mb-6 sm:mb-8 shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 mb-4 sm:mb-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{getHeadlineText()}</h3>
              <p className="text-blue-100 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
                You're looking at <strong>real financial freedom</strong> — this demo shows <strong>{mockSavingsData.runwayMonths} months of "F*** You Money"</strong>.
                That's {Math.round(mockSavingsData.runwayMonths / 12 * 10) / 10} years of complete independence. 
                <span className="font-bold text-white"> What if this was YOUR actual runway?</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    // Track A/B test interaction
                    posthog.capture('demo_dashboard_cta_button_clicked', {
                      headline_variant: headlineVariant || 'control',
                      cta_variant: ctaButtonVariant || 'control',
                      is_first_time_user: isFirstTimeUser,
                      user_authenticated: !!session?.user?.id
                    });
                    handleLinkSpreadsheet();
                  }}
                  disabled={status === 'loading'}
                  className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-4 bg-white text-primary-dark rounded-xl hover:bg-blue-50 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto text-base sm:text-lg"
                >
                  <DocumentPlusIcon className="h-5 w-5" />
                  <span className="relative">
                    {getCtaButtonText()}
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    posthog.capture('dashboard_how_it_works_drawer_opened', {
                      source: 'demo_banner_button',
                      is_first_time_user: isFirstTimeUser,
                      user_authenticated: !!session?.user?.id
                    });
                    setIsHowItWorksOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 font-medium backdrop-blur-sm border border-white/30 w-full sm:w-auto text-sm sm:text-base"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                  See How It Works
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Error Display */}
      <ErrorDisplayBox 
        error={error}
        onRelink={handleRelinkSpreadsheet}
        onCreateNew={() => {
          setDataManagementDefaultTab('upload');
          handleLinkSpreadsheet();
        }}
        onRetry={handleRefreshData}
        onClear={clearError}
        showRelinkButton={!!spreadsheetUrl}
      />

      {/* Loading State */}
      {showLoadingState && (
                  <div className="space-y-4 sm:space-y-6">
            {/* Loading Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Loading your financial data...</h3>
                <p className="text-sm sm:text-base text-blue-700">
                  {isRefreshing ? 'Refreshing your latest transaction data from Google Sheets' : 'Fetching your transaction data and calculating statistics'}
                </p>
              </div>
            </div>
          </div>

          {/* Loading Dashboard Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-16"></div>
              <div className="space-y-3">
                <div>
                  <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="border-t pt-3">
                  <div className="h-6 bg-gray-300 rounded w-28 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-20"></div>
              <div className="space-y-3">
                <div>
                  <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="border-t pt-3">
                  <div className="h-6 bg-gray-300 rounded w-28 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Secondary Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-3 bg-gray-200 rounded mb-2 w-20"></div>
                <div className="h-8 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>

          {/* Loading Charts Skeleton */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      )}

      {/* Dashboard Statistics - only show when not loading */}
      {!showLoadingState && displayStats && (
        <>
          {/* Top Level Controls */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className='text-xs sm:text-sm text-gray-600'>
                  Last updated: {displayStats?.lastDataRefresh ? 
            new Date(displayStats.lastDataRefresh).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 
            'Never'}
                </div>

                <div className='text-xs sm:text-sm text-gray-600'>
                  Base currency: <span className="font-medium text-gray-800">{baseCurrency}</span>
                </div>

                {/* Manage Data Button */}
                <button
                  onClick={() => {
                    if (status === 'loading') return;
                    
                    if (status === 'unauthenticated') {
                      trackAction('redirect_to_login_from_connect_data', {
                        source: 'connect_your_data_button'
                      });
                      posthog.capture('dashboard_connect_data_unauthenticated', {
                        source: 'connect_your_data_button',
                        is_first_time_user: isFirstTimeUser
                      });
                      const callbackUrl = encodeURIComponent('/personal-finance');
                      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
                      return;
                    }
                    
                    posthog.capture('dashboard_connect_data_button_clicked', {
                      source: 'connect_your_data_button',
                      is_first_time_user: isFirstTimeUser,
                      user_authenticated: true
                    });
                    
                    setDataManagementDefaultTab('manage');
                    handleLinkSpreadsheet();
                  }}
                  disabled={status === 'loading'}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <DocumentPlusIcon className="h-4 w-4" />
                  {status === 'loading' 
                    ? 'Loading...'
                    : status === 'unauthenticated'
                      ? '🚀 Claim Your Freedom Dashboard'
                      : isFirstTimeUser 
                        ? '💪 Take Control of Your Data' 
                        : '⚡ Power Up Your Data'
                  }
                </button>

                {/* How This Works Button */}
                <button
                  onClick={() => {
                    posthog.capture('dashboard_how_it_works_drawer_opened', {
                      source: 'controls_button',
                      is_first_time_user: isFirstTimeUser,
                      user_authenticated: !!session?.user?.id
                    });
                    setIsHowItWorksOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <QuestionMarkCircleIcon className="h-4 w-4" />
                  🧠 See The Magic Behind It
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
                          posthog.capture('dashboard_hide_transfer_toggled', {
                            new_value: e.target.checked,
                            is_first_time_user: isFirstTimeUser,
                            transaction_count: displayTransactions.length
                          });
                          setHideTransfer(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                <div className="text-xs sm:text-sm text-gray-600">
                  {isFirstTimeUser 
                    ? 'Demo mode - showing sample data'
                    : `${displayTransactions.length} transactions shown`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              <DashboardStatistics stats={displayStats} filteredTransactions={displayTransactions} isFirstTimeUser={isFirstTimeUser} />
              
              {/* Advanced Financial Analytics Section */}
              {displayTransactions.length > 5 && (
                <AdvancedFinancialAnalytics 
                  transactions={displayTransactions} 
                  autoAnalyze={true} // Always auto-analyze for demo data to show capabilities
                  className="mt-4 sm:mt-6"
                />
              )}
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
              {displayTransactions.length > 0 ? (
                <div className="space-y-3">
                  {displayTransactions.slice(0, 50).map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.category || 'Transaction'}</p>
                        <p className="text-sm text-gray-600">{transaction.isDebit ? 'Expense' : 'Income'}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'No date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.isDebit ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {displayTransactions.length > 50 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Showing first 50 of {displayTransactions.length} transactions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No transaction data available</p>
                  {isFirstTimeUser && (
                    <p className="text-sm text-gray-400 mt-2">Connect your data to see transaction details</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🤖 AI-Powered Freedom Insights</h3>
              {displayStats ? (
                                  <div className="space-y-6">
                    {/* Freedom Analysis */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">💰 Your Freedom Burn Rate</h4>
                      <p className="text-gray-600 mb-2">
                        Here's how much freedom your money is buying you:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <strong>Monthly freedom cost:</strong> ${displayStats.monthlyAverageExpenses.toLocaleString()} (what it costs to maintain your lifestyle)</li>
                        <li>• <strong>Last month's burn:</strong> ${displayStats.lastMonthExpenses.toLocaleString()} — you {
                          displayStats.lastMonthExpenses < displayStats.monthlyAverageExpenses 
                            ? '🎉 spent LESS than average (extending your runway!)' 
                            : '⚠️ spent MORE than average (shortening your runway)'
                        }</li>
                        <li>• <strong>Annual freedom cost:</strong> ${displayStats.annualExpenseProjection.toLocaleString()} to maintain your current lifestyle</li>
                      </ul>
                    </div>

                    {/* Freedom Building */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🚀 Building Your Freedom Fund</h4>
                      <p className="text-gray-600 mb-2">
                        Ways to buy yourself more time:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <strong>Current freedom rate:</strong> You're adding ${displayStats.monthlyAverageSavings.toLocaleString()} to your runway each month</li>
                        <li>• <strong>Quick win:</strong> Automate transfers to build your "F*** You Money" faster</li>
                        <li>• <strong>Subscription audit:</strong> Cancel unused subscriptions to extend your runway immediately</li>
                      </ul>
                    </div>

                                      {/* Freedom Score */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🎯 Your Freedom Score</h4>
                      <p className="text-gray-600 mb-2">
                        How close are you to financial independence?
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-lg font-semibold text-green-600">
                            {Math.round((displayStats.monthlyAverageSavings / displayStats.monthlyAverageIncome) * 100)}%
                          </p>
                          <p className="text-xs text-gray-600">Freedom Rate</p>
                          <p className="text-xs text-green-600 mt-1">
                            {Math.round((displayStats.monthlyAverageSavings / displayStats.monthlyAverageIncome) * 100) >= 20 ? '🚀 Excellent!' : 
                             Math.round((displayStats.monthlyAverageSavings / displayStats.monthlyAverageIncome) * 100) >= 10 ? '👍 Good' : '💪 Keep going!'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-lg font-semibold text-blue-600">
                            {Math.round((displayStats.monthlyAverageExpenses / displayStats.monthlyAverageIncome) * 100)}%
                          </p>
                          <p className="text-xs text-gray-600">Lifestyle Cost</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {Math.round((displayStats.monthlyAverageExpenses / displayStats.monthlyAverageIncome) * 100) <= 50 ? '🎉 Lean living!' : 
                             Math.round((displayStats.monthlyAverageExpenses / displayStats.monthlyAverageIncome) * 100) <= 80 ? '👌 Reasonable' : '⚠️ High burn'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-lg font-semibold text-purple-600">
                            {displayStats.runwayMonths ? displayStats.runwayMonths : Math.round(displayStats.monthlyAverageSavings > 0 ? (displayStats.monthlyAverageExpenses / displayStats.monthlyAverageSavings) : 0)}
                          </p>
                          <p className="text-xs text-gray-600">Months of Freedom</p>
                          <p className="text-xs text-purple-600 mt-1">
                            {(displayStats.runwayMonths || 0) >= 12 ? '🔥 F*** You Money!' : 
                             (displayStats.runwayMonths || 0) >= 6 ? '💪 Getting there!' : '🚀 Keep building!'}
                          </p>
                        </div>
                      </div>
                    </div>

                                      {/* Freedom Timeline */}
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🗓️ Your Freedom Timeline</h4>
                      <p className="text-gray-600 mb-2">
                        Here's when you could achieve different levels of freedom:
                      </p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• <strong>Emergency buffer (6 months):</strong> {
                          displayStats.monthlyAverageSavings > 0 
                            ? `${Math.ceil((displayStats.monthlyAverageExpenses * 6) / displayStats.monthlyAverageSavings)} months away` 
                            : 'Start saving to calculate'
                        } 🛡️</li>
                        <li>• <strong>Mini-retirement (12 months):</strong> {
                          displayStats.monthlyAverageSavings > 0 
                            ? `${Math.ceil((displayStats.monthlyAverageExpenses * 12) / displayStats.monthlyAverageSavings)} months away` 
                            : 'Start saving to calculate'
                        } 🏖️</li>
                        <li>• <strong>Your momentum:</strong> {
                          displayStats.lastMonthExpenses < displayStats.monthlyAverageExpenses 
                            ? '🚀 You\'re accelerating towards freedom!' 
                            : '⚠️ Consider optimizing spending to reach freedom faster'
                        }</li>
                        <li>• <strong>Pro tip:</strong> Automate investments to compound your way to complete financial independence 💰</li>
                      </ul>
                    </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">AI Insights Coming Soon</h4>
                  <p className="text-gray-500 mb-4">
                    Connect your financial data to unlock personalized AI-powered insights and recommendations.
                  </p>
                  {isFirstTimeUser && (
                    <button
                      onClick={handleLinkSpreadsheet}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <DocumentPlusIcon className="h-5 w-5" />
                      Connect Data for AI Insights
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* No Data State - only show when not loading and no data */}
      {!showLoadingState && !displayStats && !isLoading && (
        <div className="text-center py-12 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Discover Your Financial Freedom?</h3>
          <p className="text-lg text-gray-700 mb-8">
            {spreadsheetLinked 
              ? "Your spreadsheet is connected! Refresh to unlock your personal runway calculation and see exactly how much time your money can buy."
              : "Upload your bank statements or connect your Google Sheets to discover how many months of freedom you already have saved up."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {spreadsheetLinked ? (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary-dark hover:to-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArrowPathIcon className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Calculating Your Freedom...' : 'Calculate My Runway'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsHelpDrawerOpen(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <DocumentPlusIcon className="h-6 w-6" />
                  Connect Google Sheets
                </button>
                <button
                  onClick={() => setIsHelpDrawerOpen(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusCircleIcon className="h-6 w-6" />
                  Upload Bank Data
                </button>
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>2 minutes</strong> to setup</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Instant</strong> runway calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Your data</strong> stays yours</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Help Drawer */}
      <HelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={handleDataManagementDrawerClose}
        title="Data Management"
        size="large"
      >
        <DataManagementDrawer
          spreadsheetLinked={spreadsheetLinked}
          spreadsheetUrl={spreadsheetUrl ?? null}
          onSpreadsheetLinked={handleSpreadsheetLinked}
          onTransactionsFromGoogleSheets={handleTransactionsFromGoogleSheets}
          onRefreshData={handleRefreshData}
          isLoading={isLoading}
          onClose={() => setIsHelpDrawerOpen(false)}
          error={error}
          onClearError={clearError}
          defaultTab={dataManagementDefaultTab}
          spreadsheetData={{ spreadsheetName }}
        />
      </HelpDrawer>

      {/* How This Works Drawer */}
      <HelpDrawer
        isOpen={isHowItWorksOpen}
        onClose={() => {
          posthog.capture('dashboard_how_it_works_drawer_closed', {
            is_first_time_user: isFirstTimeUser,
            user_authenticated: !!session?.user?.id
          });
          setIsHowItWorksOpen(false);
        }}
        title="How This Works"
        size="large"
      >
        <HowItWorksDrawer
          onClose={() => setIsHowItWorksOpen(false)}
        />
      </HelpDrawer>

      {/* Monthly Reminder Toast - only show for users with data */}
      {!isFirstTimeUser && displayStats && (
        <MonthlyReminderToast 
          delay={10000} 
          onSetReminder={handleSetMonthlyReminder}
          userToastStatus={userToastStatus}
          onStatusUpdate={(status) => setUserToastStatus(status)}
        />
      )}

      {/* Exit Intent Survey */}
      <PostHogApiSurvey
        surveyId="01978a09-ff78-0000-52ee-30eb2fe209ab"
        isVisible={showExitSurvey}
        onClose={() => setShowExitSurvey(false)}
        onComplete={() => setShowExitSurvey(false)}
        position="center"
        variant="modal"
      />
      </div>
    </div>
  );
};

// Dashboard Statistics Component
const DashboardStatistics: React.FC<{ stats: DashboardStats; filteredTransactions: any[]; isFirstTimeUser?: boolean }> = ({ stats, filteredTransactions, isFirstTimeUser }) => {
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
      {/* Empowerment Notice for First-Time Users */}
      {isFirstTimeUser && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-xs sm:text-sm font-medium text-green-800">
                <strong>You're in complete control</strong> — this is YOUR financial freedom dashboard
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-green-700">
                Your data lives in YOUR Google Sheets. We just analyze it to show you how much time your money can buy. 
                <span className="font-semibold"> No storage, no tricks, just pure financial empowerment.</span>
              </p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default DashboardScreen; 