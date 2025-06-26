'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useFinancialAnalytics } from '../hooks/useFinancialAnalytics';
import { Box } from '@/components/ui/Box';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AdvancedFinancialAnalyticsProps {
  transactions: any[];
  autoAnalyze?: boolean;
  className?: string;
}

// Utility function for consistent number formatting
const formatCurrency = (amount: number, decimals: number = 0): string => {
  return amount.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const AdvancedFinancialAnalytics: React.FC<AdvancedFinancialAnalyticsProps> = ({
  transactions,
  autoAnalyze = true,
  className = ''
}) => {
  const [excludedCategoriesState, setExcludedCategoriesState] = useState<string[]>([]);
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  // Debug transaction data structure
  React.useEffect(() => {
    if (transactions.length > 0) {
      console.log('🔍 Transaction data sample:', transactions[0]);
      console.log('🔍 Transaction keys:', Object.keys(transactions[0]));
      console.log('🔍 Total transactions:', transactions.length);
    }
  }, [transactions]);

  // Get unique categories from transactions for configuration
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach(tx => {
      // Check all possible category field names
      if (tx.category) categories.add(tx.category);
      if (tx.Category) categories.add(tx.Category);
      if (tx.categoryName) categories.add(tx.categoryName);
      if (tx.category_name) categories.add(tx.category_name);
      if (tx.transactionCategory) categories.add(tx.transactionCategory);
    });
    console.log('🏷️ Found categories:', Array.from(categories));
    return Array.from(categories).sort();
  }, [transactions]);

  // Memoize excluded categories to prevent query re-runs
  const excludedCategories = useMemo(() => {
    return excludedCategoriesState;
  }, [excludedCategoriesState]);

  // Set default excluded categories on first load - use ref to prevent re-initialization
  const hasInitializedExcluded = useRef(false);
  React.useEffect(() => {
    if (uniqueCategories.length > 0 && !hasInitializedExcluded.current) {
      const defaultExcluded = [
        'living', 'rent', 'housing', 'mortgage', 'utilities', 'electric', 'gas', 'water',
        'groceries', 'food', 'fuel', 'transport', 'medical', 'insurance'
      ];
      const matchingCategories = uniqueCategories.filter(cat => 
        defaultExcluded.some(excluded => cat.toLowerCase().includes(excluded.toLowerCase()))
      );
      console.log('🎯 Setting default excluded categories:', matchingCategories);
      setExcludedCategoriesState(matchingCategories);
      hasInitializedExcluded.current = true;
    }
  }, [uniqueCategories]);

  const {
    result,
    isLoading,
    error,
    analyzeTransactions,
    refetch,
    clearError,
    getTopVendors,
    getAnomalies,
    getSavingsOpportunities,
    getCashFlowInsights,
    hasData,
    canAnalyze,
    transactionCount
  } = useFinancialAnalytics({
    transactions,
    excludedCategories, // Now properly memoized
    enabled: autoAnalyze
  });

  const handleManualAnalyze = async () => {
    console.log('🎯 Starting manual analysis with excluded categories:', excludedCategories);
    console.log('🎯 Transaction data being sent:', {
      count: transactions.length,
      sampleTransaction: transactions[0],
      categories: uniqueCategories
    });
    await analyzeTransactions({
      transactions,
      analysis_types: [
        'vendor_intelligence',
        'anomaly_detection',
        'subscription_analysis',
        'savings_opportunities',
        'cash_flow_prediction'
      ],
      excluded_categories: excludedCategories
    });
  };

  const handleRetry = () => {
    clearError();
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <Box variant="default" className={`p-3 sm:p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-sm sm:text-base text-gray-600">
            Analyzing {transactionCount} transactions with advanced AI insights...
          </span>
        </div>
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Processing vendor intelligence, anomaly detection, spending patterns, and savings opportunities
          </p>
        </div>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box variant="default" className={`p-3 sm:p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-red-800">Analysis Failed</h3>
            <p className="mt-1 text-xs sm:text-sm text-red-700">{error}</p>
            <div className="mt-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Retry Analysis
              </button>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  // Manual trigger for insufficient data
  if (!canAnalyze) {
    return (
      <Box variant="default" className={`p-3 sm:p-6 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Advanced Analytics Available</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Add more transactions ({transactionCount}/10 minimum) to unlock advanced AI-powered insights including vendor intelligence, anomaly detection, and personalized savings recommendations.
          </p>
        </div>
      </Box>
    );
  }

  // Manual trigger state
  if (!hasData && !autoAnalyze) {
    return (
      <Box variant="gradient" className={`p-3 sm:p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Advanced Financial Analytics</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Analyze {transactionCount} transactions with AI-powered insights including vendor intelligence, spending patterns, anomaly detection, and personalized savings opportunities.
          </p>
          <button
            onClick={handleManualAnalyze}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            <ChartBarIcon className="h-5 w-5" />
            Start Advanced Analysis
          </button>
        </div>
      </Box>
    );
  }

  // Results display
  if (!result) return null;

  const topVendors = getTopVendors(5);
  const highAnomalies = getAnomalies('high');
  const mediumAnomalies = getAnomalies('medium');
  const savingsOpportunities = getSavingsOpportunities(4);
  const cashFlowInsights = getCashFlowInsights();

  return (
    <Box variant="gradient" className={`p-3 sm:p-6 w-full max-w-none ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
          <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-3" />
          Advanced Financial Analytics
          <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-xs sm:text-sm rounded-full">
            AI-Powered
          </span>
        </h3>
        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>📊 {transactionCount} transactions analyzed</span>
          <span>📅 {new Date(result.analysis_period.start_date).toLocaleDateString()} - {new Date(result.analysis_period.end_date).toLocaleDateString()}</span>
          <span>🏷️ {result.categories_found.all_categories.length} categories found</span>
        </div>
      </div>

      {/* Category Configuration for All Analytics */}
      {uniqueCategories.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 sm:p-5 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowCategorySettings(!showCategorySettings)}
              className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 transition-colors font-medium text-sm sm:text-base"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Analytics Settings
                              <span className="text-xs sm:text-sm text-indigo-600 bg-white px-2 py-1 rounded-full">
                {uniqueCategories.length - excludedCategories.length}/{uniqueCategories.length} included
              </span>
            </button>
            <button
              onClick={() => setShowCategorySettings(!showCategorySettings)}
              className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full transition-colors"
            >
              {showCategorySettings ? 'Hide' : 'Configure'}
            </button>
          </div>
          
          {showCategorySettings && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-indigo-700">
                Select which categories to include in all financial analytics. Essential expenses like rent and utilities are excluded by default to focus on discretionary spending patterns.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {uniqueCategories.map((category) => {
                  const isExcluded = excludedCategories.includes(category);
                  return (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Include category (remove from excluded)
                            setExcludedCategoriesState(prev => prev.filter(cat => cat !== category));
                          } else {
                            // Exclude category (add to excluded)
                            setExcludedCategoriesState(prev => [...prev, category]);
                          }
                        }}
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <span className={`text-xs sm:text-sm transition-all group-hover:text-indigo-600 ${
                        isExcluded ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}>
                        {category}
                      </span>
                    </label>
                  );
                })}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-indigo-200">
                <button
                  onClick={() => setExcludedCategoriesState([])}
                  className="px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Include All
                </button>
                <button
                  onClick={() => {
                    const essentialCategories = uniqueCategories.filter(cat => 
                      ['living', 'rent', 'housing', 'mortgage', 'utilities', 'electric', 'gas', 'water',
                       'groceries', 'food', 'fuel', 'transport', 'medical', 'insurance']
                        .some(essential => cat.toLowerCase().includes(essential.toLowerCase()))
                    );
                    setExcludedCategoriesState(essentialCategories);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
              
              <div className="bg-white border border-indigo-200 rounded-lg p-3 sm:p-4">
                                  <div className="text-xs sm:text-sm text-indigo-800">
                    <p className="font-medium mb-3 text-indigo-900">How this affects your analytics:</p>
                    <div className="grid md:grid-cols-2 gap-2 sm:gap-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div><strong>Vendor Intelligence:</strong> Excluded categories won't appear in top spending vendors</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div><strong>Anomaly Detection:</strong> Unusual transactions in excluded categories will be ignored</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div><strong>Subscription Analysis:</strong> Potential subscriptions in excluded categories won't be detected</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div><strong>Savings Opportunities:</strong> Excluded categories won't be suggested for reduction</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div><strong>Cash Flow:</strong> Excluded expenses won't count toward discretionary spending predictions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {excludedCategories.length !== uniqueCategories.length && hasData && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-amber-800">Settings Updated</p>
                        <p className="text-xs sm:text-sm text-amber-700">Changes will take effect after running a new analysis</p>
                      </div>
                    </div>
                    <button
                      onClick={handleManualAnalyze}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex-shrink-0"
                    >
                      Re-analyze Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 w-full">
        {/* Vendor Intelligence */}
        <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 w-full min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 text-blue-500 mr-2" />
            Top Spending Vendors
          </h4>
          <div className="space-y-3">
            {topVendors.map((vendor, index) => {
              const vendorName = vendor.name || 'Unknown Vendor'; // Fixed: use 'name' not 'vendor'
              
              return (
                <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{vendorName}</p>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {vendor.category || 'Unknown'}
                      </span>
                    </div>
                                          <p className="text-xs sm:text-sm text-gray-600">
                        {formatNumber(vendor.visit_count || 0)} visits
                        {vendor.visits_per_month && ` • ${vendor.visits_per_month.toFixed(1)}/month`}
                      </p>
                  </div>
                                      <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-red-600">{formatCurrency(vendor.total_spent || 0)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{formatCurrency(vendor.average_transaction || 0, 2)} avg</p>
                    </div>
                </div>
              );
            })}
          </div>
          {result.insights.vendor_intelligence.insights.length > 0 && (
            <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                💡 {result.insights.vendor_intelligence.insights[0]}
              </p>
            </div>
          )}
        </div>

        {/* Anomaly Detection */}
        <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 w-full min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
            Spending Anomalies
          </h4>
          <div className="space-y-3">
            {highAnomalies.length > 0 ? (
              <>
                {highAnomalies.slice(0, 3).map((anomaly, index) => (
                  <div key={index} className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-red-800">
                          {anomaly.type === 'large_transaction' ? 'Unusually Large Purchase' : 'Spending Alert'}
                        </p>
                        <p className="text-xs sm:text-sm text-red-600">
                          {anomaly.vendor && `${anomaly.vendor}`}
                          {anomaly.category && ` (${anomaly.category})`}
                          {anomaly.description && ` - ${anomaly.description}`}
                        </p>
                      </div>
                                              {anomaly.amount && (
                          <p className="text-sm sm:text-base font-semibold text-red-700">{formatCurrency(anomaly.amount)}</p>
                        )}
                    </div>
                  </div>
                ))}
                {mediumAnomalies.slice(0, 2).map((anomaly, index) => (
                  <div key={`medium-${index}`} className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-yellow-800">
                          {anomaly.type === 'potential_subscription' ? 'Recurring Payment Detected' : 'Spending Pattern'}
                        </p>
                        <p className="text-xs sm:text-sm text-yellow-600">
                          {anomaly.vendor && `${anomaly.vendor}`}
                          {anomaly.category && ` (${anomaly.category})`}
                        
                        </p>
                      </div>
                                              {anomaly.amount && (
                          <p className="text-sm sm:text-base font-semibold text-yellow-700">{formatCurrency(anomaly.amount, 2)}</p>
                        )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>✅ No significant anomalies detected</p>
                <p className="text-xs sm:text-sm mt-1">Your spending patterns look normal</p>
              </div>
            )}
          </div>
        </div>
      </div>

             {/* Subscription Analysis */}
       {result.insights.subscription_analysis && (
         <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200 mb-4 sm:mb-6 w-full overflow-hidden">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
             <h4 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center min-w-0">
               <CalendarIcon className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
               <span className="truncate">Subscription Analysis</span>
             </h4>
             <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
               📊 Predicted amounts
             </div>
           </div>
           
           {result.insights.subscription_analysis.subscriptions && result.insights.subscription_analysis.subscriptions.length > 0 && (
             <div className="space-y-3 mb-4">
               <h5 className="text-sm sm:text-base font-medium text-gray-700">
                 Detected Subscriptions ({result.insights.subscription_analysis.subscriptions.length})
               </h5>
               <div className="space-y-3">
                 {result.insights.subscription_analysis.subscriptions.slice(0, 5).map((subscription: any, index: number) => (
                   <div key={index} className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                       <div className="flex-1 min-w-0">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                           <h6 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                             {subscription.vendor || 'Unknown Vendor'}
                           </h6>
                           <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0 w-fit">
                             {subscription.category || 'Unknown'}
                           </span>
                         </div>
                         <p className="text-xs sm:text-sm text-gray-600 break-words">
                           {subscription.frequency || 0} transactions • Avg: {formatCurrency(subscription.average_amount || 0, 2)}
                           {subscription.date_range_days && ` • ${subscription.date_range_days} days span`}
                         </p>
                       </div>
                       <div className="text-left sm:text-right flex-shrink-0">
                         <p className="text-sm sm:text-base font-semibold text-red-600">
                           {formatCurrency(subscription.projected_annual_cost || 0)}/year
                         </p>
                         <p className="text-xs sm:text-sm text-gray-500">
                           {formatCurrency(subscription.monthly_estimate || 0)}/month
                         </p>
                         <p className="text-xs text-gray-400">
                           Total: {formatCurrency(subscription.total_spent_so_far || 0)}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
           
           {result.insights.subscription_analysis.insights && result.insights.subscription_analysis.insights.length > 0 && (
             <div className="mt-3 sm:mt-4 p-3 bg-purple-50 rounded-lg">
               <p className="text-xs sm:text-sm text-purple-800 break-words">
                 💡 {result.insights.subscription_analysis.insights[0]}
               </p>
             </div>
           )}
           
           {(!result.insights.subscription_analysis.subscriptions || result.insights.subscription_analysis.subscriptions.length === 0) && (
             <div className="text-center py-4 sm:py-6 text-gray-500">
               <p>✅ No recurring subscriptions detected</p>
               <p className="text-xs sm:text-sm mt-1">Your spending appears to be mostly one-time purchases</p>
               <p className="text-xs mt-2">Essential expenses like rent and utilities are excluded from this analysis</p>
             </div>
           )}
         </div>
       )}

      {/* Footer */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          Analysis powered by advanced AI algorithms • Last updated: {new Date(result.processed_at).toLocaleString()}
        </p>
        <button
          onClick={() => {
            refetch();
          }}
          className="mt-2 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh Analysis
        </button>
      </div>
    </Box>
  );
}; 