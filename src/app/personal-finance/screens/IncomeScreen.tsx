'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { CurrencyInput, QuickAmountSelector, PrimaryButton } from '@/app/personal-finance/components/FinanceComponents';

const IncomeScreen: React.FC = () => {
  const { nextScreen, prevScreen, currentStep, totalSteps } = usePersonalFinanceStore(state => ({
    nextScreen: state.nextScreen,
    prevScreen: state.prevScreen,
    currentStep: state.currentStep, // Assuming these exist in your store
    totalSteps: state.totalSteps   // Assuming these exist in your store
  }));

  const [income, setIncome] = useState<number | string>(''); // Allow string for empty input
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setIncome("");
      setSelectedAmount(null); // Deselect if input is cleared
    } else {
      const numValue = parseInt(value, 10);
      setIncome(numValue);
      // If user types an amount that matches a quick select option, highlight it.
      // Or, deselect if it doesn't match.
      const quickAmounts = [3000, 4500, 6000, 7500, 9000, 12000]; // Default amounts
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
  
  // Determine current step and total steps for display
  // Default to "1 of 3" if store values are not available or suitable
  const stepDisplay = (typeof currentStep === 'number' && typeof totalSteps === 'number' && totalSteps > 0)
    ? `Question ${currentStep} of ${totalSteps}`
    : "Question 1 of 3";


  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 min-h-[700px] flex flex-col bg-white"> {/* Ensure white background and padding */}
      <div className="text-center mb-8">
        <div className="text-sm text-gray-500 mb-2">{stepDisplay}</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What's your monthly take-home income?
        </h2>
        <p className="text-lg text-gray-600">
          After tax, KiwiSaver, and student loan payments
        </p>
      </div>
      
      <CurrencyInput
        value={income}
        onChange={handleIncomeChange}
        placeholder="4,500" // Default placeholder
        label="" // No label in example for this screen
        helperText="" // No helper text in example for this screen
        className="mb-4" // Added margin for spacing
      />
      
      <QuickAmountSelector
        // amounts prop can be omitted to use default amounts
        selectedAmount={selectedAmount}
        onSelect={handleQuickAmountSelect}
        className="mb-8" // Added margin for spacing
      />
      
      <div className="flex flex-col sm:flex-row justify-between mt-auto space-y-4 sm:space-y-0 sm:space-x-4"> {/* mt-auto to push buttons down, responsive flex */}
        <PrimaryButton onClick={prevScreen} variant="secondary" className="w-full sm:w-auto flex-grow"> {/* flex-grow for equal width on small screens */}
          Back
        </PrimaryButton>
        <PrimaryButton onClick={nextScreen} disabled={income === '' || income === 0} className="w-full sm:w-auto flex-grow">
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default IncomeScreen;
