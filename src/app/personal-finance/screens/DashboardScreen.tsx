'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardHandlers } from '../hooks/useDashboardHandlers';
import { DashboardStats } from '../utils/dashboardStats';
import { Header } from '@/components/ui/Header';
import DataManagementDrawer from '../components/DataManagementDrawer';
import HowItWorksDrawer from '../components/HowItWorksDrawer';
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
import { StickyBottomBar } from '../components/dashboard/StickyBottomBar';
import { OnboardingModal } from '../components/dashboard/OnboardingModal';
import { FinancialSnapshotModal } from '../components/dashboard/FinancialSnapshotModal';
import { FinancialSnapshotOfferModal } from '../components/dashboard/FinancialSnapshotOfferModal';
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus';
import SnapshotPurchaseToast from '../components/SnapshotPurchaseToast';

const DashboardScreen: React.FC = () => {
  const { userData, processTransactionData } = usePersonalFinanceStore();
  const { baseCurrency, spreadsheetName } = useConsolidatedSpreadsheetData();
  const router = useRouter();

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

  // Onboarding modal state
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Financial Snapshot state
  const [isPaidSnapshot, setIsPaidSnapshot] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [showSnapshotOffer, setShowSnapshotOffer] = useState(false);
  const [pendingSnapshotSessionId, setPendingSnapshotSessionId] = useState<string | null>(null);

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

  // Get subscription status
  const { subscriptionDetails, isLoading: isLoadingSubscription } = useSubscriptionStatus();

  // Check if user has a SNAPSHOT subscription
  const hasSnapshotSubscription = subscriptionDetails?.subscriptionPlanName === 'SNAPSHOT';

  // Debug logging
  console.log('Dashboard state:', {
    isFirstTimeUser,
    hasSnapshotSubscription,
    subscriptionPlan: subscriptionDetails?.subscriptionPlanName,
    subscriptionDetails,
    isLoadingSubscription
  });

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

  // Use mock data for first-time users (unless they've paid for snapshot), real data otherwise
  const displayStats = (isFirstTimeUser && !hasSnapshotSubscription) ? mockStats : dashboardStats;
  const displayTransactions = (isFirstTimeUser && !hasSnapshotSubscription) ? mockTransactions : filteredTransactions;
  const displayAssetsData = (isFirstTimeUser && !hasSnapshotSubscription) ? mockAssetsData : assetsData;

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

  // Check URL params for financial snapshot success or offer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      // Handle successful snapshot purchase
      if (urlParams.get('snapshot') === 'success' && sessionId) {
        // Check if user is authenticated
        if (!session?.user) {
          // Store the session ID for after auth
          localStorage.setItem('pending_snapshot_session', sessionId);
          setPendingSnapshotSessionId(sessionId);
          
          // Show authentication needed message
          posthog.capture('snapshot_auth_required', {
            session_id: sessionId,
            action: 'payment_completed_auth_needed'
          });
          
          // Show onboarding modal instead of toast for better UX
          setIsOnboardingModalOpen(true);
        } else {
          // Already authenticated, proceed with snapshot access
          handleSnapshotSuccess(sessionId);
        }
        
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('snapshot');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      }
      
      // Handle cancelled snapshot purchase
      if (urlParams.get('snapshot') === 'cancelled') {
        posthog.capture('financial_snapshot_purchase_cancelled', {
          user_authenticated: !!session?.user?.id
        });
        
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('snapshot');
        window.history.replaceState({}, '', url.toString());
      }
      
      // Handle snapshot offer from blog posts
      if (urlParams.get('offer') === 'snapshot') {
        // Show financial snapshot offer (scroll to it or highlight it)
        posthog.capture('financial_snapshot_offer_viewed', {
          source: 'blog_post_cta',
          user_authenticated: !!session?.user?.id
        });
        
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('offer');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [setDataManagementDefaultTab, setIsHelpDrawerOpen, session?.user?.id]);

  // Handle post-authentication for paid snapshots
  useEffect(() => {
    if (session?.user && typeof window !== 'undefined') {
      const pendingSession = localStorage.getItem('pending_snapshot_session');
      if (pendingSession) {
        handleSnapshotSuccess(pendingSession);
        localStorage.removeItem('pending_snapshot_session');
      }
    }
  }, [session?.user]);

  // Helper function to handle successful snapshot access
  const handleSnapshotSuccess = async (sessionId: string) => {
    try {
      // First verify the payment
      const verifyResponse = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`);
      
      if (!verifyResponse.ok) {
        console.error('Failed to verify payment');
        setUserToastStatus('payment_verification_failed');
        return;
      }
      
      const verificationData = await verifyResponse.json();
      
      if (!verificationData.paid) {
        console.error('Payment not completed');
        setUserToastStatus('payment_not_completed');
        return;
      }
      
      // If user is authenticated, link the payment to their account
      if (session?.user?.id) {
        try {
          const linkResponse = await fetch('/api/stripe/link-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });
          
          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            console.log('Payment successfully linked to user account', linkData);
                     } else {
             const errorData = await linkResponse.json();
             if (errorData.error?.includes('Email mismatch')) {
               setUserToastStatus('email_mismatch');
               // Don't return - let them use the app normally, just without paid access
               console.warn('Email mismatch - user can use app but not access paid snapshot');
             } else {
               console.warn('Failed to link payment to account:', errorData.error);
             }
             // Continue anyway - they can use the app normally
           }
        } catch (linkError) {
          console.warn('Error linking payment to account:', linkError);
          // Continue anyway - they have a valid payment
        }
      }
      
      // Grant access to Financial Snapshot
      setIsPaidSnapshot(true);
      setDataManagementDefaultTab('upload');
      setIsHelpDrawerOpen(true);
      
      // Track successful snapshot access
      posthog.capture('financial_snapshot_accessed', { 
        session_id: sessionId,
        user_authenticated: !!session?.user?.id,
        amount: verificationData.amount
      });
      
      // Clear any auth needed status
      setUserToastStatus('snapshot_ready');
      
      // Clear the session ID after successful processing
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_snapshot_session');
      }
      
    } catch (error) {
      console.error('Error handling snapshot success:', error);
      setUserToastStatus('snapshot_error');
    }
  };

  const showLoadingState = (isLoading && !dashboardStats && spreadsheetLinked && !isFirstTimeUser) || (isRefreshing && !error);

  const openDataDrawer = (source: string) => {
    posthog.capture('pf_drawer_opened', {
      source: source,
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id
    });
    
    // For first-time users, show the snapshot offer modal instead of onboarding
    // But only if they don't already have a snapshot subscription
    if (isFirstTimeUser && !hasSnapshotSubscription) {
      setShowSnapshotOffer(true);
    } else {
      // For existing users, open the data drawer directly
      setDataManagementDefaultTab('manage');
      handlers.handleLinkSpreadsheet();
    }
  };

  const handleOnboardingComplete = async (sheetData?: { spreadsheetId: string; spreadsheetUrl: string }) => {
    // If this was a post-purchase signup, verify and link the payment
    const sessionId = pendingSnapshotSessionId || localStorage.getItem('pending_snapshot_session');
    if (sessionId) {
      await handleSnapshotSuccess(sessionId);
      setPendingSnapshotSessionId(null);
      localStorage.removeItem('pending_snapshot_session');
    }
    
    // After onboarding is complete, open the data management drawer
    if (sheetData) {
      console.log('Sheet automatically created and linked:', sheetData);
      setDataManagementDefaultTab('upload');
    } else {
      setDataManagementDefaultTab('manage');
    }
    setIsHelpDrawerOpen(true);
    // Refetch dashboard status so isFirstTimeUser is updated
    refetchStatus();
  };

  const handleMakeDashboardMine = () => {
    posthog.capture('make_dashboard_mine_clicked', {
      source: 'dashboard_cta',
      is_first_time_user: isFirstTimeUser,
      user_authenticated: !!session?.user?.id
    });
    
    // Show Financial Snapshot offer modal for first-time users
    // But only if they don't already have a snapshot subscription
    if (isFirstTimeUser && !hasSnapshotSubscription) {
      setShowSnapshotOffer(true);
    } else {
      // For existing users, open onboarding/data management
      setIsOnboardingModalOpen(true);
    }
  };

  // Handle snapshot purchase
  const handleSnapshotPurchase = async () => {
    posthog.capture('financial_snapshot_purchase_initiated', {
      source: 'modal_offer',
      user_authenticated: !!session?.user?.id
    });
    
    try {
      // Use the main Stripe checkout endpoint - no auth required for one-time purchases
      const currentPath = window.location.pathname;
      const response = await fetch(`/api/stripe/checkout?plan=snapshot&billing=one-time&redirect=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating snapshot checkout:', error);
      // You could show a toast notification here
      alert('Failed to start checkout. Please try again.');
    }
  };

  // Handle free sheet download
  const handleFreeSheetDownload = () => {
    posthog.capture('free_sheet_downloaded', {
      source: 'snapshot_offer_modal',
      user_authenticated: !!session?.user?.id
    });
    
    // Close the modal and show a success message
    setShowSnapshotOffer(false);
    // Could add a toast notification here if you have one
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <div className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16 w-full ${isFirstTimeUser ? 'pb-32' : ''}`}>
        {/* Only show header for existing users with data */}
        {!isFirstTimeUser && (
          <Header variant="centered" size="xl" className="mb-8 sm:mb-12 lg:mb-16">
            Get instant Clarity On Your Finances
          </Header>
         )}

        {/* Demo Banner for First-Time Users */}
        {isFirstTimeUser && (
          <div>
          <DemoBanner
            headlineText={getHeadlineText()}
            ctaButtonText={getCtaButtonText()}
            onCtaClick={handleMakeDashboardMine}
            onHowItWorksClick={() => setIsHowItWorksOpen(true)}
            isLoading={status === 'loading'}
          />
             <div className="max-w-4xl mx-auto mb-16">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl"></div>
          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-primary/20 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="animate-bounce">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Check out the dashboard
                </span>{" "}
                with demo data below
              </h3>
              
              <p className="text-lg text-gray-600 mb-6">
                See exactly what your financial freedom dashboard will look like
              </p>
              
              <div className="animate-pulse">
                <svg 
                  className="w-8 h-8 text-primary mx-auto animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
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
                isPaidSnapshot={hasSnapshotSubscription}
                hasSubscription={subscriptionDetails?.hasAnyActiveAccess || false}
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
          onClose={() => {
            posthog.capture('pf_drawer_closed', {
              drawer_type: 'data_management',
              is_first_time_user: isFirstTimeUser
            });
            handlers.handleDataManagementDrawerClose();
          }}
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
            posthog.capture('pf_drawer_closed', {
              drawer_type: 'how_it_works',
              is_first_time_user: isFirstTimeUser
            });
            setIsHowItWorksOpen(false);
          }}
          title="How This Works"
          size="large"
        >
          <HowItWorksDrawer onClose={() => setIsHowItWorksOpen(false)} />
        </HelpDrawer>


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

      {/* Sticky Bottom Bar - Only for first-time users */}
      <StickyBottomBar
        onGetStartedClick={handleMakeDashboardMine}
        onWatchDemoClick={() => setIsHowItWorksOpen(true)}
        isFirstTimeUser={isFirstTimeUser}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onSignupComplete={handleOnboardingComplete}
        isPaidSnapshot={!!pendingSnapshotSessionId}
      />

      {/* Financial Snapshot Offer Modal */}
      <FinancialSnapshotOfferModal
        isOpen={showSnapshotOffer}
        onClose={() => setShowSnapshotOffer(false)}
        onPurchaseSnapshot={handleSnapshotPurchase}
        onGetFreeSheet={handleFreeSheetDownload}
      />

      {/* Financial Snapshot Modal */}
      <FinancialSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
      />

      {/* Snapshot Purchase Toast */}
      <SnapshotPurchaseToast
        userToastStatus={userToastStatus}
        onStatusUpdate={setUserToastStatus}
      />
    </div>
  );
};

export default DashboardScreen;