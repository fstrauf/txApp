'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import ProgressBar from '@/app/personal-finance/shared/ProgressBar';
import WelcomeScreen from '@/app/personal-finance/screens/WelcomeScreen';
import IncomeScreen from '@/app/personal-finance/screens/IncomeScreen';
import { SpendingScreen } from '@/app/personal-finance/screens/SpendingScreen';
import { SavingsScreen } from '@/app/personal-finance/screens/SavingsScreen';
import InitialInsightsScreen from '@/app/personal-finance/screens/InitialInsightsScreen';
import SpendingAnalysisUploadScreen from '@/app/personal-finance/screens/SpendingAnalysisUploadScreen';

const PersonalFinancePage: React.FC = () => {
  const { currentScreen, nextScreen, prevScreen } = usePersonalFinanceStore();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'income':
        return <IncomeScreen />;
      case 'spending':
        return <SpendingScreen onNext={nextScreen} onBack={prevScreen} />;
      case 'savings':
        return <SavingsScreen onNext={nextScreen} onBack={prevScreen} />;
      case 'initialInsights':
        return <InitialInsightsScreen />;
      case 'spendingAnalysisUpload':
        return <SpendingAnalysisUploadScreen />;
      // Add more cases as we create more screens
      default:
        // Fallback to WelcomeScreen
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl p-8 shadow-xl overflow-hidden">
        <ProgressBar />
        <div className="min-h-[calc(100vh-10rem)]">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
};

export default PersonalFinancePage;

