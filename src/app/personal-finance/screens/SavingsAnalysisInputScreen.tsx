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
  const { userData, setCurrentScreen, updateSavingsBreakdown } = usePersonalFinanceStore();
  const totalSavings = userData.savings || 0;
  
  const [breakdown, setBreakdown] = useState<SavingsBreakdown>({
    checking: 0,
    savings: 0,
    termDeposit: 0,
    other: 0
  });
  
  const [showEducation, setShowEducation] = useState(false);

  const handleBreakdownChange = (type: keyof SavingsBreakdown, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBreakdown(prev => ({ ...prev, [type]: numValue }));
  };

  const totalAllocated = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalAllocated - totalSavings) < 1; // Allow for small rounding differences

  const handleAnalyze = () => {
    updateSavingsBreakdown(breakdown);
    setCurrentScreen('savingsAnalysisResults');
  };

  const handleBack = () => {
    setCurrentScreen('initialInsights');
  };

  // Quick allocation templates based on risk tolerance
  const getQuickAllocations = () => {
    const emergencyFund = Math.min(userData.spending * 3, totalSavings * 0.3); // 3 months or 30% max
    
    return [
      { 
        label: "Conservative", 
        description: "Lower risk, steady returns",
        checking: Math.min(1000, totalSavings * 0.05), 
        savings: emergencyFund,
        termDeposit: totalSavings * 0.4,
        other: totalSavings - Math.min(1000, totalSavings * 0.05) - emergencyFund - (totalSavings * 0.4)
      },
      { 
        label: "Balanced", 
        description: "Mix of safety and growth",
        checking: Math.min(500, totalSavings * 0.02), 
        savings: emergencyFund * 0.8,
        termDeposit: totalSavings * 0.2,
        other: totalSavings - Math.min(500, totalSavings * 0.02) - (emergencyFund * 0.8) - (totalSavings * 0.2)
      },
      { 
        label: "Growth", 
        description: "Higher risk, higher potential",
        checking: Math.min(500, totalSavings * 0.02), 
        savings: emergencyFund * 0.6,
        termDeposit: 0,
        other: totalSavings - Math.min(500, totalSavings * 0.02) - (emergencyFund * 0.6)
      }
    ];
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
          Asset Allocation Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Let's optimize your ${totalSavings.toLocaleString()}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Learn how proper asset allocation can significantly boost your returns
        </p>
      </div>

      {/* Educational Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowEducation(!showEducation)}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl
                     border-2 border-blue-200 hover:border-blue-300 transition-all duration-200
                     flex items-center justify-between group"
        >
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎓</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">
                New to investing?
              </h3>
              <p className="text-sm text-gray-600">
                Learn about different asset types and their expected returns
              </p>
            </div>
          </div>
          <span className={`text-2xl transition-transform duration-200 ${showEducation ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>
      </div>

      {/* Educational Content */}
      {showEducation && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <Box variant="default" className="p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-2">🏦</span>
              Savings Account (2-4% annually)
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Instant access, government insured up to $250k, but barely beats inflation.
            </p>
            <p className="text-xs text-gray-500">
              Best for: Emergency fund (3-6 months expenses)
            </p>
          </Box>

          <Box variant="default" className="p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-2">🔒</span>
              Term Deposits (4-5% annually)
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Fixed returns, locked for 6-12 months, safe but inflexible.
            </p>
            <p className="text-xs text-gray-500">
              Best for: Short-term goals (1-2 years)
            </p>
          </Box>

          <Box variant="default" className="p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-2">📈</span>
              Index Funds/ETFs (7-10% average)
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Diversified stock market exposure, historically strong returns over 5+ years.
            </p>
            <p className="text-xs text-gray-500">
              Best for: Long-term wealth building
            </p>
          </Box>

          <Box variant="default" className="p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <span className="text-xl mr-2">⚡</span>
              The Power of Compound Returns
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              $10k at 3% = $13.4k after 10 years<br/>
              $10k at 8% = $21.6k after 10 years
            </p>
            <p className="text-xs text-gray-500">
              Small differences compound dramatically!
            </p>
          </Box>
        </div>
      )}

      {/* Current Allocation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Where is your money currently?
        </h3>
        
        {/* Quick allocation templates */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Quick templates based on risk tolerance:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getQuickAllocations().map((allocation, index) => (
              <button
                key={index}
                onClick={() => applyQuickAllocation(allocation)}
                className="p-4 bg-white border border-gray-200 rounded-lg
                         hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
              >
                <div className="font-semibold text-gray-800">{allocation.label}</div>
                <div className="text-xs text-gray-500">{allocation.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checking Account
            </label>
            <CurrencyInput
              value={breakdown.checking}
              onChange={(e) => handleBreakdownChange('checking', e.target.value)}
              placeholder="500"
              className="mb-0"
            />
            <p className="text-xs text-gray-500 mt-1">Daily expenses • 0-0.5% return</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Savings Account
            </label>
            <CurrencyInput
              value={breakdown.savings}
              onChange={(e) => handleBreakdownChange('savings', e.target.value)}
              placeholder="5,000"
              className="mb-0"
            />
            <p className="text-xs text-gray-500 mt-1">Emergency fund • 2-4% return</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term Deposits / CDs
            </label>
            <CurrencyInput
              value={breakdown.termDeposit}
              onChange={(e) => handleBreakdownChange('termDeposit', e.target.value)}
              placeholder="10,000"
              className="mb-0"
            />
            <p className="text-xs text-gray-500 mt-1">Fixed term • 4-5% return</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investments (ETFs/Stocks)
            </label>
            <CurrencyInput
              value={breakdown.other}
              onChange={(e) => handleBreakdownChange('other', e.target.value)}
              placeholder="0"
              className="mb-0"
            />
            <p className="text-xs text-gray-500 mt-1">Growth assets • 7-10% average</p>
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

      {/* Key Insight */}
      <Box variant="gradient" className="mb-8">
        <h3 className="font-semibold text-gray-800 mb-2">
          💡 The diversification principle
        </h3>
        <p className="text-sm text-gray-600">
          A well-diversified portfolio balances:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>• <strong>Liquidity:</strong> Quick access for emergencies (checking/savings)</li>
          <li>• <strong>Stability:</strong> Predictable returns (term deposits)</li>
          <li>• <strong>Growth:</strong> Long-term wealth building (ETFs/stocks)</li>
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
          disabled={!isValid || totalAllocated === 0}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {!isValid 
            ? 'Fix allocation first' 
            : 'See Optimization Plan →'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SavingsAnalysisInputScreen;