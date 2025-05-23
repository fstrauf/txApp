'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Button } from '@/components/ui/button';

const WelcomeScreen: React.FC = () => {
  const { nextScreen } = usePersonalFinanceStore();

  return (
    <div className="screen active p-8 md:p-12 min-h-[700px] flex flex-col justify-center items-center text-center">
      <div className="header mb-8">
        <div className="step-indicator text-gray-600 text-sm mb-2">Financial Health Check</div>
        <h1 className="title text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Get Your Money Sorted in 3 Minutes
        </h1>
        <p className="subtitle text-gray-600 text-lg md:text-xl">
          Answer a few quick questions and get personalized insights to improve your financial situation.
        </p>
      </div>

      <div className="my-10 mb-8">
        <div className="text-6xl mb-6">💰</div>
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm max-w-md mx-auto">
          <div className="font-semibold text-gray-700 mb-2">You&apos;ll discover:</div>
          <ul className="text-sm text-gray-600 list-none space-y-1 text-left">
            <li>✓ How you compare to other Kiwis</li>
            <li>✓ Your biggest money-saving opportunities</li>
            <li>✓ A personalized action plan</li>
            <li>✓ Timeline to reach your goals</li>
          </ul>
        </div>
      </div>

      <Button
        onClick={nextScreen}
      >
        Let&apos;s Get Started
      </Button>
      <div className="text-center mt-4">
        <small className="text-gray-500 text-xs">Takes 2-3 minutes • Your data stays private</small>
      </div>
    </div>
  );
};

export default WelcomeScreen;
