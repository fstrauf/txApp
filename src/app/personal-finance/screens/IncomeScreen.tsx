'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { CurrencyInput, QuickAmountSelector, PrimaryButton } from '@/app/personal-finance/shared/FinanceComponents';

const IncomeScreen: React.FC = () => {
  const { nextScreen, prevScreen, updateIncome, userData } = usePersonalFinanceStore();
  
  const [income, setIncome] = useState<number | string>(userData.income || '');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(userData.income || null);

  const quickAmounts = [3000, 4000, 6000, 7000, 9000, 12000];

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
    updateIncome(amount);
    nextScreen();
  };

  const handleNext = () => {
    const incomeValue = typeof income === 'string' ? parseInt(income) || 0 : income;
    updateIncome(incomeValue);
    nextScreen();
  };

  const isValid = income && (typeof income === 'number' ? income > 0 : parseInt(income) > 0);

  return (
    <div className="max-w-2xl mx-auto p-8 min-h-[500px] flex flex-col bg-white">
      <div className="text-left mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          What's your monthly take-home income?
        </h2>
        <p className="text-base text-gray-500 mb-4">
          After tax, KiwiSaver, and student loan payments
        </p>
      </div>
      <div className="mb-6">
        <CurrencyInput
          value={income}
          onChange={handleIncomeChange}
          placeholder="5,000"
          label={undefined}
          helperText={undefined}
          className="mb-0"
        />
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick select</h3>
        <QuickAmountSelector
          amounts={quickAmounts}
          selectedAmount={selectedAmount}
          onSelect={handleQuickAmountSelect}
        />
      </div>
      <div className="flex flex-row justify-end gap-4 mt-auto">
        <PrimaryButton onClick={prevScreen} variant="secondary" className="w-32">
          Back
        </PrimaryButton>
        <PrimaryButton onClick={handleNext} disabled={!isValid} className="w-32">
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default IncomeScreen;