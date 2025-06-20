import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { mockFinancialAnalytics } from '../utils/mockData';

interface FinancialAnalyticsRequest {
  transactions: any[];
  analysis_types?: string[];
  excluded_categories?: string[];
}

interface VendorIntelligence {
  name: string; // API returns 'name', not 'vendor'
  total_spent: number;
  visit_count: number; // API returns 'visit_count', not 'transaction_count'
  average_transaction: number; // API returns 'average_transaction', not 'average_amount'
  first_visit: string; // API returns 'first_visit', not 'first_seen'
  last_visit: string; // API returns 'last_visit', not 'last_seen'
  category: string; // API includes category
  visits_per_month?: number; // API includes this
}

interface Anomaly {
  amount: number;
  category: string;
  date: string;
  description: string;
  severity: string;
  type: string;
  vendor: string;
  frequency?: number; // Some anomalies have frequency for subscriptions
}

interface SubscriptionAnalysis {
  subscriptions: Array<{
    vendor: string;
    frequency: number;
    average_amount: number;
    category: string;
    projected_annual_cost: number;
    monthly_estimate: number;
    total_spent_so_far: number;
    severity: string;
    first_transaction: string;
    last_transaction: string;
    date_range_days: number;
  }>;
  insights: string[];
  summary?: {
    total_subscriptions_detected: number;
    total_projected_annual_cost: number;
    average_monthly_cost: number;
    highest_cost_subscription: string;
    highest_annual_cost: number;
    total_spent_so_far: number;
  };
}

interface SavingsOpportunity {
  category: string;
  current_spending: number;
  potential_savings: number;
  recommendation: string;
  type: string; // 'category_reduction' or 'vendor_consolidation'
  vendors?: string[]; // For vendor consolidation opportunities
}

interface CashFlowPrediction {
  weekly_spending_estimate: number;
  weekly_income_estimate: number;
  weekly_net: number;
  monthly_net_estimate: number;
}

interface FinancialAnalyticsResult {
  user_id: string;
  analysis_period: {
    start_date: string;
    end_date: string;
    total_transactions: number;
  };
  categories_found: {
    all_categories: string[];
    spending_categories: string[];
    income_categories: string[];
    transfer_categories: string[];
  };
  insights: {
    vendor_intelligence: {
      vendors: VendorIntelligence[];
      insights: string[];
    };
    anomaly_detection: {
      anomalies: Anomaly[];
      insights: string[];
    };
    subscription_analysis: SubscriptionAnalysis;
    savings_opportunities: {
      opportunities: SavingsOpportunity[];
      insights: string[];
    };
    cash_flow_prediction: {
      predictions: CashFlowPrediction;
      insights: string[];
    };
  };
  processed_at: string;
}

// Function to fetch financial analytics
const fetchFinancialAnalytics = async (request: FinancialAnalyticsRequest): Promise<FinancialAnalyticsResult> => {
  console.log('📤 Sending request to financial-analytics API:', {
    transaction_count: request.transactions.length,
    analysis_types: request.analysis_types,
    excluded_categories: request.excluded_categories,
    sample_transaction: request.transactions[0]
  });

  const response = await fetch('/api/financial-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  const result = await response.json();
  console.log('📥 Received response from financial-analytics API:', {
    categories_found: result.categories_found,
    vendors_count: result.insights?.vendor_intelligence?.vendors?.length || 0,
    anomalies_count: result.insights?.anomaly_detection?.anomalies?.length || 0
  });

  return result;
};

interface UseFinancialAnalyticsOptions {
  transactions?: any[];
  analysisTypes?: string[];
  excludedCategories?: string[];
  enabled?: boolean;
}

export const useFinancialAnalytics = (options: UseFinancialAnalyticsOptions = {}) => {
  const { 
    transactions = [],
    analysisTypes = [
      'vendor_intelligence',
      'anomaly_detection', 
      'subscription_analysis',
      'savings_opportunities',
      'cash_flow_prediction'
    ],
    excludedCategories = [],
    enabled = true
  } = options;
  
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Simple, stable query key - no complex memoization
  const userId = session?.user?.id;
  const transactionCount = transactions.length;
  const excludedCategoriesString = excludedCategories.sort().join(',');
  
  // Check if we're dealing with mock data (first-time users)
  const isMockData = transactions.length > 0 && transactions[0]?.id?.startsWith('mock-');
  const shouldAnalyze = enabled && (!!userId || isMockData) && transactionCount > 5;

  // Create a stable, unique key that won't change unnecessarily
  const queryKey = useMemo(() => [
    'financialAnalytics', 
    userId || 'demo-user', 
    transactionCount, 
    excludedCategoriesString,
    isMockData
  ], [userId, transactionCount, excludedCategoriesString, isMockData]);

  console.log('🔑 Memoized query key:', queryKey, 'Enabled:', shouldAnalyze);

  // Query for financial analytics - automatically runs when transactions are available
  const {
    data: result,
    isLoading,
    error,
    refetch: analyzeTransactions,
    isRefetching
  } = useQuery<FinancialAnalyticsResult, Error>({
    queryKey,
    queryFn: async () => {
      console.log(`🔍 [${Date.now()}] Starting financial analysis for ${transactions.length} transactions`);
      
      // If we're dealing with mock data (first-time users), return mock analytics
      if (isMockData) {
        console.log('🎭 Using mock financial analytics for demo user');
        // Add a small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        return mockFinancialAnalytics as FinancialAnalyticsResult;
      }
      
      const analyticsResult = await fetchFinancialAnalytics({
        transactions,
        analysis_types: analysisTypes,
        excluded_categories: excludedCategories
      });

      console.log(`✅ [${Date.now()}] Financial analysis completed`);
      return analyticsResult;
    },
    enabled: shouldAnalyze,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer to prevent frequent calls
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false // This is key - don't refetch on mount if data exists
  });

  // Mutation for manual analysis with different parameters
  const analysisMutation = useMutation<FinancialAnalyticsResult, Error, FinancialAnalyticsRequest>({
    mutationFn: async (request) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }
      
      if (!request.transactions || request.transactions.length === 0) {
        throw new Error('No transactions provided for analysis');
      }

      console.log(`🔍 Manual financial analysis for ${request.transactions.length} transactions`);
      
      // Track analytics request
      posthog.capture('financial_analytics_requested', {
        user_id: session.user.id,
        transaction_count: request.transactions.length,
        analysis_types: request.analysis_types || ['all'],
        is_manual: true
      });

      const analyticsResult = await fetchFinancialAnalytics(request);
      
      // Track successful analysis
      posthog.capture('financial_analytics_completed', {
        user_id: session.user.id,
        transaction_count: analyticsResult.analysis_period.total_transactions,
        categories_found: analyticsResult.categories_found.all_categories.length,
        vendor_count: analyticsResult.insights.vendor_intelligence.vendors.length,
        anomalies_found: analyticsResult.insights.anomaly_detection.anomalies.length,
        savings_opportunities: analyticsResult.insights.savings_opportunities.opportunities.length,
        is_manual: true
      });

      return analyticsResult;
    },
    onSuccess: (data) => {
      // Update the query cache with the new results
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
      // Track analytics error
      posthog.capture('financial_analytics_failed', {
        user_id: session?.user?.id,
        error: error.message,
        transaction_count: transactions.length,
        is_manual: true
      });
      console.error('❌ Financial analytics error:', error);
    }
  });

  // Manual analyze function
  const analyzeManually = useCallback(async (request: FinancialAnalyticsRequest) => {
    return analysisMutation.mutateAsync(request);
  }, [analysisMutation]);

  const clearError = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['financialAnalytics'] });
  }, [queryClient]);

  const clearResult = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['financialAnalytics'] });
  }, [queryClient]);

  const invalidateAndRefresh = useCallback(() => {
    // Invalidate current cache and force a fresh fetch
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    // Main data and states
    result,
    isLoading: isLoading || analysisMutation.isPending,
    error: error?.message || analysisMutation.error?.message || null,
    isRefetching,
    
    // Functions
    analyzeTransactions: analyzeManually,
    refetch: invalidateAndRefresh, // Use invalidation instead of direct refetch
    clearError,
    clearResult,
    invalidateAndRefresh, // Expose the invalidation function
    
    // Helper functions for specific insights
    getTopVendors: useCallback((limit = 5) => {
      return result?.insights.vendor_intelligence.vendors.slice(0, limit) || [];
    }, [result]),
    
    getAnomalies: useCallback((severity?: 'low' | 'medium' | 'high') => {
      const anomalies = result?.insights.anomaly_detection.anomalies || [];
      if (severity) {
        return anomalies.filter(a => a.severity === severity);
      }
      return anomalies;
    }, [result]),
    
    getSavingsOpportunities: useCallback((limit = 3) => {
      return result?.insights.savings_opportunities.opportunities.slice(0, limit) || [];
    }, [result]),
    
    getCashFlowInsights: useCallback(() => {
      return result?.insights.cash_flow_prediction.insights || [];
    }, [result]),

    // Status flags
    hasData: !!result,
    canAnalyze: shouldAnalyze, // This now includes mock data check
    transactionCount: transactions.length
  };
}; 