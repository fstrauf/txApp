'use client';

import React, { useState } from 'react';
import { QuickAmountSelector } from '@/app/personal-finance/shared/QuickAmountSelector';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';
import { usePersonalFinanceStore } from '../../../store/personalFinanceStore';
import { Box } from '@/components/ui/Box';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { CreditCardIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const SpendingScreen: React.FC = () => {
  const { userData, updateSpending } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackFormCompletion, trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'spending', 
    progress: getProgress() 
  });
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
    
    // Track form completion
    trackFormCompletion('spending', {
      spending_amount: spendingValue,
      was_quick_select: spendingAmounts.includes(spendingValue),
      income_to_spending_ratio: userData.income ? spendingValue / userData.income : null,
      completion_time: new Date().toISOString()
    });
    
    goToScreen('savings');
  };

  const handleBack = () => {
    goToScreen('income');
  };

  const currentAmount = parseFloat(amount) || 0;
  const canContinue = currentAmount > 0;

  return (
    <div className="max-w-2xl mx-auto p-6 max-h-screen overflow-hidden">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <CreditCardIcon className="h-12 w-12 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          What do you spend monthly?
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Include everything: rent, groceries, entertainment, bills, and all other expenses.
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <CurrencyInput
          value={amount}
          onChange={handleAmountChange}
          placeholder="4,000"
          helperText="Enter your total monthly expenses"
        />
      </div>

      {/* Quick Amount Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick select</h3>
        <QuickAmountSelector
          amounts={spendingAmounts}
          selectedAmount={selectedQuickAmount}
          onSelect={handleQuickSelect}
        />
      </div>

      {/* Spending Categories Hint - Compact */}
      <Box variant="gradient" className="max-w-lg mx-auto mb-4">
        <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
          <LightBulbIcon className="h-4 w-4 text-indigo-600 mr-2" /> Common categories
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Housing & Rent
          </div>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Groceries & Food
          </div>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Transportation
          </div>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Utilities & Bills
          </div>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Entertainment
          </div>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            Shopping & Others
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          Don't worry about being exact - you can always adjust this later
        </p>
      </Box>

      {/* Navigation Buttons - Consistent at Bottom */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-6">
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
