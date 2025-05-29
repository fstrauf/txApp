// src/app/personal-finance/hooks/useScreenNavigation.ts
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { usePersonalFinanceTracking } from './usePersonalFinanceTracking';

// Define the screen flow order
const SCREEN_ORDER = [
  'welcome',
  'income', 
  'spending',
  'savings',
  'initialInsights',
  'spendingAnalysisUpload',
  'spendingAnalysisResults',
  'savingsAnalysisInput',
  'whatHappensNext',
  'progressSimulator',
  'dataManagement'
] as const;

export type Screen = typeof SCREEN_ORDER[number];

export const useScreenNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current screen from URL, default to 'welcome'
  const currentScreen = (searchParams.get('screen') as Screen) || 'welcome';
  
  // Get progress percentage
  const progress = Math.round(((SCREEN_ORDER.indexOf(currentScreen) + 1) / SCREEN_ORDER.length) * 100);
  
  // Initialize tracking
  const { trackNavigation } = usePersonalFinanceTracking({ currentScreen, progress });
  
  // Navigate to specific screen
  const goToScreen = useCallback((screen: Screen) => {
    trackNavigation(currentScreen, screen, 'direct');
    router.push(`?screen=${screen}`);
  }, [router, currentScreen, trackNavigation]);
  
  // Navigate to next screen in order
  const nextScreen = useCallback(() => {
    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    if (currentIndex < SCREEN_ORDER.length - 1) {
      const next = SCREEN_ORDER[currentIndex + 1];
      trackNavigation(currentScreen, next, 'next');
      goToScreen(next);
    }
  }, [currentScreen, goToScreen, trackNavigation]);
  
  // Navigate to previous screen in order
  const prevScreen = useCallback(() => {
    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    if (currentIndex > 0) {
      const prev = SCREEN_ORDER[currentIndex - 1];
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
    canGoNext: SCREEN_ORDER.indexOf(currentScreen) < SCREEN_ORDER.length - 1,
    canGoBack: SCREEN_ORDER.indexOf(currentScreen) > 0
  };
};
