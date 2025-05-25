// src/app/personal-finance/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useScreenNavigation } from '@/app/personal-finance/hooks/useScreenNavigation';
import ProgressBar from '@/app/personal-finance/shared/ProgressBar';
import WelcomeScreen from '@/app/personal-finance/screens/WelcomeScreen';
import IncomeScreen from '@/app/personal-finance/screens/IncomeScreen';
import SpendingScreen from '@/app/personal-finance/screens/SpendingScreen';
import SavingsScreen from '@/app/personal-finance/screens/SavingsScreen';
import InitialInsightsScreen from '@/app/personal-finance/screens/InitialInsightsScreen';
import SpendingAnalysisUploadScreen from '@/app/personal-finance/screens/SpendingAnalysisUploadScreen';
import SpendingAnalysisResultsScreen from '@/app/personal-finance/screens/SpendingAnalysisResultsScreen';
import SavingsAnalysisInputScreen from '@/app/personal-finance/screens/SavingsAnalysisInputScreen';
import SavingsAnalysisResultsScreen from '@/app/personal-finance/screens/SavingsAnalysisResultsScreen';

const PersonalFinancePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PersonalFinancePageContent />
    </Suspense>
  );
};

function PersonalFinancePageContent() {
  const { currentScreen } = useScreenNavigation();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'income':
        return <IncomeScreen />;
      case 'spending':
        return <SpendingScreen />;
      case 'savings':
        return <SavingsScreen />;
      case 'initialInsights':
        return <InitialInsightsScreen />;
      case 'spendingAnalysisUpload':
        return <SpendingAnalysisUploadScreen />;
      case 'spendingAnalysisResults':
        return <SpendingAnalysisResultsScreen />;
      case 'savingsAnalysisInput':
        return <SavingsAnalysisInputScreen />;
      case 'savingsAnalysisResults':
        return <SavingsAnalysisResultsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <>
      <ProgressBar />
      {renderScreen()}
    </>
  );
}

export default PersonalFinancePage;