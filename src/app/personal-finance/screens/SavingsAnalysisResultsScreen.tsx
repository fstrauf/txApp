// src/app/personal-finance/screens/SavingsAnalysisResultsScreen.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';

interface InvestmentOption {
  name: string;
  type: string;
  expectedReturn: number;
  risk: 'Low' | 'Medium' | 'High';
  features: string[];
  bestFor: string;
}

const SavingsAnalysisResultsScreen: React.FC = () => {
  const { userData, setCurrentScreen } = usePersonalFinanceStore();
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(10);
  
  const totalSavings = userData.savings || 0;
  const breakdown = userData.savingsBreakdown || {
    checking: totalSavings * 0.2,
    savings: totalSavings * 0.8,
    termDeposit: 0,
    other: 0
  };

  // Calculate current vs optimized returns
  const calculateReturns = () => {
    // Current returns based on typical rates
    const currentRates = {
      checking: 0.002, // 0.2%
      savings: 0.03, // 3% average savings account
      termDeposit: 0.045, // 4.5% term deposit
      other: 0.08 // 8% if already investing
    };

    // Optimized rates with proper diversification
    const optimizedRates = {
      checking: 0.002, // Keep minimal
      savings: 0.035, // High-yield savings
      termDeposit: 0.045, // Same term deposit
      other: 0.08 // 8% diversified ETF portfolio
    };

    const currentAnnualReturn = 
      breakdown.checking * currentRates.checking +
      breakdown.savings * currentRates.savings +
      breakdown.termDeposit * currentRates.termDeposit +
      breakdown.other * currentRates.other;

    // Optimized allocation based on modern portfolio theory
    const emergencyFund = userData.spending * 3; // 3 months expenses
    const optimizedBreakdown = {
      checking: Math.min(500, totalSavings * 0.02), // Minimal for daily needs
      savings: Math.min(emergencyFund, totalSavings * 0.15), // Emergency fund in high-yield
      termDeposit: totalSavings > emergencyFund + 10000 ? totalSavings * 0.1 : 0, // Some in term deposits
      other: Math.max(0, totalSavings - Math.min(500, totalSavings * 0.02) - Math.min(emergencyFund, totalSavings * 0.15) - (totalSavings > emergencyFund + 10000 ? totalSavings * 0.1 : 0))
    };

    const optimizedAnnualReturn = 
      optimizedBreakdown.checking * optimizedRates.checking +
      optimizedBreakdown.savings * optimizedRates.savings +
      optimizedBreakdown.termDeposit * optimizedRates.termDeposit +
      optimizedBreakdown.other * optimizedRates.other;

    return {
      current: currentAnnualReturn,
      optimized: optimizedAnnualReturn,
      difference: optimizedAnnualReturn - currentAnnualReturn,
      currentRate: (currentAnnualReturn / totalSavings) * 100,
      optimizedRate: (optimizedAnnualReturn / totalSavings) * 100,
      optimizedBreakdown
    };
  };

  const returns = calculateReturns();
  const potentialExtraEarnings = returns.difference;

  // Calculate compound growth
  const calculateCompoundGrowth = (principal: number, rate: number, years: number) => {
    return principal * Math.pow(1 + rate, years);
  };

  const currentFutureValue = calculateCompoundGrowth(totalSavings, returns.currentRate / 100, selectedTimeframe);
  const optimizedFutureValue = calculateCompoundGrowth(totalSavings, returns.optimizedRate / 100, selectedTimeframe);

  // Get investment recommendations
  const getInvestmentOptions = (): InvestmentOption[] => {
    const options: InvestmentOption[] = [
      {
        name: "High-Yield Savings Account",
        type: "Cash",
        expectedReturn: 3.5,
        risk: "Low",
        features: [
          "FDIC insured up to $250k",
          "No lock-in period",
          "Perfect for emergency fund",
          "Instant access to funds"
        ],
        bestFor: "Emergency fund (3-6 months expenses)"
      },
      {
        name: "S&P 500 Index ETF",
        type: "Stocks",
        expectedReturn: 10,
        risk: "Medium",
        features: [
          "Diversified across 500 companies",
          "Historical 10% average annual return",
          "Low fees (0.03-0.09% expense ratio)",
          "Highly liquid, trade like stocks"
        ],
        bestFor: "Long-term growth (5+ years)"
      },
      {
        name: "Total Market Bond ETF",
        type: "Bonds",
        expectedReturn: 4.5,
        risk: "Low",
        features: [
          "Government and corporate bonds",
          "More stable than stocks",
          "Regular income distributions",
          "Good portfolio diversifier"
        ],
        bestFor: "Income and stability"
      },
      {
        name: "Target-Date Fund",
        type: "Mixed",
        expectedReturn: 7,
        risk: "Medium",
        features: [
          "Automatically rebalances",
          "Gets more conservative over time",
          "One-fund portfolio solution",
          "Perfect for beginners"
        ],
        bestFor: "Set-and-forget investing"
      }
    ];

    return options;
  };

  const investmentOptions = getInvestmentOptions();

  // Generate action steps
  const getActionSteps = () => {
    const steps = [];
    
    if (breakdown.checking > 1000) {
      steps.push({
        priority: "high",
        action: "Reduce checking account balance",
        detail: `Move $${(breakdown.checking - 500).toLocaleString()} to higher-yield options`,
        impact: `Currently earning 0.2% when it could earn 3.5%+`
      });
    }

    if (breakdown.savings > userData.spending * 6) {
      const excessEmergency = breakdown.savings - (userData.spending * 6);
      steps.push({
        priority: "high",
        action: "Invest excess emergency funds",
        detail: `Move $${excessEmergency.toLocaleString()} from savings to diversified ETFs`,
        impact: `Could earn 8% instead of 3% annually`
      });
    }

    if (breakdown.other === 0 && totalSavings > 10000) {
      steps.push({
        priority: "high",
        action: "Start investing in index funds",
        detail: "Open a brokerage account and buy low-cost index ETFs",
        impact: "Historical returns of 8-10% vs 3% in savings"
      });
    }

    if (breakdown.termDeposit > totalSavings * 0.3) {
      steps.push({
        priority: "medium",
        action: "Reduce term deposit allocation",
        detail: "Consider moving some to liquid ETFs for better returns",
        impact: "ETFs offer better returns with more flexibility"
      });
    }

    return steps;
  };

  const actionSteps = getActionSteps();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-green-700 uppercase tracking-wide">
            Investment Optimization Analysis
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Your money could be earning{' '}
          <span className="text-green-600">{returns.optimizedRate.toFixed(1)}%</span>
          {' '}instead of{' '}
          <span className="text-red-600">{returns.currentRate.toFixed(1)}%</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          That's an extra ${Math.round(potentialExtraEarnings).toLocaleString()} per year through smart diversification
        </p>
      </div>

      {/* Time Impact Visualization */}
      <Box variant="gradient" className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📈 See the power of compound returns
        </h3>
        
        <div className="mb-4">
          <label className="text-sm text-gray-600">Time horizon:</label>
          <div className="flex gap-2 mt-2">
            {[5, 10, 20, 30].map((years) => (
              <button
                key={years}
                onClick={() => setSelectedTimeframe(years)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTimeframe === years 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {years} years
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Current approach</p>
            <p className="text-3xl font-bold text-gray-800">
              ${Math.round(currentFutureValue).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Growing at {returns.currentRate.toFixed(1)}% annually
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Optimized approach</p>
            <p className="text-3xl font-bold text-green-600">
              ${Math.round(optimizedFutureValue).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Growing at {returns.optimizedRate.toFixed(1)}% annually
            </p>
          </div>
        </div>
        
        <div className="text-center mt-6 p-4 bg-white bg-opacity-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">
            That's <span className="text-green-600">${Math.round(optimizedFutureValue - currentFutureValue).toLocaleString()}</span> more in {selectedTimeframe} years!
          </p>
        </div>
      </Box>

      {/* Investment Options */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Recommended investment options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investmentOptions.map((option, index) => (
            <Box key={index} variant="default" className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{option.name}</h3>
                  <p className="text-gray-600">{option.type} • {option.risk} Risk</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{option.expectedReturn}%</div>
                  <div className="text-xs text-gray-500">expected return</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="text-xs text-gray-500 border-t pt-3">
                Best for: {option.bestFor}
              </div>
            </Box>
          ))}
        </div>
      </div>

      {/* Educational Insight */}
      <InsightCard
        type="optimize"
        icon="🎓"
        title="Why ETFs are game-changers"
        text="Exchange-Traded Funds (ETFs) revolutionized investing by making diversification accessible to everyone. With as little as $1, you can own a piece of hundreds or thousands of companies."
        action="Key benefits: Low fees (0.03-0.20%), instant diversification, high liquidity, and no minimum investment."
        benchmark="Popular beginner ETFs: VOO (S&P 500), VTI (Total Market), VT (Global Stocks)"
      />

      {/* Action Plan */}
      <div className="mb-10 mt-8">
        <button
          onClick={() => setShowActionPlan(!showActionPlan)}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl
                     border-2 border-green-200 hover:border-green-300 transition-all duration-200
                     flex items-center justify-between group"
        >
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">
                Your personalized action plan
              </h3>
              <p className="text-sm text-gray-600">
                Step-by-step guide to optimize your portfolio
              </p>
            </div>
          </div>
          <span className={`text-2xl transition-transform duration-200 ${showActionPlan ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>

        {showActionPlan && (
          <div className="mt-6 space-y-4 animate-fadeIn">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2">📚 Step 1: Education (This week)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Read "A Random Walk Down Wall Street" or "The Bogleheads' Guide"</li>
                <li>• Watch YouTube videos on index fund investing</li>
                <li>• Understand expense ratios and diversification</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-800 mb-2">💰 Step 2: Emergency Fund (Month 1)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Keep 3-6 months expenses in high-yield savings</li>
                <li>• Current need: ${(userData.spending * 3).toLocaleString()}</li>
                <li>• Recommended: Ally, Marcus, or similar (3.5%+ APY)</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-800 mb-2">📈 Step 3: Start Investing (Month 2)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Open a brokerage account (Vanguard, Fidelity, or Schwab)</li>
                <li>• Start with a simple 3-fund portfolio or target-date fund</li>
                <li>• Set up automatic monthly investments</li>
              </ul>
            </div>

            {actionSteps.map((step, index) => (
              <div key={index} className="flex items-start p-4 bg-white rounded-lg border border-gray-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                  ${step.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {index + 4}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{step.action}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.detail}</p>
                  <div className="text-sm font-medium text-green-600 mt-2">
                    Why: {step.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsAnalysisResultsScreen;