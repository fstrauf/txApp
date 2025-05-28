'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { CurrencyInput } from '@/app/personal-finance/shared/CurrencyInput';
import { Disclosure } from '@/components/ui/Disclosure';
import { useScreenNavigation } from '../hooks/useScreenNavigation';

interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

const SavingsAnalysisInputScreen: React.FC = () => {
  const { userData, updateSavingsBreakdown, updateSavingsGoal } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const totalSavings = userData.savings || 0;
  
  const [breakdown, setBreakdown] = useState<SavingsBreakdown>(
    userData.savingsBreakdown || {
      checking: Math.min(1000, totalSavings * 0.1),
      savings: totalSavings * 0.6,
      termDeposit: totalSavings * 0.2,
      other: totalSavings * 0.1
    }
  );
  
  const [showEducation, setShowEducation] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState<string>(userData.savingsGoal || 'retirement');

  const handleBreakdownChange = (type: keyof SavingsBreakdown, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newBreakdown = { ...breakdown, [type]: numValue };
    setBreakdown(newBreakdown);
    // Auto-save breakdown when user changes values
    updateSavingsBreakdown(newBreakdown);
  };

  const totalAllocated = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalAllocated - totalSavings) < 1; // Allow for small rounding differences

  const handleBack = () => {
    goToScreen('initialInsights');
  };

  // Calculate current weighted return
  const getCurrentReturn = () => {
    if (totalSavings === 0) return 0;
    const checkingReturn = (breakdown.checking / totalSavings) * 0.002; // 0.2%
    const savingsReturn = (breakdown.savings / totalSavings) * 0.025; // 2.5%
    const termReturn = (breakdown.termDeposit / totalSavings) * 0.05; // 5%
    const investmentReturn = (breakdown.other / totalSavings) * 0.08; // 8%
    return checkingReturn + savingsReturn + termReturn + investmentReturn;
  };

  // Generate simple, logical suggestions
  const generateSuggestions = () => {
    const suggestions = [];
    const emergencyFundNeeded = userData.spending * 3; // 3 months expenses
    
    // Too much in checking
    if (breakdown.checking > 1000) {
      suggestions.push({
        type: 'warning',
        title: 'Excess in Checking Account',
        message: `You have ${((breakdown.checking / totalSavings) * 100).toFixed(1)}% in checking. Consider keeping only $500-$1,000 for daily expenses.`,
        action: `Move $${(breakdown.checking - 1000).toLocaleString()} to savings or investments`,
        impact: `Could earn 2.3%+ more on this money`
      });
    }

    // No emergency fund
    if (breakdown.savings < emergencyFundNeeded && userData.spending > 0) {
      suggestions.push({
        type: 'important',
        title: 'Emergency Fund Gap',
        message: `You should have ${((emergencyFundNeeded / totalSavings) * 100).toFixed(1)}% in emergency savings (3-6 months expenses).`,
        action: `Consider increasing savings to $${emergencyFundNeeded.toLocaleString()}`,
        impact: 'Provides financial security for unexpected events'
      });
    }

    // No investments but good emergency fund
    if (breakdown.other === 0 && breakdown.savings >= emergencyFundNeeded && totalSavings > 10000) {
      suggestions.push({
        type: 'opportunity',
        title: 'Missing Growth Investments',
        message: 'You have a solid emergency fund but no growth investments.',
        action: 'Consider investing 20-40% in diversified ETFs for long-term growth',
        impact: 'Could earn 8-10% annually vs 2.5% in savings'
      });
    }

    // Too much in term deposits
    if (breakdown.termDeposit > totalSavings * 0.4) {
      suggestions.push({
        type: 'info',
        title: 'High Term Deposit Allocation',
        message: `${((breakdown.termDeposit / totalSavings) * 100).toFixed(1)}% in term deposits limits flexibility.`,
        action: 'Consider some ETFs for better returns and liquidity',
        impact: 'More flexibility with potentially higher returns'
      });
    }

    // Already well allocated
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'success',
        title: 'Well-Balanced Allocation',
        message: 'Your money allocation looks reasonable for your situation.',
        action: 'Consider reviewing annually as your situation changes',
        impact: `Current return: ${(getCurrentReturn() * 100).toFixed(1)}% annually`
      });
    }

    return suggestions;
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
    const newBreakdown = {
      checking: Math.round(allocation.checking),
      savings: Math.round(allocation.savings),
      termDeposit: Math.round(allocation.termDeposit),
      other: Math.round(allocation.other)
    };
    setBreakdown(newBreakdown);
    updateSavingsBreakdown(newBreakdown);
  };

  return (
    <div className="max-w-[800px] mx-auto p-12 min-h-[600px] flex flex-col">
      {/* Savings Goal Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">What's your main savings goal?</h2>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'retirement', label: 'Retirement' },
            { value: 'emergency', label: 'Emergency Fund' },
            { value: 'home', label: 'Home Purchase' },
            { value: 'travel', label: 'Travel' },
            { value: 'other', label: 'Other' },
          ].map(goal => (
            <label key={goal.value} className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${savingsGoal === goal.value ? 'bg-indigo-100 border-indigo-400 font-semibold' : 'bg-white border-gray-300'}`}>
              <input
                type="radio"
                name="savingsGoal"
                value={goal.value}
                checked={savingsGoal === goal.value}
                onChange={() => {
                  setSavingsGoal(goal.value);
                  updateSavingsGoal(goal.value);
                }}
                className="mr-2"
              />
              {goal.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          We'll tailor your asset allocation advice based on your goal.
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
          Asset Allocation Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Let's optimize your ${totalSavings.toLocaleString('en-NZ')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Learn how proper asset allocation can significantly boost your returns
        </p>
      </div>

      {/* Educational Toggle (using Disclosure) */}
      <div className="mb-6 max-w-4xl">
        <Disclosure
          buttonContent={
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
          }
          panelContent={
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
          }
          className="w-full"
          buttonClassName="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center justify-between group"
        />
      </div>

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
              Total allocated: ${totalAllocated.toLocaleString('en-NZ')} of ${totalSavings.toLocaleString('en-NZ')}
            </span>
            {!isValid && (
              <span className="text-sm text-orange-600">
                ${Math.abs(totalSavings - totalAllocated).toLocaleString('en-NZ')} difference
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

      {/* Analysis Results - Show when allocation is valid */}
      {isValid && totalAllocated > 0 && (
        <div className="mt-12 space-y-6 animate-fadeIn">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              📊 Your Allocation Analysis
            </h2>
            <p className="text-gray-600">
              Current estimated annual return: <span className="font-bold text-green-600">{(getCurrentReturn() * 100).toFixed(1)}%</span>
            </p>
          </div>

          {/* Current Allocation Breakdown */}
          <Box variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Current Allocation</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-400 rounded mr-3"></div>
                  <span className="text-sm font-medium">Checking Account</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{breakdown.checking.toLocaleString('en-NZ', {style: 'currency', currency: 'NZD', minimumFractionDigits: 0})}</div>
                  <div className="text-xs text-gray-500">{((breakdown.checking / totalSavings) * 100).toFixed(1)}% • 0.2% APY</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-400 rounded mr-3"></div>
                  <span className="text-sm font-medium">Savings Account</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{breakdown.savings.toLocaleString('en-NZ', {style: 'currency', currency: 'NZD', minimumFractionDigits: 0})}</div>
                  <div className="text-xs text-gray-500">{((breakdown.savings / totalSavings) * 100).toFixed(1)}% • 2.5% APY</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded mr-3"></div>
                  <span className="text-sm font-medium">Term Deposits</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{breakdown.termDeposit.toLocaleString('en-NZ', {style: 'currency', currency: 'NZD', minimumFractionDigits: 0})}</div>
                  <div className="text-xs text-gray-500">{((breakdown.termDeposit / totalSavings) * 100).toFixed(1)}% • 5.0% APY</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-400 rounded mr-3"></div>
                  <span className="text-sm font-medium">ETFs/Investments</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{breakdown.other.toLocaleString('en-NZ', {style: 'currency', currency: 'NZD', minimumFractionDigits: 0})}</div>
                  <div className="text-xs text-gray-500">{((breakdown.other / totalSavings) * 100).toFixed(1)}% • 8.0% expected</div>
                </div>
              </div>
            </div>
          </Box>

          {/* Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">💡 Recommendations</h3>
            {generateSuggestions().map((suggestion, index) => (
              <Box 
                key={index} 
                variant="default" 
                className={`p-4 border-l-4 ${
                  suggestion.type === 'warning' ? 'border-orange-400 bg-orange-50' :
                  suggestion.type === 'important' ? 'border-red-400 bg-red-50' :
                  suggestion.type === 'opportunity' ? 'border-blue-400 bg-blue-50' :
                  suggestion.type === 'success' ? 'border-green-400 bg-green-50' :
                  'border-gray-400 bg-gray-50'
                }`}
              >
                <h4 className="font-semibold text-gray-800 mb-2">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{suggestion.message}</p>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  <span className="text-blue-600">Action:</span> {suggestion.action}
                </p>
                <p className="text-xs text-green-600">
                  <span className="font-medium">Impact:</span> {suggestion.impact}
                </p>
              </Box>
            ))}
          </div>

          {/* Educational Content */}
          <Box variant="gradient" className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              🎓 Quick Investment Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">For Beginners:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Start with high-yield savings (emergency fund)</li>
                  <li>• Consider index ETFs for growth (VTI, VOO)</li>
                  <li>• Keep 3-6 months expenses accessible</li>
                  <li>• Automate investments for consistency</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Risk Guidelines:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Conservative: 60% savings, 40% investments</li>
                  <li>• Balanced: 40% savings, 60% investments</li>
                  <li>• Growth: 20% savings, 80% investments</li>
                  <li>• Always keep emergency fund first</li>
                </ul>
              </div>
            </div>
          </Box>
        </div>
      )}

      {/* Back Button - Always at bottom */}
      <div className="flex justify-center mt-12">
        <PrimaryButton 
          onClick={handleBack} 
          variant="secondary" 
          className="w-full sm:w-48"
        >
          ← Back to Insights
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SavingsAnalysisInputScreen;