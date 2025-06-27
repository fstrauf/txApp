import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { useScreenNavigation } from './useScreenNavigation';
import { usePersonalFinanceTracking } from './usePersonalFinanceTracking';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';

interface UseDashboardHandlersProps {
  isFirstTimeUser: boolean;
  status: string;
  spreadsheetUrl?: string | null;
  setDataManagementDefaultTab: (tab: 'manage' | 'upload' | 'validate' | 'settings') => void;
  setIsHelpDrawerOpen: (open: boolean) => void;
  setIsHowItWorksOpen: (open: boolean) => void;
  setShowExitSurvey: (show: boolean) => void;
  handleRefreshData: () => Promise<void>;
  clearError: () => void;
  refetchStatus: () => void;
  spreadsheetLinked: boolean;
  userData: any;
}

export const useDashboardHandlers = ({
  isFirstTimeUser,
  status,
  spreadsheetUrl,
  setDataManagementDefaultTab,
  setIsHelpDrawerOpen,
  setIsHowItWorksOpen,
  setShowExitSurvey,
  handleRefreshData,
  clearError,
  refetchStatus,
  spreadsheetLinked,
  userData,
}: UseDashboardHandlersProps) => {
  const router = useRouter();
  const { processTransactionData, updateSpreadsheetInfo } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'dashboard', 
    progress: getProgress() 
  });
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  // Check if user has uploaded any data in this session
  const hasUploadedDataInSession = () => {
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
      user_authenticated: status === 'authenticated'
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
      return;
    }

    if (status === 'unauthenticated') {
      trackAction('redirect_to_login_from_dashboard', {
        source: 'make_this_my_dashboard_button'
      });
      
      const callbackUrl = encodeURIComponent('/personal-finance');
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

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
      user_authenticated: status === 'authenticated',
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
      user_authenticated: status === 'authenticated'
    });
    
    updateSpreadsheetInfo(data.spreadsheetId, data.spreadsheetUrl);
    refetchStatus();
    setIsHelpDrawerOpen(false);
  };

  const handleTransactionsFromGoogleSheets = async (transactions: any[]) => {
    const hasCategoryPredictions = transactions.some(t => t.predicted_category || t.confidence !== undefined);
    
    if (hasCategoryPredictions) {
      setIsHelpDrawerOpen(false);
      
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
      
      processTransactionData(transactions);
      goToScreen('transactionValidation');
      
    } else {
      processTransactionData(transactions);
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
    }
  };

  const handleManualRefresh = async () => {
    trackAction('refresh_data_clicked', {
      has_existing_data: true, // Will be passed from parent
      has_spreadsheet_url: !!spreadsheetUrl
    });

    posthog.capture('dashboard_manual_refresh_clicked', {
      has_existing_data: true, // Will be passed from parent
      has_spreadsheet_url: !!spreadsheetUrl,
      is_first_time_user: isFirstTimeUser,
      transaction_count: 0 // Will be passed from parent
    });

    await handleRefreshData();
  };

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

      const accessToken = await requestSpreadsheetAccess();
      console.log('✅ Re-authentication successful, access token obtained');

      const response = await fetch('/api/dashboard/link-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Spreadsheet re-linked successfully');
        
        updateSpreadsheetInfo(data.spreadsheetId, data.spreadsheetUrl);
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

  return {
    handleDataManagementDrawerClose,
    handleLinkSpreadsheet,
    handleSetMonthlyReminder,
    handleSpreadsheetLinked,
    handleTransactionsFromGoogleSheets,
    handleManualRefresh,
    handleRelinkSpreadsheet,
  };
}; 