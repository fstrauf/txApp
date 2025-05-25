/**
 * React Hook for AI Financial Advisor
 * 
 * This hook provides an easy way to integrate AI-powered financial advice
 * into any React component in the personal finance app.
 */

import { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { financialAdvisorService } from './financial-advisor-service';
import type { AIFinancialInsight, FinancialAdvisorQuery } from './index';

interface UseFinancialAdvisorOptions {
  autoLoad?: boolean;
  context?: 'general' | 'savings_optimization' | 'spending_analysis' | 'goal_planning';
}

export function useFinancialAdvisor(options: UseFinancialAdvisorOptions = {}) {
  const { userData } = usePersonalFinanceStore();
  const [insight, setInsight] = useState<AIFinancialInsight | null>(null);
  const [healthCheck, setHealthCheck] = useState<{
    score: number;
    summary: string;
    topPriorities: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoLoad = false, context = 'general' } = options;

  /**
   * Get personalized financial advice
   */
  const getAdvice = async (question?: string, specificContext?: string) => {
    if (!userData.income || !userData.spending) {
      setError('Complete financial data required for AI advice');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: {
            income: userData.income,
            spending: userData.spending,
            savings: userData.savings || 0,
            savingsBreakdown: userData.savingsBreakdown,
            savingsGoal: userData.savingsGoal,
          },
          question,
          context: (specificContext || context),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI advice');
      }

      const result = await response.json();
      setInsight(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI advice');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get financial health check
   */
  const getHealthCheck = async () => {
    if (!userData.income || !userData.spending) {
      setError('Complete financial data required for health check');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: {
            income: userData.income,
            spending: userData.spending,
            savings: userData.savings || 0,
            savingsBreakdown: userData.savingsBreakdown,
          },
          context: 'health_check',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get health check');
      }

      const result = await response.json();
      if (result.healthCheck) {
        setHealthCheck(result.healthCheck);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get health check');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear current insight and error state
   */
  const clearInsight = () => {
    setInsight(null);
    setError(null);
  };

  /**
   * Auto-load advice when component mounts (if enabled)
   */
  useEffect(() => {
    if (autoLoad && userData.income && userData.spending && !insight && !loading) {
      getAdvice();
    }
  }, [autoLoad, userData.income, userData.spending]);

  return {
    insight,
    healthCheck,
    loading,
    error,
    getAdvice,
    getHealthCheck,
    clearInsight,
    // Helper flags
    hasData: Boolean(userData.income && userData.spending),
    isReady: Boolean(userData.income && userData.spending && !loading),
  };
}

/**
 * Hook specifically for financial health scoring
 */
export function useFinancialHealth() {
  const { userData } = usePersonalFinanceStore();
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateScore = async () => {
    if (!userData.income || !userData.spending) return;

    setLoading(true);
    try {
      const response = await fetch('/api/financial-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: {
            income: userData.income,
            spending: userData.spending,
            savings: userData.savings || 0,
            savingsBreakdown: userData.savingsBreakdown,
          },
          context: 'health_check',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.healthCheck) {
          setScore(result.healthCheck.score);
        }
      }
    } catch (error) {
      console.error('Failed to calculate financial health score:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData.income && userData.spending) {
      calculateScore();
    }
  }, [userData.income, userData.spending, userData.savings]);

  return {
    score,
    loading,
    recalculate: calculateScore,
    getScoreColor: (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      if (score >= 40) return 'text-orange-600';
      return 'text-red-600';
    },
    getScoreLabel: (score: number) => {
      if (score >= 80) return 'Excellent';
      if (score >= 60) return 'Good';
      if (score >= 40) return 'Fair';
      return 'Needs Work';
    },
  };
}
