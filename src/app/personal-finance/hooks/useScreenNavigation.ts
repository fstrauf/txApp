// src/app/personal-finance/hooks/useScreenNavigation.ts
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { usePersonalFinanceTracking } from './usePersonalFinanceTracking';

// Define the step flow order (excluding dashboard which is separate)
const STEP_FLOW_ORDER = [
  'welcome',
  'income', 
  'spending',
  'savings',
  'initialInsights',
  'spendingAnalysisUpload',
  'transactionValidation',
  'spendingAnalysisResults',
  'savingsAnalysisInput',
  'whatHappensNext',
  'progressSimulator',
  'dataManagement'
] as const;

// All possible screens (including dashboard)
const ALL_SCREENS = ['dashboard', ...STEP_FLOW_ORDER] as const;

export type Screen = typeof ALL_SCREENS[number];

export const useScreenNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current screen from URL, default to 'dashboard'
  const currentScreen = (searchParams.get('screen') as Screen) || 'dashboard';
  
  // Get progress percentage (only for step flow screens, not dashboard)
  const stepIndex = STEP_FLOW_ORDER.indexOf(currentScreen as any);
  const progress = stepIndex >= 0 ? Math.round(((stepIndex + 1) / STEP_FLOW_ORDER.length) * 100) : 0;
  
  // Initialize tracking
  const { trackNavigation } = usePersonalFinanceTracking({ currentScreen, progress });
  
  // Navigate to specific screen
  const goToScreen = useCallback((screen: Screen) => {
    trackNavigation(currentScreen, screen, 'direct');
    router.push(`?screen=${screen}`);
  }, [router, currentScreen, trackNavigation]);
  
  // Navigate to next screen in step flow order
  const nextScreen = useCallback(() => {
    const currentIndex = STEP_FLOW_ORDER.indexOf(currentScreen as any);
    if (currentIndex >= 0 && currentIndex < STEP_FLOW_ORDER.length - 1) {
      const next = STEP_FLOW_ORDER[currentIndex + 1];
      trackNavigation(currentScreen, next, 'next');
      goToScreen(next);
    }
  }, [currentScreen, goToScreen, trackNavigation]);
  
  // Navigate to previous screen in step flow order
  const prevScreen = useCallback(() => {
    const currentIndex = STEP_FLOW_ORDER.indexOf(currentScreen as any);
    if (currentIndex > 0) {
      const prev = STEP_FLOW_ORDER[currentIndex - 1];
      trackNavigation(currentScreen, prev, 'back');
      goToScreen(prev);
    }
  }, [currentScreen, goToScreen, trackNavigation]);
  
  // Get progress percentage based on screen order
  const getProgress = useCallback(() => {
    return progress;
  }, [progress]);
  
  return {
    currentScreen,
    goToScreen,
    nextScreen,
    prevScreen,
    getProgress,
    canGoNext: STEP_FLOW_ORDER.indexOf(currentScreen as any) < STEP_FLOW_ORDER.length - 1,
    canGoBack: STEP_FLOW_ORDER.indexOf(currentScreen as any) > 0
  };
};
