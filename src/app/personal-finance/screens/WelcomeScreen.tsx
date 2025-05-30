// src/app/personal-finance/screens/WelcomeScreen.tsx
'use client';

import React from 'react';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';

const WelcomeScreen: React.FC = () => {
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'welcome', 
    progress: getProgress() 
  });

  const handleGetStarted = () => {
    trackAction('welcome_started', {
      entry_point: 'welcome_screen',
      timestamp: new Date().toISOString()
    });
    goToScreen('income');
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-1 md:p-2">
      <div className="mb-12">
        <div className="text-sm text-gray-500 uppercase tracking-wider mb-4">Financial Health Check</div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Get Your Money Sorted in 3 Minutes
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Answer a few quick questions and get personalized insights to improve your financial situation
        </p>
      </div>

      <div className="my-8">
        {/* <div className="bg-linear-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl shadow-lg max-w-lg mx-auto border border-indigo-100"> */}
        <Box variant="gradient" className="max-w-lg mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">You'll discover:</h3>
        <ul className="text-base text-gray-600 space-y-3 text-left">
          {[
            "How you compare to other people",
            "Your biggest money-saving opportunities", 
            "A personalized action plan",
            "Timeline to reach your goals"
          ].map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="text-green-500 mr-3 text-lg">✓</span>
              {item}
            </li>
          ))}
          </ul>
      </Box>
        {/* </div> */}
      </div>

      <PrimaryButton
        onClick={handleGetStarted}
        className="w-full max-w-sm mt-8"
      >
        Let&apos;s Get Started
      </PrimaryButton>
      
      <div className="text-center mt-6">
        <small className="text-sm text-gray-500">
          Takes 2-3 minutes • Your data stays private
        </small>
        <div className="mt-3">
          <button
            onClick={() => goToScreen('dataManagement')}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Manage stored data
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;