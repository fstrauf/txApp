'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardHandlers } from '../hooks/useDashboardHandlers';
import { useAuthenticationBarrier } from '../hooks/useAuthenticationBarrier';
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

  // Use authentication barrier to prevent cascading effects during login
  const { isAuthenticated, isReady, session } = useAuthenticationBarrier();

  // Use modular state management
  const {
    session: _,
    status,
    isHelpDrawerOpen,
    setIsHelpDrawerOpen,
    isHowItWorksOpen,
    setIsHowItWorksOpen,
    activeTab,
    setActiveTab,
    dataManagementDefaultTab,
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
  const [pendingDrawerOpen, setPendingDrawerOpen] = useState(false);

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

  // Use modular handlers
  const handlers = useDashboardHandlers({
    isFirstTimeUser,
    status,
    spreadsheetUrl,
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

  // Default empty stats for when there's no data
  const emptyStats: DashboardStats = {
    monthlyAverageIncome: 0,
    monthlyAverageSavings: 0,
    monthlyAverageExpenses: 0,
    lastMonthExpenses: 0,
    lastMonthIncome: 0,
    lastMonthSavings: 0,
    annualExpenseProjection: 0,
    lastDataRefresh: new Date(),
    runwayMonths: 0,
    totalSavings: 0,
    savingsQuarter: 'Q1',
  };

  // Use mock data for first-time users (unless they've paid for snapshot), real data otherwise, or empty stats as fallback
  const displayStats = (isFirstTimeUser && !hasSnapshotSubscription) 
    ? mockStats 
    : (dashboardStats || emptyStats);
  const displayTransactions = (isFirstTimeUser && !hasSnapshotSubscription) ? mockTransactions : (filteredTransactions || []);
  const displayAssetsData = (isFirstTimeUser && !hasSnapshotSubscription) ? mockAssetsData : (assetsData || null);

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
              console.warn('Email mismatch - user can use app but not access paid snapshot');
            } else {
              console.warn('Failed to link payment to account:', errorData.error);
            }
          }
        } catch (linkError) {
          console.warn('Error linking payment to account:', linkError);
        }
      }
      
      // Grant access to Financial Snapshot
      setIsPaidSnapshot(true);
      
      if (!isOnboardingModalOpen) {
        setIsHelpDrawerOpen(true);
      } else {
        setPendingDrawerOpen(true);
      }
      
      posthog.capture('financial_snapshot_accessed', { 
        session_id: sessionId,
        user_authenticated: isAuthenticated,
        amount: verificationData.amount
      });
      
      setUserToastStatus('snapshot_ready');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_snapshot_session');
      }
      
    } catch (error) {
      console.error('Error handling snapshot success:', error);
      setUserToastStatus('snapshot_error');
    }
  };

  // Use refs to track what we've already processed
  const hasInitialized = useRef(false);
  const hasProcessedUrlParams = useRef(false);
  const hasProcessedMockData = useRef(false);

  // Single consolidated initialization effect - prevents cascading re-renders
  useEffect(() => {
    if (!isReady) return;

    // Skip if we've already initialized to prevent duplicate processing
    if (hasInitialized.current) return;

    const initializeDashboard = async () => {
      try {
        // 1. Handle A/B testing experiments first (only once)
        if (isFirstTimeUser && !isAuthenticated) {
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

        // 2. Handle URL params (only once per session)
        if (typeof window !== 'undefined' && !hasProcessedUrlParams.current) {
          const urlParams = new URLSearchParams(window.location.search);
          const sessionId = urlParams.get('session_id');
          
          // Handle successful snapshot purchase
          if (urlParams.get('snapshot') === 'success' && sessionId) {
            if (!session?.user) {
              localStorage.setItem('pending_snapshot_session', sessionId);
              setPendingSnapshotSessionId(sessionId);
              posthog.capture('snapshot_auth_required', {
                session_id: sessionId,
                action: 'payment_completed_auth_needed'
              });
              setIsOnboardingModalOpen(true);
            } else {
              await handleSnapshotSuccess(sessionId);
            }
            
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('snapshot');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
          }
          
          // Handle other URL params...
          if (urlParams.get('snapshot') === 'cancelled') {
            posthog.capture('financial_snapshot_purchase_cancelled', {
              user_authenticated: isAuthenticated
            });
            
            const url = new URL(window.location.href);
            url.searchParams.delete('snapshot');
            window.history.replaceState({}, '', url.toString());
          }
          
          if (urlParams.get('offer') === 'snapshot') {
            posthog.capture('financial_snapshot_offer_viewed', {
              source: 'blog_post_cta',
              user_authenticated: isAuthenticated
            });
            
            const url = new URL(window.location.href);
            url.searchParams.delete('offer');
            window.history.replaceState({}, '', url.toString());
          }
          
          hasProcessedUrlParams.current = true;
        }

        // 3. Handle post-authentication for paid snapshots
        if (session?.user && typeof window !== 'undefined') {
          const pendingSession = localStorage.getItem('pending_snapshot_session');
          if (pendingSession) {
            await handleSnapshotSuccess(pendingSession);
            localStorage.removeItem('pending_snapshot_session');
          }
        }

        // 4. Handle mock data population (only once per auth state change)
        if (!hasProcessedMockData.current) {
          const hasTransactions = userData.transactions && userData.transactions.length > 0;
          const hasMockData = userData.transactions?.some(t => t.id?.startsWith('mock-'));
          
          if (isFirstTimeUser && !hasTransactions) {
            // First-time user needs mock data
            processTransactionData(mockTransactions);
          } else if (!isFirstTimeUser && hasMockData) {
            // Authenticated user with mock data - clear it
            processTransactionData([]);
          }
          
          hasProcessedMockData.current = true;
        }

        hasInitialized.current = true;
        
      } catch (error) {
        console.error('Dashboard initialization error:', error);
      }
    };

    initializeDashboard();
    
  }, [isReady, isAuthenticated]); // Minimal dependencies - only what's needed for initialization

  // Reset processed flags when auth state changes significantly
  useEffect(() => {
    if (!isReady) return;
    
    // Reset mock data processing when auth state changes
    hasProcessedMockData.current = false;
    
    // Reset initialization when moving between authenticated states
    if (hasInitialized.current) {
      hasInitialized.current = false;
    }
     }, [isAuthenticated, isFirstTimeUser]);

  // Track dashboard screen view - ONLY when auth is ready
  useEffect(() => {
    if (!isReady) return;
    
    posthog.capture('pf_screen_viewed', {
      screen: 'dashboard',
      is_first_time_user: isFirstTimeUser,
      spreadsheet_linked: spreadsheetLinked,
      has_transactions: (displayTransactions?.length || 0) > 0,
      user_authenticated: isAuthenticated,
      transaction_count: displayTransactions?.length || 0,
    });
  }, [isReady, isFirstTimeUser, spreadsheetLinked, displayTransactions?.length, isAuthenticated]);

  // Track tab navigation - ONLY when auth is ready
  useEffect(() => {
    if (!isReady || !activeTab) return;
    
    posthog.capture('pf_navigation', {
      active_tab: activeTab,
      is_first_time_user: isFirstTimeUser,
      user_authenticated: isAuthenticated
    });
  }, [isReady, activeTab, isFirstTimeUser, isAuthenticated]);

  // Show loading state while authentication is stabilizing
  if (!isReady) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <LoadingState isRefreshing={false} />
        </div>
      </div>
    );
  }

  // Component handlers and UI remain the same...
  const openDataDrawer = (source: string) => {
    posthog.capture('pf_drawer_opened', {
      source: source,
      is_first_time_user: isFirstTimeUser,
      user_authenticated: isAuthenticated
    });
    
    // For first-time users, show the snapshot offer modal instead of onboarding
    if (isFirstTimeUser && !hasSnapshotSubscription) {
      setShowSnapshotOffer(true);
    } else {
      handlers.handleLinkSpreadsheet();
    }
  };

  const handleOnboardingComplete = async (sheetData?: { spreadsheetId: string; spreadsheetUrl: string }) => {
    const sessionId = pendingSnapshotSessionId || localStorage.getItem('pending_snapshot_session');
    if (sessionId) {
      await handleSnapshotSuccess(sessionId);
      setPendingSnapshotSessionId(null);
      localStorage.removeItem('pending_snapshot_session');
    }
    
    if (sheetData) {
      console.log('Sheet automatically created and linked:', sheetData);
    } else if (pendingDrawerOpen) {
      handlers.handleLinkSpreadsheet();
    } else {
      handlers.handleLinkSpreadsheet();
    }
    
    setIsOnboardingModalOpen(false);
    setTimeout(() => {
      setIsHelpDrawerOpen(true);
      setPendingDrawerOpen(false);
    }, 300);
    
    refetchStatus();
  };

  const handleMakeDashboardMine = () => {
    posthog.capture('make_dashboard_mine_clicked', {
      source: 'dashboard_cta',
      is_first_time_user: isFirstTimeUser,
      user_authenticated: isAuthenticated
    });
    
    if (isFirstTimeUser && !hasSnapshotSubscription) {
      setShowSnapshotOffer(true);
    } else {
      setIsOnboardingModalOpen(true);
    }
  };

  const handleSnapshotPurchase = async () => {
    posthog.capture('financial_snapshot_purchase_initiated', {
      source: 'modal_offer',
      user_authenticated: isAuthenticated
    });
    
    try {
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
      alert('Failed to start checkout. Please try again.');
    }
  };

  const handleFreeSheetDownload = () => {
    posthog.capture('free_sheet_downloaded', {
      source: 'snapshot_offer_modal',
      user_authenticated: isAuthenticated
    });
    
    setShowSnapshotOffer(false);
  };

  const showLoadingState = (isLoading && !dashboardStats && spreadsheetLinked && !isFirstTimeUser) || (isRefreshing && !error);

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
            openDataDrawer('error_box_create_new');
          }}
          onRetry={handleRefreshData}
          onClear={clearError}
          showRelinkButton={!!spreadsheetUrl}
        />

        {/* Loading State */}
        {showLoadingState && <LoadingState isRefreshing={isRefreshing} />}

        {/* Dashboard Content */}
        {!showLoadingState && (
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
        onClose={() => {
          setIsOnboardingModalOpen(false);
          if (pendingDrawerOpen) {
            setTimeout(() => {
              setIsHelpDrawerOpen(true);
              setPendingDrawerOpen(false);
            }, 300);
          }
        }}
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