// src/app/personal-finance/hooks/useScreenNavigation.ts
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

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
  'savingsAnalysisResults',
  'dataManagement'
] as const;

export type Screen = typeof SCREEN_ORDER[number];

export const useScreenNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current screen from URL, default to 'welcome'
  const currentScreen = (searchParams.get('screen') as Screen) || 'welcome';
  
  // Navigate to specific screen
  const goToScreen = useCallback((screen: Screen) => {
    router.push(`?screen=${screen}`);
  }, [router]);
  
  // Navigate to next screen in order
  const nextScreen = useCallback(() => {
    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    if (currentIndex < SCREEN_ORDER.length - 1) {
      const next = SCREEN_ORDER[currentIndex + 1];
      goToScreen(next);
    }
  }, [currentScreen, goToScreen]);
  
  // Navigate to previous screen in order
  const prevScreen = useCallback(() => {
    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    if (currentIndex > 0) {
      const prev = SCREEN_ORDER[currentIndex - 1];
      goToScreen(prev);
    }
  }, [currentScreen, goToScreen]);
  
  // Get progress percentage based on screen order
  const getProgress = useCallback(() => {
    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    return Math.round(((currentIndex + 1) / SCREEN_ORDER.length) * 100);
  }, [currentScreen]);
  
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
