'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { QuickAmountSelector } from '@/app/personal-finance/shared/QuickAmountSelector';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';

const IncomeScreen: React.FC = () => {
  const { updateIncome, userData } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackFormCompletion, trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'income', 
    progress: getProgress() 
  });
  
  const [income, setIncome] = useState<string>(userData.income !== undefined && userData.income !== null ? String(userData.income) : '');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(userData.income || null);

  const quickAmounts = [3000, 4500, 6000, 7500, 9000, 12000];

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setIncome('');
      setSelectedAmount(null);
    } else {
      setIncome(value);
      const numValue = parseInt(value, 10);
      if (quickAmounts.includes(numValue)) {
        setSelectedAmount(numValue);
      } else {
        setSelectedAmount(null);
      }
    }
  };

  const handleQuickAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIncome(String(amount));
  };

  const handleNext = () => {
    const incomeValue = parseInt(income) || 0;
    updateIncome(incomeValue);
    goToScreen('spending');
  };

  const handleContinue = () => {
    const incomeValue = parseFloat(income) || 0;
    updateIncome(incomeValue);
    
    // Track form completion
    trackFormCompletion('income', {
      income_amount: incomeValue,
      was_quick_select: quickAmounts.includes(incomeValue),
      completion_time: new Date().toISOString()
    });
    
    goToScreen('spending');
  };

  const handleBack = () => {
    goToScreen('welcome');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col">
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

      {/* Navigation Buttons - Consistent at Bottom */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
        <PrimaryButton
          onClick={handleBack}
          variant="secondary"
          className="w-full sm:w-48 order-1 sm:order-1"
        >
          Back
        </PrimaryButton>
        <PrimaryButton
          onClick={handleNext}
          className="w-full sm:w-48 order-2 sm:order-2"
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};

export default IncomeScreen;