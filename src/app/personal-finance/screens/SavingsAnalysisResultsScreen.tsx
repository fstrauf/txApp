'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Box } from '@/components/ui/Box';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { 
  calculateOptimizedReturns, 
  generateOptimizedAllocation,
  calculateCompoundGrowth,
  validateUserData,
  FINANCIAL_CONFIG,
  formatCurrency,
  formatPercentage
} from '../engine/FinancialRulesEngine';
import { PrimaryButton } from '../shared/PrimaryButton';

interface InvestmentOption {
  name: string;
  type: string;
  expectedReturn: number;
  risk: 'Low' | 'Medium' | 'High';
  features: string[];
  bestFor: string;
}

interface ActionStep {
  priority: 'high' | 'medium' | 'low';
  action: string;
  detail: string;
  impact: string;
}

const SavingsAnalysisResultsScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(10);
  
  // Validate user data first
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Box variant="default" className="p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Data Validation Error</h2>
          <ul className="list-disc pl-6 space-y-2">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-red-600">{error}</li>
            ))}
          </ul>
          <button
            onClick={() => goToScreen('savingsAnalysisInput')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to fix data
          </button>
        </Box>
      </div>
    );
  }

  const totalSavings = userData.savings || 0;
  
  // Use the rules engine for all calculations
  const returnAnalysis = calculateOptimizedReturns(userData);
  const optimizedAllocation = generateOptimizedAllocation(userData);

  // Show detailed analysis even when already optimized
  if (!returnAnalysis.isOptimizationWorthwhile) {
    const currentFutureValue = calculateCompoundGrowth(totalSavings, returnAnalysis.currentRate, selectedTimeframe);
    const annualReturn = returnAnalysis.currentAnnualReturn;
    
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-700 uppercase tracking-wide">
              Excellent Portfolio Analysis
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Your allocation is{' '}
            <span className="text-green-600">already optimized!</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You're earning {formatPercentage(returnAnalysis.currentRate)} annually with {formatCurrency(Math.round(annualReturn))} in returns per year
          </p>
        </div>

        {/* Performance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Box variant="default" className="p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatPercentage(returnAnalysis.currentRate)}
            </div>
            <div className="text-sm text-gray-600">annual return</div>
            <div className="text-xs text-gray-500 mt-2">
              Above market average
            </div>
          </Box>

          <Box variant="default" className="p-6 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {formatCurrency(Math.round(annualReturn))}
            </div>
            <div className="text-sm text-gray-600">yearly earnings</div>
            <div className="text-xs text-gray-500 mt-2">
              From your {formatCurrency(totalSavings)}
            </div>
          </Box>

          <Box variant="default" className="p-6 text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {formatCurrency(Math.round(currentFutureValue))}
            </div>
            <div className="text-sm text-gray-600">in {selectedTimeframe} years</div>
            <div className="text-xs text-gray-500 mt-2">
              With compound growth
            </div>
          </Box>
        </div>

        {/* Why It's Good */}
        <Box variant="gradient" className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🏆 Why your allocation is excellent
          </h3>
          
          <div className="bg-white bg-opacity-50 rounded-lg p-6 mb-4">
            <p className="text-gray-700 leading-relaxed">
              {returnAnalysis.rationale}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">✅ Smart diversification</h4>
              <p className="text-sm text-gray-600">
                Your portfolio balances growth potential with risk management effectively.
              </p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">✅ Above-average returns</h4>
              <p className="text-sm text-gray-600">
                At {formatPercentage(returnAnalysis.currentRate)}, you're beating typical savings rates by a significant margin.
              </p>
            </div>
          </div>
        </Box>

        {/* Time Horizon Visualization */}
        <Box variant="default" className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Your wealth projection
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

          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(Math.round(calculateCompoundGrowth(totalSavings, returnAnalysis.currentRate, selectedTimeframe)))}
            </div>
            <p className="text-gray-600">
              Your projected wealth in {selectedTimeframe} years
            </p>
            <p className="text-sm text-gray-500 mt-2">
              That's {formatCurrency(Math.round(calculateCompoundGrowth(totalSavings, returnAnalysis.currentRate, selectedTimeframe) - totalSavings))} in compound growth!
            </p>
          </div>
        </Box>

        {/* Educational Insight */}
        <InsightCard
          type="optimize"
          icon="🎓"
          title="You're in the top tier of investors"
          text="Most people keep money in low-yield savings accounts earning 0.5% or less. Your current allocation puts you ahead of 80% of savers."
          action="Keep up the great work! Consider reviewing your allocation annually to maintain optimization."
          benchmark="Your {formatPercentage(returnAnalysis.currentRate)} return vs. average savings rate of 0.5%"
        />

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
          <PrimaryButton
            onClick={() => goToScreen('initialInsights')}
            className="w-full sm:w-52 order-1 sm:order-1 flex items-center gap-2"
          >            
            Back to Insights
          </PrimaryButton>
          <PrimaryButton
            onClick={() => goToScreen('savingsAnalysisInput')}
            className="w-full sm:w-52 order-2 sm:order-2 flex items-center gap-2"
          >            
            Review Allocation
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Calculate compound growth for time visualization
  const currentFutureValue = calculateCompoundGrowth(totalSavings, returnAnalysis.currentRate, selectedTimeframe);
  const optimizedFutureValue = calculateCompoundGrowth(totalSavings, returnAnalysis.optimizedRate, selectedTimeframe);
  const potentialExtraEarnings = returnAnalysis.optimizedAnnualReturn - returnAnalysis.currentAnnualReturn;

  // Get current breakdown or use optimized as default
  const currentBreakdown = userData.savingsBreakdown || {
    checking: Math.min(500, totalSavings * 0.1),
    savings: totalSavings * 0.9,
    termDeposit: 0,
    other: 0
  };

  // Get investment recommendations
  const getInvestmentOptions = (): InvestmentOption[] => {
    const rates = FINANCIAL_CONFIG.INTEREST_RATES;
    
    return [
      {
        name: "High-Yield Savings Account",
        type: "Cash",
        expectedReturn: rates.highYieldSavings * 100,
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
        expectedReturn: rates.aggressiveInvestments * 100,
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
        expectedReturn: rates.conservativeInvestments * 100,
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
        expectedReturn: rates.balancedInvestments * 100,
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
  };

  // Generate action steps based on current vs optimized allocation
  const getActionSteps = (): ActionStep[] => {
    const steps: ActionStep[] = [];
    
    if (currentBreakdown.checking > FINANCIAL_CONFIG.ALLOCATION.maxCheckingAmount) {
      const excess = currentBreakdown.checking - FINANCIAL_CONFIG.ALLOCATION.maxCheckingAmount;
      steps.push({
        priority: "high",
        action: "Reduce checking account balance",
        detail: `Move ${formatCurrency(excess)} to higher-yield options`,
        impact: `Currently earning 0.2% when it could earn 4.5%+`
      });
    }

    const emergencyFundTarget = userData.spending * FINANCIAL_CONFIG.EMERGENCY_FUND.recommended;
    if (currentBreakdown.savings > emergencyFundTarget) {
      const excessEmergency = currentBreakdown.savings - emergencyFundTarget;
      steps.push({
        priority: "high",
        action: "Invest excess emergency funds",
        detail: `Move ${formatCurrency(excessEmergency)} from savings to diversified investments`,
        impact: `Could earn 8% instead of 4.5% annually`
      });
    }

    if (currentBreakdown.other === 0 && totalSavings > FINANCIAL_CONFIG.ALLOCATION.minInvestmentAmount) {
      steps.push({
        priority: "high",
        action: "Start investing in index funds",
        detail: "Open a brokerage account and buy low-cost index ETFs",
        impact: "Historical returns of 8-10% vs 4.5% in savings"
      });
    }

    if (currentBreakdown.termDeposit > totalSavings * 0.3) {
      steps.push({
        priority: "medium",
        action: "Reduce term deposit allocation",
        detail: "Consider moving some to liquid ETFs for better returns",
        impact: "ETFs offer better returns with more flexibility"
      });
    }

    return steps;
  };

  const investmentOptions = getInvestmentOptions();
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
          <span className="text-green-600">{formatPercentage(returnAnalysis.optimizedRate)}</span>
          {' '}instead of{' '}
          <span className="text-red-600">{formatPercentage(returnAnalysis.currentRate)}</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          That's an extra {formatCurrency(Math.round(potentialExtraEarnings))} per year through smart diversification
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
              {formatCurrency(Math.round(currentFutureValue))}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Growing at {formatPercentage(returnAnalysis.currentRate)} annually
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Optimized approach</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(Math.round(optimizedFutureValue))}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Growing at {formatPercentage(returnAnalysis.optimizedRate)} annually
            </p>
          </div>
        </div>
        
        <div className="text-center mt-6 p-4 bg-white bg-opacity-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">
            That's <span className="text-green-600">{formatCurrency(Math.round(optimizedFutureValue - currentFutureValue))}</span> more in {selectedTimeframe} years!
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
                  <div className="text-2xl font-bold text-green-600">{option.expectedReturn.toFixed(1)}%</div>
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
                <li>• Current need: {formatCurrency(userData.spending * 3)}</li>
                <li>• Recommended: Ally, Marcus, or similar (4.5%+ APY)</li>
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

      {/* Consistent Navigation at Bottom */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
        <PrimaryButton
          onClick={() => goToScreen('initialInsights')}
          className="w-full sm:w-48 order-2 sm:order-2"
        >          
          Back to Insights
        </PrimaryButton>
        <PrimaryButton
          onClick={() => goToScreen('savingsAnalysisInput')}
          className="w-full sm:w-48 order-2 sm:order-2"
        >        
          Back to Allocation
        </PrimaryButton>
      </div>
    </div>
  );
};

export default SavingsAnalysisResultsScreen;
