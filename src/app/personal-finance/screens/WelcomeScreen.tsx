'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/FinanceComponents';

const WelcomeScreen: React.FC = () => {
  const nextScreen = usePersonalFinanceStore((state) => state.nextScreen);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 min-h-[calc(100vh-12rem)]">
      <div className="mb-8">
        <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Financial Health Check</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
          Get Your Money Sorted in 3 Minutes
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Answer a few quick questions and get personalized insights to improve your financial situation.
        </p>
      </div>

      <div className="my-8 md:my-10">
        <div className="text-7xl md:text-8xl mb-6">💰</div>
        <div className="bg-indigo-50 p-6 rounded-2xl shadow-lg max-w-md mx-auto border border-indigo-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">You&apos;ll discover:</h3>
          <ul className="text-sm text-gray-600 list-none space-y-2 text-left">
            {[
              "How you compare to other Kiwis",
              "Your biggest money-saving opportunities",
              "A personalized action plan",
              "Timeline to reach your goals"
            ].map((item, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PrimaryButton
        onClick={nextScreen}
        className="w-full max-w-xs mt-4 md:mt-6"
      >
        Let&apos;s Get Started
      </PrimaryButton>
      <div className="text-center mt-4">
        <small className="text-xs text-gray-500">Takes 2-3 minutes • Your data stays private</small>
      </div>
    </div>
  );
};

export default WelcomeScreen;
