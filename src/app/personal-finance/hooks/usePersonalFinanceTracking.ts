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

  // Use refs to track previous values - prevents infinite loops
  const prevScreen = useRef<Screen | null>(null);
  const prevProgress = useRef<number>(-1);
  const prevUserDataRef = useRef({
    hasIncome: false,
    hasSpending: false,
    hasSavings: false,
    hasTransactions: false
  });

  // Extract stable boolean values - these are primitives, won't cause re-renders
  const hasIncome = Boolean(userData.income && userData.income > 0);
  const hasSpending = Boolean(userData.spending && userData.spending > 0);
  const hasSavings = Boolean(userData.savings && userData.savings > 0);
  const hasTransactions = Boolean(userData.transactions && userData.transactions.length > 0);

  // Track screen views only when something actually changes
  useEffect(() => {
    if (!posthog || !currentScreen) return;

    // Check if anything actually changed using primitive comparisons
    const screenChanged = currentScreen !== prevScreen.current;
    const progressChanged = progress !== prevProgress.current;
    const userDataChanged = 
      hasIncome !== prevUserDataRef.current.hasIncome ||
      hasSpending !== prevUserDataRef.current.hasSpending ||
      hasSavings !== prevUserDataRef.current.hasSavings ||
      hasTransactions !== prevUserDataRef.current.hasTransactions;

    // Only track if something meaningful changed
    if (screenChanged || progressChanged || userDataChanged) {
      // Update refs to current values
      prevScreen.current = currentScreen;
      prevProgress.current = progress;
      prevUserDataRef.current = { hasIncome, hasSpending, hasSavings, hasTransactions };

      // Track screen view with stable data
      posthog.capture('personal_finance_screen_view', {
        screen: currentScreen,
        progress_percentage: progress,
        has_income_data: hasIncome,
        has_spending_data: hasSpending,
        has_savings_data: hasSavings,
        has_transactions: hasTransactions,
        flow_position: currentScreen,
        timestamp: new Date().toISOString()
      });

      // Set user properties - only when they've actually changed
      posthog.setPersonProperties({
        'last_pf_screen': currentScreen,
        'pf_flow_progress': progress,
        'pf_has_completed_income': hasIncome,
        'pf_has_completed_spending': hasSpending,
        'pf_has_completed_savings': hasSavings
      });
    }
  }, [currentScreen, progress, hasIncome, hasSpending, hasSavings, hasTransactions, posthog]); // Only primitive dependencies

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
