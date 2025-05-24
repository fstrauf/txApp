// src/app/personal-finance/screens/IncomeScreen.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { QuickAmountSelector } from '@/app/personal-finance/shared/QuickAmountSelector';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';

const IncomeScreen: React.FC = () => {
  const { nextScreen, prevScreen, updateIncome, userData } = usePersonalFinanceStore();
  
  const [income, setIncome] = useState<number | string>(userData.income || '');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(userData.income || null);

  const quickAmounts = [3000, 4500, 6000, 7500, 9000, 12000];

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setIncome('');
      setSelectedAmount(null);
    } else {
      const numValue = parseInt(value, 10);
      setIncome(numValue);
      if (quickAmounts.includes(numValue)) {
        setSelectedAmount(numValue);
      } else {
        setSelectedAmount(null);
      }
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIncome(amount);
  };

  const handleNext = () => {
    const incomeValue = typeof income === 'string' ? parseInt(income) || 0 : income;
    updateIncome(incomeValue);
    nextScreen();
  };

  const isValid = income && (typeof income === 'number' ? income > 0 : parseInt(income) > 0);

  return (
    <div className="max-w-4xl mx-auto p-12 min-h-[600px] flex flex-col">
      {/* Header Section - Matching Artifact */}
      <div className="text-center mb-10">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Question 1 of 3</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          What's your monthly take-home income?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          After tax, KiwiSaver, and student loan payments
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-10">
        <CurrencyInput
          value={income}
          onChange={handleIncomeChange}
          placeholder="4,500"
          className="mb-0"
        />
      </div>

      {/* Quick Amount Selector */}
      <div className="mb-12 flex-1">
        <QuickAmountSelector
          amounts={quickAmounts}
          selectedAmount={selectedAmount}
          onSelect={handleQuickAmountSelect}
        />
      </div>

      {/* Navigation Buttons - Fixed styling */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-auto">
        <PrimaryButton 
          onClick={prevScreen} 
          variant="secondary" 
          className="w-full sm:w-32 order-2 sm:order-1"
        >
          Back
        </PrimaryButton>
        <PrimaryButton 
          onClick={handleNext} 
          disabled={!isValid} 
          className="w-full sm:w-32 order-1 sm:order-2"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default IncomeScreen;