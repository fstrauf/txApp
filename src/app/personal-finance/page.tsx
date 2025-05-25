// src/app/personal-finance/page.tsx
'use client';

import React from 'react';
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
    <div className="mb-10 bg-linear-to-br from-indigo-50 via-white to-purple-50 min-h-screen px-2 md:px-6 lg:px-12">
      {/* Progress Bar - Fixed Position */}
      <div className="max-w-6xl mx-auto pt-2 pb-0 px-2 md:px-0">
        <ProgressBar />
      </div>
      {/* Main Container - Matching Artifact */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-4 md:p-8">
          <div className="flex flex-col">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalFinancePage;