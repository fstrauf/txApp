// src/app/personal-finance/screens/SavingsAnalysisResultsScreen.tsx
'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';

interface BankRecommendation {
  bank: string;
  product: string;
  rate: number;
  features: string[];
  minDeposit?: number;
  term?: string;
}

const SavingsAnalysisResultsScreen: React.FC = () => {
  const { userData, setCurrentScreen } = usePersonalFinanceStore();
  const [showActionPlan, setShowActionPlan] = useState(false);
  
  const totalSavings = userData.savings || 0;
  const breakdown = userData.savingsBreakdown || {
    checking: totalSavings * 0.2,
    savings: totalSavings * 0.8,
    termDeposit: 0,
    other: 0
  };

  // Calculate current vs optimized returns
  const calculateReturns = () => {
    // Assume current rates based on typical NZ banks
    const currentRates = {
      checking: 0.001, // 0.1%
      savings: userData.selectedBank === 'Heartland' ? 0.041 : 0.015, // 1.5% average
      termDeposit: 0.055, // 5.5%
      other: 0.07 // 7% (conservative investment return)
    };

    const optimizedRates = {
      checking: 0.001, // Keep minimal in checking
      savings: 0.041, // Heartland rate
      termDeposit: 0.06, // 6% best term deposit
      other: 0.07 // Same investment return
    };

    const currentAnnualReturn = 
      breakdown.checking * currentRates.checking +
      breakdown.savings * currentRates.savings +
      breakdown.termDeposit * currentRates.termDeposit +
      breakdown.other * currentRates.other;

    // Optimized allocation
    const emergencyFund = userData.spending * 3; // 3 months expenses
    const optimizedBreakdown = {
      checking: Math.min(500, totalSavings * 0.05), // Keep minimal
      savings: Math.min(emergencyFund, totalSavings * 0.4),
      termDeposit: Math.max(0, Math.min(totalSavings * 0.5, totalSavings - emergencyFund - 500)),
      other: Math.max(0, totalSavings - emergencyFund - 500 - (totalSavings * 0.5))
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
      optimizedBreakdown
    };
  };

  const returns = calculateReturns();
  const potentialExtraEarnings = returns.difference;

  // Get personalized recommendations
  const getRecommendations = (): BankRecommendation[] => {
    const recommendations: BankRecommendation[] = [];

    // For savings accounts
    if (breakdown.savings > 0 || breakdown.checking > 1000) {
      recommendations.push({
        bank: "Heartland Bank",
        product: "Online Call Account",
        rate: 4.1,
        features: [
          "No fees, no minimum balance",
          "Instant access to funds",
          "Best ongoing rate in NZ",
          "Online only (no branches)"
        ]
      });

      recommendations.push({
        bank: "Rabobank",
        product: "Premium Saver",
        rate: 4.0,
        features: [
          "No fees with $1,000+ balance",
          "Bonus rate for no withdrawals",
          "Good for emergency funds",
          "Online and phone banking"
        ],
        minDeposit: 1000
      });
    }

    // For term deposits
    if (totalSavings > 10000 && breakdown.termDeposit === 0) {
      recommendations.push({
        bank: "Heartland Bank",
        product: "Term Deposit",
        rate: 6.0,
        features: [
          "6% for 12 months",
          "Minimum $1,000",
          "Interest paid at maturity",
          "Early withdrawal penalties apply"
        ],
        minDeposit: 1000,
        term: "12 months"
      });
    }

    // For larger amounts
    if (totalSavings > 50000) {
      recommendations.push({
        bank: "Investment Platform",
        product: "Conservative Fund",
        rate: 7.0,
        features: [
          "Diversified portfolio",
          "Professional management",
          "Quarterly distributions",
          "Some market risk"
        ],
        minDeposit: 10000
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  // Generate action steps
  const getActionSteps = () => {
    const steps = [];
    
    if (breakdown.checking > 1000) {
      steps.push({
        priority: "high",
        action: "Move excess from checking",
        detail: `Transfer $${(breakdown.checking - 500).toLocaleString()} from checking to high-interest savings`,
        impact: `+$${Math.round((breakdown.checking - 500) * 0.04).toLocaleString()}/year`
      });
    }

    if (breakdown.savings > 0 && userData.selectedBank !== 'Heartland') {
      steps.push({
        priority: "high",
        action: "Switch to Heartland Bank",
        detail: "Open Online Call Account for your emergency fund",
        impact: `+$${Math.round(breakdown.savings * 0.026).toLocaleString()}/year extra`
      });
    }

    if (totalSavings > userData.spending * 6 && breakdown.termDeposit === 0) {
      const excessSavings = totalSavings - (userData.spending * 6);
      steps.push({
        priority: "medium",
        action: "Lock in term deposit rates",
        detail: `Put $${Math.round(excessSavings).toLocaleString()} in 12-month term deposit at 6%`,
        impact: `+$${Math.round(excessSavings * 0.06).toLocaleString()}/year guaranteed`
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
            Savings Optimization Report
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          You're missing out on{' '}
          <span className="text-green-600">${Math.round(potentialExtraEarnings).toLocaleString()}</span>
          {' '}per year
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Here's how to optimize your ${totalSavings.toLocaleString()} for maximum returns
        </p>
      </div>

      {/* Current vs Optimized Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Box variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">😐</span>
            Your Current Setup
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual return</span>
              <span className="text-xl font-bold text-gray-800">
                ${Math.round(returns.current).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Effective rate</span>
              <span className="text-lg font-semibold text-gray-800">
                {((returns.current / totalSavings) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {breakdown.checking > 1000 && "❗ Too much in checking"}
                {breakdown.savings > 0 && userData.selectedBank !== 'Heartland' && "❗ Low savings rate"}
                {breakdown.termDeposit === 0 && totalSavings > 20000 && "❗ No term deposits"}
              </div>
            </div>
          </div>
        </Box>

        <Box variant="gradient" className="p-6 border-2 border-green-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            Optimized Setup
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual return</span>
              <span className="text-xl font-bold text-green-600">
                ${Math.round(returns.optimized).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Effective rate</span>
              <span className="text-lg font-semibold text-green-600">
                {((returns.optimized / totalSavings) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm text-green-600 font-medium">
                +${Math.round(potentialExtraEarnings).toLocaleString()} extra per year!
              </div>
            </div>
          </div>
        </Box>
      </div>

      {/* Recommendations */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Recommended accounts for you
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => (
            <Box key={index} variant="default" className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{rec.bank}</h3>
                  <p className="text-gray-600">{rec.product}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{rec.rate}%</div>
                  <div className="text-xs text-gray-500">p.a.</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {rec.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {rec.minDeposit && (
                <div className="text-xs text-gray-500 border-t pt-3">
                  Min deposit: ${rec.minDeposit.toLocaleString()}
                  {rec.term && ` • ${rec.term}`}
                </div>
              )}
            </Box>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      <div className="mb-10">
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
                Step-by-step guide to optimize your savings
              </p>
            </div>
          </div>
          <span className={`text-2xl transition-transform duration-200 ${showActionPlan ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>

        {showActionPlan && (
          <div className="mt-6 space-y-4 animate-fadeIn">
            {actionSteps.map((step, index) => (
              <div key={index} className="flex items-start p-4 bg-white rounded-lg border border-gray-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                  ${step.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{step.action}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.detail}</p>
                  <div className="text-sm font-medium text-green-600 mt-2">
                    Impact: {step.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Impact */}
      <Box variant="gradient" className="mb-10 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          💰 What this means over time
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-800">
              ${Math.round(potentialExtraEarnings * 5).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Extra in 5 years</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              ${Math.round(potentialExtraEarnings * 10).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Extra in 10 years</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              ${Math.round(potentialExtraEarnings * 20).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Extra in 20 years</div>
          </div>
        </div>
      </Box>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <button
          onClick={() => setCurrentScreen('initialInsights')}
          className="group flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">Back to insights</span>
        </button>
        
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentScreen('goalPlanning')}
            className="text-sm text-gray-500 hover:text-primary transition-colors duration-200 font-medium"
          >
            Skip for now
          </button>
          
          <PrimaryButton
            onClick={() => {
              // In a real app, this would open bank signup links or next steps
              alert('Opening Heartland Bank signup...');
            }}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Optimizing →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SavingsAnalysisResultsScreen;