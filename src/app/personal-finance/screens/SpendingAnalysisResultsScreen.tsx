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
import { DonutChart } from '@/components/ui/DonutChart';

interface SpendingCategoryCard {
  category: string;
  amount: number;
  percentage: number;
  benchmark: { min: number; max: number };
  status: 'good' | 'high' | 'low';
  icon: string;
  transactionCount?: number;
  transactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
  }>;
}

const SpendingAnalysisResultsScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen } = useScreenNavigation();
  const [selectedTimeframe, setSelectedTimeframe] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'transactions'>('summary');

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
  let spendingToAnalyze = hasTransactionData ? 
    (userData.actualMonthlySpending || userData.spending) : userData.spending;

  // Validate spending amount and provide fallback
  if (spendingToAnalyze <= 0) {
    // Use a reasonable default based on available data
    if (userData.income > 0) {
      // Assume 70% of income as spending if no valid spending data
      spendingToAnalyze = userData.income * 0.7;
    } else {
      // Last resort: use a minimum realistic spending amount
      spendingToAnalyze = 2000; // $2000/month as absolute minimum
    }
  }

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

  // Helper function to format category names
  const formatCategoryName = (category: string): string => {
    // Handle specific problematic category names
    const categoryMappings: { [key: string]: string } = {
      'GOVERNMENT_AND_NON_PROFIT': 'Government & Non-Profit',
      'FOOD_AND_DINING': 'Food & Dining',
      'HEALTH_AND_FITNESS': 'Health & Fitness',
      'HOME_AND_GARDEN': 'Home & Garden',
      'KIDS_AND_PETS': 'Kids & Pets',
      'BUSINESS_SERVICES': 'Business Services',
      'FINANCIAL_SERVICES': 'Financial Services',
      'PERSONAL_CARE': 'Personal Care',
      'AUTO_AND_TRANSPORT': 'Auto & Transport',
      'BILLS_AND_UTILITIES': 'Bills & Utilities',
      'SHOPPING_AND_ENTERTAINMENT': 'Shopping & Entertainment'
    };

    // Check for exact matches first
    if (categoryMappings[category.toUpperCase()]) {
      return categoryMappings[category.toUpperCase()];
    }

    // Format general cases: replace underscores, capitalize words
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to format percentage with 2 decimal places
  const formatPercentageDisplay = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
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
    userData.categorySpending.map(cat => {
      // Get transactions for this category
      const categoryTransactions = userData.transactions?.filter(t => 
        t.category === cat.category && t.isDebit && t.amount > 0
      ).map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount
      })) || [];

      return {
        category: formatCategoryName(cat.category),
        amount: cat.amount,
        percentage: cat.percentage,
        benchmark: { min: 0, max: 15 }, // Generic benchmark
        status: getCategoryStatus(cat.category, cat.percentage),
        icon: getCategoryIcon(cat.category),
        transactionCount: cat.transactionCount,
        transactions: categoryTransactions
      };
    }) : 
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
          {hasTransactionData && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'summary'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📊 Summary
              </button>
              <button
                onClick={() => setViewMode('transactions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'transactions'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 All Transactions
              </button>
            </div>
          )}
        </div>

        {/* Summary stats for real transaction data */}
        {hasTransactionData && userData.categorySpending && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-blue-600 font-medium">Total Analyzed</span>
                  <div className="text-lg font-bold text-blue-800">
                    {formatCurrency(userData.categorySpending.reduce((sum, cat) => sum + cat.amount, 0))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-blue-600 font-medium">Transactions</span>
                  <div className="text-lg font-bold text-blue-800">
                    {userData.transactions?.filter(t => t.isDebit).length || 0}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-blue-600 font-medium">Categories</span>
                  <div className="text-lg font-bold text-blue-800">
                    {userData.categorySpending.length}
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-700">
                📊 Based on your imported transaction data
              </div>
            </div>
          </div>
        )}

        {/* Summary View with Donut Chart */}
        {viewMode === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donut Chart */}
            {hasTransactionData && spendingBreakdown.length > 0 && (
              <Box variant="elevated" className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  Spending Distribution
                </h3>
                <div className="flex justify-center items-center relative z-20 h-64 sm:h-80">
                  <DonutChart 
                    data={spendingBreakdown.map(cat => ({
                      name: cat.category,
                      amount: cat.amount,
                      category: cat.category,
                      icon: cat.icon
                    }))}
                    value='amount'
                    category="category"
                    colors={['blue', 'emerald', 'violet', 'amber', 'red', 'pink', 'teal', 'orange', 'indigo', 'cyan']}
                    valueFormatter={(value: number) => formatCurrency(value)}
                    className="w-64 h-64 sm:w-80 sm:h-80 relative z-30"
                    showTooltip={true}
                  />
                </div>
                {selectedCategory && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-medium text-gray-800">
                      {selectedCategory}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Click on chart segments to highlight categories
                    </div>
                  </div>
                )}
              </Box>
            )}

            {/* Category List */}
            <div className="space-y-3">
              {spendingBreakdown.map((category: SpendingCategoryCard, index: number) => (
                <Box
                  key={index} 
                  variant="elevated"
                  className={`transition-all cursor-pointer ${
                    selectedCategory === category.category 
                      ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.category ? null : category.category
                  )}
                  hoverable={true}
                  padding="md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{category.category}</h3>
                        <p className="text-sm text-gray-600">
                          {formatPercentageDisplay(category.percentage)} of spending
                          {category.transactionCount && (
                            <span className="ml-2">• {category.transactionCount} transactions</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {formatCurrency(category.amount)}
                      </div>
                    </div>
                  </div>
                </Box>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Table View */}
        {viewMode === 'transactions' && hasTransactionData && userData.transactions && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                All Expense Transactions
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {userData.transactions.filter(t => t.isDebit).length} expense transactions
              </p>
            </div>
            
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userData.transactions
                    .filter(t => t.isDebit)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction, index) => (
                      <tr key={transaction.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-NZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {formatCategoryName(transaction.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback for sample data */}
        {!hasTransactionData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spendingBreakdown.map((category: SpendingCategoryCard, index: number) => (
              <Box key={index} variant="default" className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{category.category}</h3>
                      <p className="text-sm text-gray-600">{formatPercentageDisplay(category.percentage)} of spending</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(category.amount)}
                    </div>
                  </div>
                </div>
              </Box>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> {hasTransactionData 
              ? `This breakdown is based on your actual imported transaction data (${userData.transactions?.length || 0} transactions analyzed).`
              : 'This breakdown is estimated based on typical spending patterns. Upload your actual bank transactions for a personalized analysis.'
            }
            {(hasTransactionData ? (userData.actualMonthlySpending || userData.spending) : userData.spending) <= 0 && (
              <span className="block mt-2">
                ⚠️ <strong>Spending data validation:</strong> We detected invalid spending data (${formatCurrency(hasTransactionData ? (userData.actualMonthlySpending || userData.spending) : userData.spending)}). 
                Analysis is based on {userData.income > 0 ? `estimated spending (70% of your ${formatCurrency(userData.income)} income)` : 'a minimum realistic spending amount ($2,000/month)'}.
              </span>
            )}
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
        
        {hasTransactionData && (
          <button
            onClick={() => goToScreen('dataManagement')}
            className="w-full sm:w-40 order-3 sm:order-2 flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4-1.79 4-4M4 7h16M10 11v6M14 11v6" />
            </svg>
            Manage Data
          </button>
        )}
        
        <button
          onClick={() => goToScreen('savingsAnalysisInput')}
          className="w-full sm:w-48 order-2 sm:order-3 flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors rounded-lg"
        >
          Continue to Savings
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default SpendingAnalysisResultsScreen;
