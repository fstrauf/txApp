'use client';

import React, { useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardHandlers } from '../hooks/useDashboardHandlers';
import { DashboardStats } from '../utils/dashboardStats';
import { Header } from '@/components/ui/Header';
import DataManagementDrawer from '../components/DataManagementDrawer';
import HowItWorksDrawer from '../components/HowItWorksDrawer';
import MonthlyReminderToast from '../components/MonthlyReminderToast';
import HelpDrawer from '@/components/shared/HelpDrawer';
import { useConsolidatedSpreadsheetData } from '../hooks/useConsolidatedSpreadsheetData';
import { mockTransactions, mockSavingsData, mockAssetsData } from '../utils/mockData';
import posthog from 'posthog-js';
import { ErrorDisplayBox } from '../components/ErrorDisplayBox';
import PostHogApiSurvey from '@/components/shared/PostHogApiSurvey';
import { useDashboardAbTesting } from '../utils/dashboardAbTesting';

// Import modular components
import { DemoBanner } from '../components/dashboard/DemoBanner';
import { DashboardControls } from '../components/dashboard/DashboardControls';
import { LoadingState } from '../components/dashboard/LoadingState';
import { NoDataState } from '../components/dashboard/NoDataState';
import { DashboardStatistics } from '../components/dashboard/DashboardStatistics';
import { TransactionTab, AIInsightsTab, PortfolioTab } from '../components/dashboard/TabContent';
import { TabNavigation } from '../components/dashboard/TabNavigation';

const DashboardScreen: React.FC = () => {
  const { userData, processTransactionData } = usePersonalFinanceStore();
  const { baseCurrency, spreadsheetName } = useConsolidatedSpreadsheetData();

  // Use modular state management
  const {
    session,
    status,
    isHelpDrawerOpen,
    setIsHelpDrawerOpen,
    isHowItWorksOpen,
    setIsHowItWorksOpen,
    activeTab,
    setActiveTab,
    dataManagementDefaultTab,
    setDataManagementDefaultTab,
    userToastStatus,
    setUserToastStatus,
    showExitSurvey,
    setShowExitSurvey,
  } = useDashboardState();

  // A/B Testing
  const { headlineVariant, ctaButtonVariant, getHeadlineText, getCtaButtonText } = useDashboardAbTesting(status);

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
    clearError,
    assetsData
  } = useDashboardQuery();

  // Use modular handlers
  const handlers = useDashboardHandlers({
    isFirstTimeUser,
    status,
    spreadsheetUrl,
    setDataManagementDefaultTab,
    setIsHelpDrawerOpen,
    setIsHowItWorksOpen,
    setShowExitSurvey,
    handleRefreshData: async () => {
      await handleRefreshData();
    },
    clearError,
    refetchStatus,
    spreadsheetLinked,
    userData,
  });

  // Generate mock data for first-time users
  const mockStats: DashboardStats = {
    monthlyAverageIncome: 5040,
    monthlyAverageSavings: 3232,
    monthlyAverageExpenses: mockSavingsData.monthlyBurnRate,
    lastMonthExpenses: 2850,
    lastMonthIncome: 4400,
    lastMonthSavings: 1550,
    annualExpenseProjection: mockSavingsData.monthlyBurnRate * 12,
    lastDataRefresh: new Date(),
    runwayMonths: mockSavingsData.runwayMonths,
    totalSavings: mockSavingsData.latestNetAssetValue,
    savingsQuarter: mockSavingsData.latestQuarter,
  };

  // Use mock data for first-time users, real data otherwise
  const displayStats = isFirstTimeUser ? mockStats : dashboardStats;
  const displayTransactions = isFirstTimeUser ? mockTransactions : filteredTransactions;
  const displayAssetsData = isFirstTimeUser ? mockAssetsData : assetsData;

  // Track dashboard screen view
  useEffect(() => {
    posthog.capture('pf_screen_viewed', {
      screen: 'dashboard',
      is_first_time_user: isFirstTimeUser,
      spreadsheet_linked: spreadsheetLinked,
      has_transactions: (displayTransactions?.length || 0) > 0,
      user_authenticated: !!session?.user?.id,
      transaction_count: displayTransactions?.length || 0,
    });
  }, [isFirstTimeUser, spreadsheetLinked, displayTransactions?.length, session?.user?.id]);

  // Track tab navigation
  useEffect(() => {
    if (activeTab) {
      posthog.capture('pf_navigation', {
        active_tab: activeTab,
        is_first_time_user: isFirstTimeUser,
        user_authenticated: !!session?.user?.id
      });
    }
  }, [activeTab, isFirstTimeUser, session?.user?.id]);

  // Track A/B test exposure when demo banner is shown
  useEffect(() => {
    if (isFirstTimeUser) {
      posthog.capture('demo_dashboard_banner_viewed', {
        headline_variant: headlineVariant || 'control',
        cta_variant: ctaButtonVariant || 'control',
        is_first_time_user: isFirstTimeUser,
        user_authenticated: !!session?.user?.id
      });

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

  // Temporarily populate store with mock data for first-time users
  useEffect(() => {
    if (isFirstTimeUser && (!userData.transactions || userData.transactions.length === 0)) {
      processTransactionData(mockTransactions);
    } else if (!isFirstTimeUser && userData.transactions && userData.transactions.length > 0) {
      const hasMockData = userData.transactions.some(t => t.id?.startsWith('mock-'));
      if (hasMockData) {
        processTransactionData([]);
      }
    }
  }, [isFirstTimeUser, userData.transactions, processTransactionData]);

  const showLoadingState = (isLoading && !dashboardStats && spreadsheetLinked && !isFirstTimeUser) || (isRefreshing && !error);

  const openDataDrawer = (source: string) => {
    posthog.capture('pf_drawer_opened', {
      source: source,
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id
    });
    setDataManagementDefaultTab('manage');
    handlers.handleLinkSpreadsheet();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 w-full">
        <Header variant="gradient" size="xl">
          Your Financial Freedom Dashboard
        </Header>

        {/* Demo Banner for First-Time Users */}
        {isFirstTimeUser && (
          <DemoBanner
            headlineText={getHeadlineText()}
            ctaButtonText={getCtaButtonText()}
            onCtaClick={() => openDataDrawer('demo_banner_cta')}
            onHowItWorksClick={() => setIsHowItWorksOpen(true)}
            isLoading={status === 'loading'}
          />
        )}

        {/* Error Display */}
        <ErrorDisplayBox 
          error={error}
          onRelink={() => spreadsheetUrl && handlers.handleRelinkSpreadsheet()}
          onCreateNew={() => {
            setDataManagementDefaultTab('upload');
            openDataDrawer('error_box_create_new');
          }}
          onRetry={handleRefreshData}
          onClear={clearError}
          showRelinkButton={!!spreadsheetUrl}
        />

        {/* Loading State */}
        {showLoadingState && <LoadingState isRefreshing={isRefreshing} />}

        {/* Dashboard Content */}
        {!showLoadingState && displayStats && (
          <>
            <DashboardControls
              lastDataRefresh={displayStats?.lastDataRefresh}
              baseCurrency={baseCurrency || 'USD'}
              hideTransfer={hideTransfer}
              onHideTransferChange={setHideTransfer}
              onConnectDataClick={() => openDataDrawer('controls_connect_data')}
              onHowItWorksClick={() => setIsHowItWorksOpen(true)}
              onManualRefresh={handlers.handleManualRefresh}
              spreadsheetName={spreadsheetName || null}
              showConnectDataButton={!isFirstTimeUser}
              showMonthlyReminder={!isFirstTimeUser && userToastStatus !== 'dismissed'}
              onSetMonthlyReminder={handlers.handleSetMonthlyReminder}
              isFirstTimeUser={isFirstTimeUser}
              isLoading={status === 'loading'}
              transactionCount={displayTransactions.length}
              status={status}
            />

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              transactionCount={displayTransactions.length}
              hasPortfolioData={!!displayAssetsData}
              isFirstTimeUser={isFirstTimeUser}
            />

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <DashboardStatistics 
                stats={displayStats} 
                filteredTransactions={displayTransactions} 
                isFirstTimeUser={isFirstTimeUser} 
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionTab 
                transactions={displayTransactions}
                isFirstTimeUser={isFirstTimeUser}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioTab 
                assetsData={displayAssetsData}
                isFirstTimeUser={isFirstTimeUser}
                isLoading={isLoading}
                error={error}
                onConnectDataClick={() => openDataDrawer('portfolio_tab_connect_data')}
              />
            )}

            {activeTab === 'ai-insights' && (
              <AIInsightsTab 
                stats={displayStats}
                isFirstTimeUser={isFirstTimeUser}
                onConnectDataClick={() => openDataDrawer('ai_insights_tab_connect_data')}
              />
            )}
          </>
        )}

        {/* No Data State */}
        {!showLoadingState && !displayStats && !isLoading && (
          <NoDataState
            spreadsheetLinked={spreadsheetLinked}
            isRefreshing={isRefreshing}
            onRefreshClick={async () => {
              await handlers.handleManualRefresh();
            }}
            onConnectGoogleSheetsClick={() => setIsHelpDrawerOpen(true)}
            onUploadBankDataClick={() => setIsHelpDrawerOpen(true)}
          />
        )}

        {/* Data Management Drawer */}
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={handlers.handleDataManagementDrawerClose}
          title="Connect Your Financial Data"
          size="large"
        >
          <DataManagementDrawer
            spreadsheetLinked={spreadsheetLinked}
            spreadsheetUrl={spreadsheetUrl || null}
            onSpreadsheetLinked={handlers.handleSpreadsheetLinked}
            onTransactionsFromGoogleSheets={handlers.handleTransactionsFromGoogleSheets}
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
            setIsHowItWorksOpen(false);
          }}
          title="How This Works"
          size="large"
        >
          <HowItWorksDrawer onClose={() => setIsHowItWorksOpen(false)} />
        </HelpDrawer>

        {/* Monthly Reminder Toast */}
        {!isFirstTimeUser && displayStats && (
          <MonthlyReminderToast 
            delay={10000} 
            onSetReminder={handlers.handleSetMonthlyReminder}
            userToastStatus={userToastStatus}
            onStatusUpdate={setUserToastStatus}
          />
        )}

        {/* Exit Survey */}
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

export default DashboardScreen; 