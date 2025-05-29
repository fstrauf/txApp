// src/app/personal-finance/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useScreenNavigation } from '@/app/personal-finance/hooks/useScreenNavigation';
import ProgressBar from '@/app/personal-finance/shared/ProgressBar';
import { PersonalFinanceSidebar } from '@/app/personal-finance/components/PersonalFinanceSidebar';
import { Breadcrumbs } from '@/app/personal-finance/components/Breadcrumbs';
import WelcomeScreen from '@/app/personal-finance/screens/WelcomeScreen';
import IncomeScreen from '@/app/personal-finance/screens/IncomeScreen';
import SpendingScreen from '@/app/personal-finance/screens/SpendingScreen';
import SavingsScreen from '@/app/personal-finance/screens/SavingsScreen';
import InitialInsightsScreen from '@/app/personal-finance/screens/InitialInsightsScreen';
import SpendingAnalysisUploadScreen from '@/app/personal-finance/screens/SpendingAnalysisUploadScreen';
import SpendingAnalysisResultsScreen from '@/app/personal-finance/screens/SpendingAnalysisResultsScreen';
import SavingsAnalysisInputScreen from '@/app/personal-finance/screens/SavingsAnalysisInputScreen';
import DataManagementScreen from '@/app/personal-finance/screens/DataManagementScreen';
import WhatHappensNextScreen from '@/app/personal-finance/screens/WhatHappensNextScreen';
import ProgressSimulatorScreen from '@/app/personal-finance/screens/ProgressSimulatorScreen';
import { DataPersistenceIndicator } from '@/app/personal-finance/components/DataPersistenceIndicator';

const PersonalFinancePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen overflow-hidden">
        {/* Personal Finance Context-Aware Sidebar */}
        <PersonalFinanceSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col"> {/* ml-80 only on desktop */}
          <PersonalFinancePageContent />
        </div>
        
        {/* Data Persistence Indicator */}
        <DataPersistenceIndicator />
      </div>
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
      case 'whatHappensNext':
        return <WhatHappensNextScreen />;
      case 'progressSimulator':
        return <ProgressSimulatorScreen />;
      case 'dataManagement':
        return <DataManagementScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <Breadcrumbs />
        <ProgressBar />
      </div>
      <div className="px-4 pb-4">
        {renderScreen()}
      </div>
    </div>
  );
}

export default PersonalFinancePage;