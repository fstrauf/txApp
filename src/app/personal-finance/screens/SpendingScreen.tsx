'use client';

import React, { useState, useEffect } from 'react';
import { QuickAmountSelector, PrimaryButton } from '../shared/FinanceComponents';
import { CurrencyInput } from '../shared/CurrencyInput';
import { usePersonalFinanceStore } from '../../../store/personalFinanceStore';

interface SpendingScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const SpendingScreen: React.FC<SpendingScreenProps> = ({ onNext, onBack }) => {
  const { userData, updateSpending } = usePersonalFinanceStore();
  const [amount, setAmount] = useState<string>(userData.spending?.toString() || '');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(userData.spending || null);

  // Use the same quick amounts and order as IncomeScreen
  const spendingAmounts = [0, 1000, 5000, 10000, 25000, 50000];

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
    onNext();
  };

  const currentAmount = parseFloat(amount) || 0;
  const canContinue = currentAmount > 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-6">💸</div>
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
      <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          💡 Common spending categories
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
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold
                   hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
        >
          ← Back
        </button>
        <div className="flex-2">
          <PrimaryButton
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue to Savings →
          </PrimaryButton>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};
