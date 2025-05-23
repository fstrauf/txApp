'use client';

import React, { useState } from 'react';
import { QuickAmountSelector, PrimaryButton } from '../shared/FinanceComponents';
import { usePersonalFinanceStore } from '../../../store/personalFinanceStore';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';

interface SavingsScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const SavingsScreen: React.FC<SavingsScreenProps> = ({ onNext, onBack }) => {
  const { userData, updateSavings } = usePersonalFinanceStore();
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
    onNext();
  };

  const currentAmount = parseFloat(amount) || 0;
  const canContinue = true; // Allow 0 savings

  // Calculate some helpful context based on income
  const monthlyIncome = userData.income || 0;
  const emergencyFundTarget = (userData.spending || 0) * 3; // 3 months expenses
  const savingsRate = monthlyIncome > 0 ? (currentAmount / (monthlyIncome * 12)) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-6">💰</div>
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
      <div className="mb-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          💡 What counts as savings?
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
          Don't include retirement accounts (KiwiSaver) or long-term investments that are hard to access
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
            Continue to Insights →
          </PrimaryButton>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};
