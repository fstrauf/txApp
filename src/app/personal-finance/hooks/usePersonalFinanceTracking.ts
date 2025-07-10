// src/app/personal-finance/hooks/usePersonalFinanceTracking.ts
'use client';

import { usePostHog } from 'posthog-js/react';
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Screen } from './useScreenNavigation';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';

export interface PersonalFinanceTrackingProps {
  currentScreen: Screen;
  progress: number;
}

export const usePersonalFinanceTracking = ({ currentScreen, progress }: PersonalFinanceTrackingProps) => {
  const posthog = usePostHog();
  const { userData } = usePersonalFinanceStore();

  // Use refs to prevent duplicate tracking calls
  const lastTrackedScreen = useRef<Screen | null>(null);
  const lastTrackedProgress = useRef<number>(-1);
  const lastUserDataHash = useRef<string>('');

  // Create stable user data properties to prevent infinite loops
  const stableUserData = useMemo(() => ({
    has_income_data: Boolean(userData.income && userData.income > 0),
    has_spending_data: Boolean(userData.spending && userData.spending > 0),
    has_savings_data: Boolean(userData.savings && userData.savings > 0),
    has_transactions: Boolean(userData.transactions && userData.transactions.length > 0)
  }), [
    !!userData.income && userData.income > 0,
    !!userData.spending && userData.spending > 0,
    !!userData.savings && userData.savings > 0,
    !!userData.transactions?.length
  ]);

  // Create a hash of the current state to detect real changes
  const currentStateHash = useMemo(() => {
    return `${currentScreen}-${progress}-${JSON.stringify(stableUserData)}`;
  }, [currentScreen, progress, stableUserData]);

  // Track screen views when screen changes - with duplicate prevention
  useEffect(() => {
    if (!posthog || !currentScreen) return;

    // Only track if something actually changed
    if (currentStateHash === lastUserDataHash.current) return;

    // Update tracking refs
    lastTrackedScreen.current = currentScreen;
    lastTrackedProgress.current = progress;
    lastUserDataHash.current = currentStateHash;

    // Track screen view
    posthog.capture('personal_finance_screen_view', {
      screen: currentScreen,
      progress_percentage: progress,
      ...stableUserData,
      flow_position: currentScreen,
      timestamp: new Date().toISOString()
    });

    // Set user properties - but only if they've actually changed
    posthog.setPersonProperties({
      'last_pf_screen': currentScreen,
      'pf_flow_progress': progress,
      'pf_has_completed_income': stableUserData.has_income_data,
      'pf_has_completed_spending': stableUserData.has_spending_data,
      'pf_has_completed_savings': stableUserData.has_savings_data
    });
  }, [currentStateHash, posthog]); // Only depend on the stable hash

  // Track specific actions within screens
  const trackAction = useCallback((action: string, properties: Record<string, any> = {}) => {
    if (posthog) {
      posthog.capture('personal_finance_action', {
        action,
        screen: currentScreen,
        progress_percentage: progress,
        ...properties,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, currentScreen, progress]);

  // Track form completions
  const trackFormCompletion = useCallback((formType: 'income' | 'spending' | 'savings', data: Record<string, any>) => {
    if (posthog) {
      posthog.capture('personal_finance_form_completed', {
        form_type: formType,
        screen: currentScreen,
        progress_percentage: progress,
        form_data: data,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, currentScreen, progress]);

  // Track email subscription
  const trackEmailSubscription = useCallback((email: string, features: string[], source: string) => {
    if (posthog) {
      posthog.capture('personal_finance_email_subscription', {
        email,
        interested_features: features,
        subscription_source: source,
        screen: currentScreen,
        progress_percentage: progress,
        user_income: userData.income,
        user_spending: userData.spending,
        user_savings: userData.savings,
        timestamp: new Date().toISOString()
      });

      // Set user properties for email subscribers
      posthog.setPersonProperties({
        'pf_email_subscriber': true,
        'pf_subscription_date': new Date().toISOString(),
        'pf_interested_features': features
      });
    }
  }, [posthog, currentScreen, progress, userData.income, userData.spending, userData.savings]);

  // Track file uploads
  const trackFileUpload = useCallback((fileType: string, fileName: string, fileSize: number) => {
    if (posthog) {
      posthog.capture('personal_finance_file_upload', {
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        screen: currentScreen,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, currentScreen]);

  // Track insights generation
  const trackInsightsGeneration = useCallback((insightType: string, success: boolean, insights?: any) => {
    if (posthog) {
      posthog.capture('personal_finance_insights_generated', {
        insight_type: insightType,
        success,
        insights_data: insights,
        screen: currentScreen,
        user_income: userData.income,
        user_spending: userData.spending,
        user_savings: userData.savings,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, currentScreen, userData.income, userData.spending, userData.savings]);

  // Track navigation events
  const trackNavigation = useCallback((from: Screen, to: Screen, method: 'next' | 'back' | 'direct') => {
    if (posthog) {
      posthog.capture('personal_finance_navigation', {
        from_screen: from,
        to_screen: to,
        navigation_method: method,
        progress_before: progress,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, progress]);

  // Track flow completion
  const trackFlowCompletion = useCallback(() => {
    if (posthog) {
      posthog.capture('personal_finance_flow_completed', {
        final_income: userData.income,
        final_spending: userData.spending,
        final_savings: userData.savings,
        completion_time: new Date().toISOString(),
        screens_visited: currentScreen // Could enhance to track all visited screens
      });

      // Set completion flag
      posthog.setPersonProperties({
        'pf_flow_completed': true,
        'pf_completion_date': new Date().toISOString()
      });
    }
  }, [posthog, userData.income, userData.spending, userData.savings, currentScreen]);

  // Track errors
  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    if (posthog) {
      posthog.capture('personal_finance_error', {
        error_message: error,
        screen: currentScreen,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }, [posthog, currentScreen]);

  return {
    trackAction,
    trackFormCompletion,
    trackEmailSubscription,
    trackFileUpload,
    trackInsightsGeneration,
    trackNavigation,
    trackFlowCompletion,
    trackError
  };
};
