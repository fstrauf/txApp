// src/app/personal-finance/page.tsx
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
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Progress Bar - Fixed Position */}
      <ProgressBar />
      
      {/* Main Container - Matching Artifact */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-screen">
          <div className="min-h-screen flex flex-col">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalFinancePage;