'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import ProgressBar from '@/app/personal-finance/shared/ProgressBar';
import WelcomeScreen from '@/app/personal-finance/screens/WelcomeScreen';
// We will import other screen components here as they are created, for example:
import IncomeScreen from '@/app/personal-finance/screens/IncomeScreen';

const PersonalFinancePage: React.FC = () => {
  const currentScreen = usePersonalFinanceStore((state) => state.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      // Add cases for other screens here as we build them
      case 'income':
        return <IncomeScreen />;
      default:
        // Fallback to WelcomeScreen or a loading indicator
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="container mx-auto max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden my-8 relative">
      <ProgressBar />
      <div className="min-h-screen"> {/* Adjust min-height as needed */}
        {renderScreen()}
      </div>
    </div>
  );
};

export default PersonalFinancePage;

