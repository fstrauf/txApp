'use client';

import React, { useState } from 'react';
import { QuickAmountSelector } from '@/app/personal-finance/shared/QuickAmountSelector';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';
import { usePersonalFinanceStore } from '../../../store/personalFinanceStore';
import { Box } from '@/components/ui/Box';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { CreditCardIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const SpendingScreen: React.FC = () => {
  const { userData, updateSpending } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const [amount, setAmount] = useState<string>(userData.spending?.toString() || '');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(userData.spending || null);

  // Use the same quick amounts and order as IncomeScreen
  const spendingAmounts = [0, 1000, 5000, 7000, 10000, 12000];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setSelectedQuickAmount(null);
  };

  const handleQuickSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setSelectedQuickAmount(selectedAmount);
  };

  const handleContinue = () => {
    const spendingValue = parseFloat(amount) || 0;
    updateSpending(spendingValue);
    goToScreen('savings');
  };

  const handleBack = () => {
    goToScreen('income');
  };

  const currentAmount = parseFloat(amount) || 0;
  const canContinue = currentAmount > 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <CreditCardIcon className="h-16 w-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          What do you spend monthly?
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Include everything: rent, groceries, entertainment, bills, and all other expenses.
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-8">
        <CurrencyInput
          value={amount}
          onChange={handleAmountChange}
          placeholder="4,000"
          helperText="Enter your total monthly expenses"
        />
      </div>

      {/* Quick Amount Selector */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick select</h3>
        <QuickAmountSelector
          amounts={spendingAmounts}
          selectedAmount={selectedQuickAmount}
          onSelect={handleQuickSelect}
        />
      </div>

      {/* Spending Categories Hint */}
      <Box variant="gradient" className="max-w-lg mx-auto mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <LightBulbIcon className="h-5 w-5 text-indigo-600 mr-2" /> Common spending categories
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Housing & Rent
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Groceries & Food
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Transportation
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Utilities & Bills
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Entertainment
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Shopping & Others
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 italic">
          Don't worry about being exact - you can always adjust this later
        </p>
      </Box>

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
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full sm:w-48 order-2 sm:order-2"
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SpendingScreen;
