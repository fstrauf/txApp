// src/app/personal-finance/screens/SavingsAnalysisInputScreen.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';

interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

const SavingsAnalysisInputScreen: React.FC = () => {
  const { userData, setCurrentScreen, updateSavingsBreakdown, updateSelectedBank } = usePersonalFinanceStore();
  const totalSavings = userData.savings || 0;
  
  const [breakdown, setBreakdown] = useState<SavingsBreakdown>({
    checking: 0,
    savings: 0,
    termDeposit: 0,
    other: 0
  });
  
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');

  const handleBreakdownChange = (type: keyof SavingsBreakdown, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBreakdown(prev => ({ ...prev, [type]: numValue }));
  };

  const totalAllocated = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalAllocated - totalSavings) < 1; // Allow for small rounding differences

  const handleAnalyze = () => {
    updateSavingsBreakdown(breakdown);
    updateSelectedBank(selectedBank);
    setCurrentScreen('savingsAnalysisResults');
  };

  const handleBack = () => {
    setCurrentScreen('initialInsights');
  };

  // Quick allocation suggestions based on total savings
  const getQuickAllocations = () => {
    if (totalSavings <= 1000) {
      return [
        { label: "All in checking", checking: totalSavings, savings: 0, termDeposit: 0, other: 0 },
        { label: "Emergency starter", checking: totalSavings * 0.3, savings: totalSavings * 0.7, termDeposit: 0, other: 0 }
      ];
    } else if (totalSavings <= 10000) {
      return [
        { label: "Conservative", checking: totalSavings * 0.2, savings: totalSavings * 0.8, termDeposit: 0, other: 0 },
        { label: "Balanced", checking: totalSavings * 0.1, savings: totalSavings * 0.6, termDeposit: totalSavings * 0.3, other: 0 },
        { label: "Growth focused", checking: totalSavings * 0.1, savings: totalSavings * 0.4, termDeposit: totalSavings * 0.5, other: 0 }
      ];
    } else {
      return [
        { label: "Conservative", checking: 2000, savings: totalSavings * 0.5, termDeposit: totalSavings * 0.4, other: totalSavings - 2000 - (totalSavings * 0.9) },
        { label: "Balanced", checking: 1000, savings: totalSavings * 0.3, termDeposit: totalSavings * 0.5, other: totalSavings - 1000 - (totalSavings * 0.8) },
        { label: "Optimized", checking: 500, savings: totalSavings * 0.2, termDeposit: totalSavings * 0.6, other: totalSavings - 500 - (totalSavings * 0.8) }
      ];
    }
  };

  const applyQuickAllocation = (allocation: any) => {
    setBreakdown({
      checking: Math.round(allocation.checking),
      savings: Math.round(allocation.savings),
      termDeposit: Math.round(allocation.termDeposit),
      other: Math.round(allocation.other)
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-12 min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
          Savings Optimization
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Let's optimize your ${totalSavings.toLocaleString()}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tell us where your money sits so we can find better returns
        </p>
      </div>

      {/* Main Bank Selection */}
      <div className="mb-8">
        <label className="block text-lg font-semibold text-gray-800 mb-3">
          Who's your main bank?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank', 'TSB', 'Heartland', 'Other'].map((bank) => (
            <button
              key={bank}
              onClick={() => setSelectedBank(bank)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200
                ${selectedBank === bank 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
            >
              {bank}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Insight */}
      {selectedBank && (
        <Box variant="gradient" className="mb-8 animate-fadeIn">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                {selectedBank === 'Heartland' ? 'Good choice!' : 'Opportunity detected'}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedBank === 'Heartland' 
                  ? 'Heartland offers some of the best savings rates in NZ at 4.1% p.a.'
                  : `${selectedBank} savings accounts typically offer 0.1-1.5% p.a. You could earn up to 4.1% elsewhere.`}
              </p>
            </div>
          </div>
        </Box>
      )}

      {/* Breakdown Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl
                     border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-200
                     flex items-center justify-between group"
        >
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">
                Want a detailed breakdown?
              </h3>
              <p className="text-sm text-gray-600">
                Tell us exactly where your money is for personalized advice
              </p>
            </div>
          </div>
          <span className={`text-2xl transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="mb-8 space-y-4 animate-fadeIn">
          {/* Quick allocations */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Quick templates:</p>
            <div className="flex flex-wrap gap-2">
              {getQuickAllocations().map((allocation, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickAllocation(allocation)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg
                           hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                >
                  {allocation.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checking/Transaction accounts
              </label>
              <CurrencyInput
                value={breakdown.checking}
                onChange={(e) => handleBreakdownChange('checking', e.target.value)}
                placeholder="500"
                className="mb-0"
              />
              <p className="text-xs text-gray-500 mt-1">Usually 0-0.1% interest</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Savings accounts
              </label>
              <CurrencyInput
                value={breakdown.savings}
                onChange={(e) => handleBreakdownChange('savings', e.target.value)}
                placeholder="5,000"
                className="mb-0"
              />
              <p className="text-xs text-gray-500 mt-1">Usually 0.1-4.1% interest</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term deposits
              </label>
              <CurrencyInput
                value={breakdown.termDeposit}
                onChange={(e) => handleBreakdownChange('termDeposit', e.target.value)}
                placeholder="10,000"
                className="mb-0"
              />
              <p className="text-xs text-gray-500 mt-1">Usually 5-6% interest (locked)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other investments
              </label>
              <CurrencyInput
                value={breakdown.other}
                onChange={(e) => handleBreakdownChange('other', e.target.value)}
                placeholder="0"
                className="mb-0"
              />
              <p className="text-xs text-gray-500 mt-1">Stocks, bonds, managed funds</p>
            </div>
          </div>

          {/* Allocation Summary */}
          <div className={`mt-4 p-4 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total allocated: ${totalAllocated.toLocaleString()} of ${totalSavings.toLocaleString()}
              </span>
              {!isValid && (
                <span className="text-sm text-orange-600">
                  ${Math.abs(totalSavings - totalAllocated).toLocaleString()} difference
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* What we'll analyze */}
      <Box variant="default" className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-3">
          What you'll discover:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            How much extra you could earn with better rates
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Whether your emergency fund is optimized
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            If you should consider term deposits or investments
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Specific bank recommendations for your situation
          </li>
        </ul>
      </Box>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-auto">
        <PrimaryButton 
          onClick={handleBack} 
          variant="secondary" 
          className="w-full sm:w-32 order-2 sm:order-1"
        >
          Back
        </PrimaryButton>
        <PrimaryButton 
          onClick={handleAnalyze} 
          disabled={!selectedBank}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {showBreakdown && !isValid 
            ? 'Fix allocation first' 
            : 'Get Optimization Plan →'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SavingsAnalysisInputScreen;