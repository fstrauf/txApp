// src/app/personal-finance/screens/WelcomeScreen.tsx
'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/FinanceComponents';

const WelcomeScreen: React.FC = () => {
  const nextScreen = usePersonalFinanceStore((state) => state.nextScreen);

  return (
    <div className="flex flex-col items-center justify-center text-center p-12 md:p-16 min-h-screen">
      <div className="mb-12">
        <div className="text-sm text-gray-500 uppercase tracking-wider mb-4">Financial Health Check</div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Get Your Money Sorted in 3 Minutes
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Answer a few quick questions and get personalized insights to improve your financial situation
        </p>
      </div>

      <div className="my-16">
        <div className="text-8xl md:text-9xl mb-8">💰</div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl shadow-lg max-w-lg mx-auto border border-indigo-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">You&apos;ll discover:</h3>
          <ul className="text-base text-gray-600 space-y-3 text-left">
            {[
              "How you compare to other Kiwis",
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
        </div>
      </div>

      <PrimaryButton
        onClick={nextScreen}
        className="w-full max-w-sm mt-8"
      >
        Let&apos;s Get Started
      </PrimaryButton>
      
      <div className="text-center mt-6">
        <small className="text-sm text-gray-500">Takes 2-3 minutes • Your data stays private</small>
      </div>
    </div>
  );
};

export default WelcomeScreen;