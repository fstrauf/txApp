'use client';

import React, { useState } from 'react';
import { QuickAmountSelector } from '@/app/personal-finance/shared/QuickAmountSelector';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { usePersonalFinanceStore } from '../../../store/personalFinanceStore';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';
import { Box } from '@/components/ui/Box';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { BanknotesIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const SavingsScreen: React.FC = () => {
  const { userData, updateSavings } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackFormCompletion, trackFlowCompletion } = usePersonalFinanceTracking({ 
    currentScreen: 'savings', 
    progress: getProgress() 
  });
  const [amount, setAmount] = useState<string>(userData.savings?.toString() || '');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(userData.savings || null);

  // Savings-specific quick amounts (various levels, same order as IncomeScreen)
  const savingsAmounts = [0, 1000, 5000, 10000, 25000, 50000];

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
    const savingsValue = parseFloat(amount) || 0;
    updateSavings(savingsValue);
    
    // Track form completion and potential flow completion
    trackFormCompletion('savings', {
      savings_amount: savingsValue,
      was_quick_select: savingsAmounts.includes(savingsValue),
      savings_rate: userData.income ? (savingsValue / (userData.income * 12)) * 100 : null,
      completion_time: new Date().toISOString()
    });
    
    // Track completion of core data collection flow
    trackFlowCompletion();
    
    goToScreen('initialInsights');
  };

  const handleBack = () => {
    goToScreen('spending');
  };

  const canContinue = true; // Allow 0 savings

  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <BanknotesIcon className="h-16 w-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          How much do you have saved?
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Include your emergency fund, savings accounts, and easily accessible investments.
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-8">
        <CurrencyInput
          value={amount}
          onChange={handleAmountChange}
          placeholder="10,000"
          helperText="Total current savings and emergency funds"
          className="mb-0"
        />
      </div>

      {/* Quick Amount Selector */}
      <div className="mb-12 flex-1">
        <QuickAmountSelector
          amounts={savingsAmounts}
          selectedAmount={selectedQuickAmount}
          onSelect={handleQuickSelect}
        />
      </div>

      {/* Savings Tips */}
      <Box variant="gradient" className="max-w-lg mx-auto mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <LightBulbIcon className="h-5 w-5 text-indigo-600 mr-2" /> What counts as savings?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Emergency fund
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            High-yield savings
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Term deposits
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Conservative investments
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Cash in checking accounts
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Money market funds
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 italic">
          Don't include retirement accounts or long-term investments that are hard to access
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
          className="w-full sm:w-48 order-2 sm:order-2"
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SavingsScreen;
