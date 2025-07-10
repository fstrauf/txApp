/**
 * AI-Powered Financial Insights Component
 * 
 * This component displays personalized financial advice from the AI advisor
 * alongside the rules-based engine insights.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@/components/ui/Box';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { useFinancialAdvisor, useFinancialHealth } from '../ai/useFinancialAdvisor';
import type { AIRecommendation } from '../ai/index';
import { 
  CpuChipIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  LightBulbIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface AIFinancialInsightsProps {
  context?: 'general' | 'savings_optimization' | 'spending_analysis' | 'goal_planning';
  showHealthScore?: boolean;
  className?: string;
}

export const AIFinancialInsights: React.FC<AIFinancialInsightsProps> = ({
  context = 'general',
  showHealthScore = true,
  className = '',
}) => {
  const { 
    insight, 
    healthCheck, 
    loading, 
    error, 
    getAdvice, 
    getHealthCheck, 
    hasData,
    isReady 
  } = useFinancialAdvisor({ context }); // Removed userData prop
  
  const { score, getScoreColor, getScoreLabel } = useFinancialHealth();
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Use ref to track if we've already triggered auto-advice to prevent duplicate calls
  const hasTriggeredAutoAdvice = useRef(false);

  // Optimized auto-trigger - only runs once when conditions are met
  useEffect(() => {
    if (hasData && !insight && !loading && !error && !hasTriggeredAutoAdvice.current) {
      console.log('Auto-triggering AI advice for userData:', { hasData, insight: !!insight, loading, error });
      getAdvice();
      hasTriggeredAutoAdvice.current = true;
    }
  }, [hasData, insight, loading, error]); // Removed getAdvice dependency - it's stable

  if (!hasData) {
    return (
      <Box variant="default" className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="mb-4"><CpuChipIcon className="h-10 w-10 text-indigo-600" /></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            AI Financial Advisor
          </h3>
          <p className="text-gray-600 mb-4">
            Complete your financial profile to get personalized AI-powered insights.
          </p>
        </div>
      </Box>
    );
  }

  const handleGetAdvice = () => {
    if (showCustomInput && customQuestion.trim()) {
      getAdvice(customQuestion);
      setCustomQuestion('');
      setShowCustomInput(false);
    } else {
      getAdvice();
    }
  };

  const handleAskCustomQuestion = () => {
    setShowCustomInput(!showCustomInput);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      case 'medium': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default: return <LightBulbIcon className="h-4 w-4 text-indigo-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insight': return <LightBulbIcon className="h-4 w-4" />;
      case 'action': return <FlagIcon className="h-4 w-4" />;
      case 'warning': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'education': return <AcademicCapIcon className="h-4 w-4" />;
      default: return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Health Score Section */}
      {showHealthScore && score !== null && (
        <Box variant="gradient" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Financial Health Score
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered assessment of your financial wellness
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className={`text-sm font-medium ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </div>
            </div>
          </div>
          
          {!healthCheck && (
            <PrimaryButton
              onClick={getHealthCheck}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Get Detailed Health Check'}
            </PrimaryButton>
          )}
        </Box>
      )}

      {/* Health Check Details */}
      {healthCheck && (
        <Box variant="default" className="p-6">
          <h4 className="font-semibold text-gray-800 mb-3">
            <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> Health Check Summary
          </h4>
          <p className="text-gray-700 mb-4">{healthCheck.summary}</p>
          
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800">Top Priorities:</h5>
            {healthCheck.topPriorities.map((priority, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                {priority}
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Main AI Insights */}
      <Box variant="default" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CpuChipIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> AI Financial Advisor
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Beta
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              Personalized insights powered by AI and validated by our rules engine
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Custom Question Input */}
        {showCustomInput && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask the AI advisor a specific question:
            </label>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g., Should I pay off debt or invest first? How much should I save for a house deposit?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <PrimaryButton
                onClick={handleGetAdvice}
                disabled={!customQuestion.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Getting Answer...' : 'Ask AI Advisor'}
              </PrimaryButton>
              <PrimaryButton
                onClick={() => setShowCustomInput(false)}
                variant="secondary"
                className="px-4"
              >
                Cancel
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!insight && (
          <div className="flex gap-3 mb-4">
            <PrimaryButton
              onClick={handleGetAdvice}
              disabled={loading || !isReady}
              className="flex-1"
            >
              {loading ? 'Analyzing...' : 'Get AI Insights'}
            </PrimaryButton>
            <PrimaryButton
              onClick={handleAskCustomQuestion}
              variant="secondary"
              className="px-4"
            >
              Ask Question
            </PrimaryButton>
          </div>
        )}

        {/* AI Insights Display */}
        {insight && (
          <div className="space-y-4">
            {/* Personalized Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{insight.personalizedMessage}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800"><FlagIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> Recommendations</h4>
              {insight.recommendations?.map((rec: AIRecommendation, index: number) => (
                <div
                  key={rec.id || index}
                  className={`p-4 rounded-lg border ${
                    rec.validatedByRules 
                      ? 'bg-white border-gray-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <span className="mr-2">{getTypeIcon(rec.type)}</span>
                      <span className="mr-2">{getPriorityIcon(rec.priority)}</span>
                      <h5 className="font-medium text-gray-800">{rec.title}</h5>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        rec.confidence >= 0.8 
                          ? 'bg-green-100 text-green-800' 
                          : rec.confidence >= 0.6 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {Math.round(rec.confidence * 100)}% confident
                      </span>
                      {!rec.validatedByRules && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Review needed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-2">{rec.description}</p>
                  <p className="text-gray-600 text-xs mb-3">{rec.reasoning}</p>
                  
                  {rec.actionSteps && rec.actionSteps.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-700 mb-1">Action Steps:</h6>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Next Steps */}
            {insight.nextSteps?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2"><DocumentTextIcon className="h-5 w-5 text-green-600 mr-2 inline" /> Next Steps</h4>
                <ul className="space-y-1">
                  {insight.nextSteps.map((step, index) => (
                    <li key={index} className="text-green-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Educational Topics */}
            {insight.educationalTopics?.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2"><AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2 inline" /> Learn More About</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.educationalTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Insights */}
            {insight?.transactionInsights && (
              <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">
                  <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2 inline" />
                  Smart Transaction Analysis
                </h4>
                
                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-purple-800 font-medium">{insight.transactionInsights.summary}</p>
                </div>

                {/* Recurring Expenses */}
                {insight.transactionInsights.recurringExpenses?.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">💰 Recurring Expenses That Add Up</h5>
                    <div className="grid gap-3 md:grid-cols-2">
                      {insight.transactionInsights.recurringExpenses.slice(0, 4).map((expense: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{expense.category}</p>
                              <p className="text-xs text-gray-600">{expense.pattern}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">${expense.annualCost.toFixed(0)}/year</p>
                              <p className="text-xs text-gray-500">${expense.averageAmount.toFixed(2)} avg</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
                            <p className="text-xs text-blue-800">{expense.insight}</p>
                          </div>
                          <div className="bg-green-50 border-l-4 border-green-400 p-2 mt-2">
                            <p className="text-xs text-green-800"><strong>Action:</strong> {expense.actionable}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Savings Opportunities */}
                {insight.transactionInsights.topSavingsOpportunities?.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">🎯 Top Savings Opportunities</h5>
                    <div className="space-y-2">
                      {insight.transactionInsights.topSavingsOpportunities.slice(0, 3).map((opportunity: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 text-sm">{opportunity.title}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  opportunity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                  opportunity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {opportunity.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{opportunity.description}</p>
                              <p className="text-xs text-blue-800">{opportunity.recommendation}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-green-600">${opportunity.savings.toFixed(0)}</p>
                              <p className="text-xs text-gray-500">potential savings</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Insights */}
                {insight.transactionInsights.categoryInsights?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">📊 Category Spending Patterns</h5>
                    <div className="grid gap-3 md:grid-cols-2">
                      {insight.transactionInsights.categoryInsights.slice(0, 4).map((category: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-gray-900 text-sm">{category.title}</p>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">${category.savings.toFixed(0)}</p>
                              <p className="text-xs text-gray-500">potential</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{category.description}</p>
                          <p className="text-xs text-green-800 bg-green-50 p-2 rounded">{category.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Get New Advice Button */}
            <div className="flex gap-2 pt-2">
              <PrimaryButton
                onClick={() => setShowCustomInput(true)}
                variant="secondary"
                className="flex-1"
              >
                Ask Another Question
              </PrimaryButton>
              <PrimaryButton
                onClick={() => getAdvice()}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                {loading ? 'Refreshing...' : 'Refresh Insights'}
              </PrimaryButton>
            </div>
          </div>


        )}
      </Box>
    </div>
  );
};
