'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Button } from '@/components/ui/button';

const IncomeScreen: React.FC = () => {
  const { nextScreen, prevScreen } = usePersonalFinanceStore();

  return (
    <div className="screen p-8 md:p-12 min-h-[700px] flex flex-col justify-center items-center text-center">
      <h1 className="text-2xl font-bold mb-4">Income Screen</h1>
      <p className="mb-8">This is the income screen. Content will be added here.</p>
      <div className="flex space-x-4">
        <Button onClick={prevScreen}>
          Back
        </Button>
        <Button onClick={nextScreen}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default IncomeScreen; 