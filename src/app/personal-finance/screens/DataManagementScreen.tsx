// src/app/personal-finance/screens/DataManagementScreen.tsx
'use client';

import React from 'react';
import { Box } from '@/components/ui/Box';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import DataManagement from '../components/DataManagement';
import { ProFeatureTeaser } from '@/app/personal-finance/shared/ProFeatureTeaser';
import { LockClosedIcon, CircleStackIcon } from '@heroicons/react/24/outline';

const DataManagementScreen: React.FC = () => {
  const { goToScreen } = useScreenNavigation();
  const { trackNavigation } = usePersonalFinanceTracking({
    currentScreen: 'dataManagement',
    progress: 100 // Final screen in the flow
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 mb-6">
          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            Data Management
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-800">
          Manage Your Data
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your financial data is stored locally in your browser. Export, import, or clear your data as needed.
        </p>
      </div>

      {/* Info Section */}
      <Box variant="gradient" className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <LockClosedIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> Privacy & Storage
        </h2>
        <div className="space-y-3 text-gray-700">
          <p className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            All your data is stored locally in your browser - nothing is sent to any servers
          </p>
          <p className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            Data persists between browser sessions and page refreshes
          </p>
          <p className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            You can export your data anytime to backup or transfer to another device
          </p>
          <p className="flex items-start">
            <span className="text-blue-600 mr-2 mt-1">ℹ</span>
            Data is only accessible on this device/browser - clearing browser data will remove it
          </p>
        </div>
      </Box>

      {/* Pro Feature Teaser - Auto Sync */}
      <div className="mb-8">
        <ProFeatureTeaser 
          feature="auto-sync"
          context="Tired of manually uploading CSV files? Our Pro version automatically syncs with your bank accounts, keeping your data up-to-date in real-time. No more manual exports or imports!"
        />
      </div>

      {/* Data Management Component */}
      <DataManagement />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
        <button
          onClick={() => {
            trackNavigation('dataManagement', 'welcome', 'back');
            goToScreen('welcome');
          }}
          className="w-full sm:w-48 flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-indigo-700 font-medium transition-colors border border-gray-200 rounded-lg bg-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
        
        <div className="text-sm text-gray-500 text-center">
          Questions? Check our{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700 underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default DataManagementScreen;
