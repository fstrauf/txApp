'use client';

import React, { useState } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { Box } from '@/components/ui/Box';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { 
  analyzeSpending, 
  calculateFinancialRunway,
  validateUserData,
  formatCurrency,
  formatPercentage,
  FINANCIAL_CONFIG
} from '../engine/FinancialRulesEngine';

interface SpendingCategoryCard {
  category: string;
  amount: number;
  percentage: number;
  benchmark: { min: number; max: number };
  status: 'good' | 'high' | 'low';
  icon: string;
}

const SpendingAnalysisResultsScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(12);

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
            onClick={() => goToScreen('spendingAnalysisUpload')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to fix data
          </button>
        </Box>
      </div>
    );
  }

  // Use real transaction data or fallback to sample
  const hasTransactionData = userData.transactions && userData.transactions.length > 0;
  const spendingToAnalyze = hasTransactionData ? 
    (userData.actualMonthlySpending || userData.spending) : userData.spending;

  // Use the rules engine for spending analysis with actual data
  const spendingAnalysis = analyzeSpending({
    ...userData,
    spending: spendingToAnalyze
  });
  const runwayAnalysis = calculateFinancialRunway(userData.savings, spendingToAnalyze, userData.income);

  // Get status color based on spending benchmark
  const getStatusColor = (benchmark: string) => {
    switch (benchmark) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'concerning': return 'text-yellow-600';
      case 'unsustainable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (benchmark: string) => {
    switch (benchmark) {
      case 'excellent': return '🌟';
      case 'good': return '✅';
      case 'concerning': return '⚠️';
      case 'unsustainable': return '🚨';
      default: return '📊';
    }
  };

  // Generate category mapping for icons
  const getCategoryIcon = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('food') || lowerCategory.includes('grocery') || lowerCategory.includes('dining')) return '🍽️';
    if (lowerCategory.includes('transport') || lowerCategory.includes('fuel') || lowerCategory.includes('car')) return '🚗';
    if (lowerCategory.includes('housing') || lowerCategory.includes('rent') || lowerCategory.includes('mortgage')) return '🏠';
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie') || lowerCategory.includes('streaming')) return '🎬';
    if (lowerCategory.includes('shopping') || lowerCategory.includes('retail') || lowerCategory.includes('clothing')) return '🛍️';
    if (lowerCategory.includes('utilities') || lowerCategory.includes('power') || lowerCategory.includes('gas')) return '⚡';
    if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('pharmacy')) return '🏥';
    if (lowerCategory.includes('education') || lowerCategory.includes('school')) return '📚';
    if (lowerCategory.includes('insurance')) return '🛡️';
    if (lowerCategory.includes('travel') || lowerCategory.includes('vacation')) return '✈️';
    return '💰';
  };

  // Get spending status based on benchmark comparison
  const getCategoryStatus = (category: string, percentage: number): 'good' | 'high' | 'low' => {
    const benchmarks = FINANCIAL_CONFIG.SPENDING_BENCHMARKS;
    
    if (category.toLowerCase().includes('housing')) {
      return percentage <= benchmarks.housing.max ? 'good' : 'high';
    } else if (category.toLowerCase().includes('food')) {
      return percentage <= benchmarks.food.max ? 'good' : 'high';
    } else if (category.toLowerCase().includes('transport')) {
      return percentage <= benchmarks.transportation.max ? 'good' : 'high';
    } else if (category.toLowerCase().includes('entertainment')) {
      return percentage <= benchmarks.entertainment.max ? 'good' : 'high';
    }
    
    // Default: consider anything over 15% of total spending as high
    return percentage <= 15 ? 'good' : 'high';
  };

  // Create spending breakdown from real data or sample
  const spendingBreakdown: SpendingCategoryCard[] = hasTransactionData && userData.categorySpending ? 
    userData.categorySpending.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: cat.percentage,
      benchmark: { min: 0, max: 15 }, // Generic benchmark
      status: getCategoryStatus(cat.category, cat.percentage),
      icon: getCategoryIcon(cat.category)
    })) : 
    // Fallback to sample data
    [
      {
        category: 'Housing',
        amount: userData.spending * 0.35,
        percentage: 35,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.housing,
        status: 'good',
        icon: '🏠'
      },
      {
        category: 'Food',
        amount: userData.spending * 0.15,
        percentage: 15,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.food,
        status: 'good',
        icon: '🍽️'
      },
      {
        category: 'Transportation',
        amount: userData.spending * 0.18,
        percentage: 18,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.transportation,
        status: 'good',
        icon: '🚗'
      },
      {
        category: 'Entertainment',
        amount: userData.spending * 0.12,
        percentage: 12,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.entertainment,
        status: 'high',
        icon: '🎬'
      },
      {
        category: 'Shopping',
        amount: userData.spending * 0.10,
        percentage: 10,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.shopping,
        status: 'good',
        icon: '🛍️'
      },
      {
        category: 'Utilities',
        amount: userData.spending * 0.06,
        percentage: 6,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.utilities,
        status: 'good',
        icon: '⚡'
      },
      {
        category: 'Healthcare',
        amount: userData.spending * 0.04,
        percentage: 4,
        benchmark: FINANCIAL_CONFIG.SPENDING_BENCHMARKS.healthcare,
        status: 'low',
        icon: '🏥'
      }
    ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
            Spending Analysis Results
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Your spending is{' '}
          <span className={getStatusColor(spendingAnalysis.spendingBenchmark)}>
            {spendingAnalysis.spendingBenchmark}
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          You spend {formatPercentage(spendingAnalysis.spendingRate)} of your income ({formatCurrency(spendingAnalysis.totalSpending)}/month)
        </p>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Box variant="default" className="p-6 text-center">
          <div className="text-3xl mb-2">{getStatusIcon(spendingAnalysis.spendingBenchmark)}</div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {formatPercentage(spendingAnalysis.spendingRate)}
          </div>
          <div className="text-sm text-gray-600">of income spent</div>
          <div className="text-xs text-gray-500 mt-2">
            Target: ≤{formatPercentage(FINANCIAL_CONFIG.SPENDING_ANALYSIS.goodSpendingRate)}
          </div>
        </Box>

        <Box variant="default" className="p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {runwayAnalysis.months.toFixed(1)} mo
          </div>
          <div className="text-sm text-gray-600">financial runway</div>
          <div className="text-xs text-gray-500 mt-2">
            Target: ≥{FINANCIAL_CONFIG.SPENDING_ANALYSIS.recommendedRunwayMonths} months
          </div>
        </Box>

        <Box variant="default" className="p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(spendingAnalysis.averageDailySpending)}
          </div>
          <div className="text-sm text-gray-600">daily spending</div>
          <div className="text-xs text-gray-500 mt-2">
            {formatCurrency(spendingAnalysis.averageDailySpending * 365)} annually
          </div>
        </Box>
      </div>

      {/* Financial Runway Visualization */}
      <Box variant="gradient" className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          💡 Your financial runway
        </h3>
        
        <p className="text-gray-600 mb-4">{runwayAnalysis.recommendation}</p>
        
        <div className="mb-4">
          <label className="text-sm text-gray-600">Time horizon:</label>
          <div className="flex gap-2 mt-2">
            {[6, 12, 24, 36].map((months) => (
              <button
                key={months}
                onClick={() => setSelectedTimeframe(months)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTimeframe === months 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {months} mo
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white bg-opacity-50 rounded-lg p-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">
              At your current spending rate, your savings would last{' '}
              <span className={runwayAnalysis.isHealthy ? 'text-green-600' : 'text-red-600'}>
                {runwayAnalysis.months < 999 ? `${runwayAnalysis.months.toFixed(1)} months` : 'indefinitely'}
              </span>
            </p>
          </div>
        </div>
      </Box>

      {/* Spending Category Breakdown */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Spending breakdown
          </h2>
          <button
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {showDetailedBreakdown ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spendingBreakdown.map((category: SpendingCategoryCard, index: number) => (
            <Box key={index} variant="default" className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{category.category}</h3>
                    <p className="text-sm text-gray-600">{category.percentage}% of spending</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className={`text-xs ${
                    category.status === 'good' ? 'text-green-600' :
                    category.status === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {category.status === 'good' ? '✓ Within range' :
                     category.status === 'high' ? '⚠ Above benchmark' : '? Below typical'}
                  </div>
                </div>
              </div>
              
              {showDetailedBreakdown && (
                <div className="text-xs text-gray-500 border-t pt-3">
                  Benchmark: {formatPercentage(category.benchmark.min)} - {formatPercentage(category.benchmark.max)} of income
                </div>
              )}
            </Box>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> {hasTransactionData 
              ? `This breakdown is based on your actual imported transaction data (${userData.transactions?.length || 0} transactions analyzed).`
              : 'This breakdown is estimated based on typical spending patterns. Upload your actual bank transactions for a personalized analysis.'
            }
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Personalized recommendations
        </h2>
        <div className="space-y-4">
          {spendingAnalysis.recommendations.map((recommendation, index) => (
            <Box key={index} variant="default" className="p-6">
              <div className="flex items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                  ${recommendation.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    recommendation.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                    'bg-green-100 text-green-600'}`}>
                  {recommendation.priority === 'high' ? '🚨' : 
                   recommendation.priority === 'medium' ? '⚠️' : '💡'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{recommendation.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                        recommendation.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'}`}>
                      {recommendation.priority} priority
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{recommendation.description}</p>
                  
                  {recommendation.potentialSavings > 0 && (
                    <div className="text-sm font-medium text-green-600 mb-3">
                      Potential savings: {formatCurrency(recommendation.potentialSavings)}/month
                      <span className="text-gray-500"> • {recommendation.timeframe}</span>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Action steps:</p>
                    <ul className="space-y-1">
                      {recommendation.actionSteps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-gray-600 flex items-start">
                          <span className="text-gray-400 mr-2 mt-0.5">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Box>
          ))}
        </div>
      </div>

      {/* Educational Insight */}
      <InsightCard
        type="optimize"
        icon="📚"
        title="Understanding your spending patterns"
        text="Tracking spending by category helps identify where your money actually goes versus where you think it goes. Most people underestimate certain categories by 20-40%."
        action="The 50/30/20 rule: 50% needs, 30% wants, 20% savings is a good starting framework for budget allocation."
        benchmark="Top spending optimization: Housing (mortgage vs rent), Transportation (car vs alternatives), Food (cooking vs dining out)"
      />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12">
        <button
          onClick={() => goToScreen('spendingAnalysisUpload')}
          className="w-full sm:w-48 order-1 sm:order-1 flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-indigo-700 font-medium transition-colors border border-gray-200 rounded-lg bg-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Upload
        </button>
        <button
          onClick={() => goToScreen('savingsAnalysisInput')}
          className="w-full sm:w-48 order-2 sm:order-2 flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors rounded-lg"
        >
          Continue to Savings
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default SpendingAnalysisResultsScreen;
