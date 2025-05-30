'use client';

import React, { useState, useEffect } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { ParametersReview } from '@/app/personal-finance/shared/ParametersReview';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';
import {DiveDeeperCard} from '@/app/personal-finance/shared/DiveDeeperCard';
import { AIFinancialInsights } from '../ai/AIFinancialInsights';
import { ProFeatureTeaser } from '@/app/personal-finance/shared/ProFeatureTeaser';
import { useScreenNavigation } from '../hooks/useScreenNavigation';
import { usePersonalFinanceTracking } from '../hooks/usePersonalFinanceTracking';
import { Header } from '@/components/ui/Header';
import { 
  generateFinancialInsights, 
  validateUserData
} from '../engine/FinancialRulesEngine';
import { 
  CpuChipIcon, 
  MagnifyingGlassIcon, 
  CreditCardIcon, 
  BuildingLibraryIcon, 
  FlagIcon 
} from '@heroicons/react/24/outline';

const InitialInsightsScreen: React.FC = () => {
  const { userData } = usePersonalFinanceStore();
  const { goToScreen, getProgress } = useScreenNavigation();
  const { trackInsightsGeneration, trackAction } = usePersonalFinanceTracking({ 
    currentScreen: 'initialInsights', 
    progress: getProgress() 
  });
  const { income, spending, savings } = userData;
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Debug: Log userData in the screen
  useEffect(() => {
    console.log('InitialInsightsScreen - userData:', userData);
    console.log('InitialInsightsScreen - income:', income, 'spending:', spending, 'savings:', savings);
  }, [userData, income, spending, savings]);

  // Validate data first
  const validation = validateUserData(userData);
  
  // Generate insights using the rules engine
  const insights = generateFinancialInsights(userData);

  // Track insights generation
  useEffect(() => {
    if (insights && insights.length > 0) {
      trackInsightsGeneration('initial_insights', true, {
        insights_count: insights.length,
        insights_types: insights.map(i => i.type),
        user_income: income,
        user_spending: spending,
        user_savings: savings,
        savings_rate: income > 0 ? ((income - spending) / income * 100) : null
      });
    }
  }, [insights, trackInsightsGeneration, income, spending, savings]);

  const handleEditNumbers = () => {
    trackAction('edit_numbers_clicked', {
      from_screen: 'initialInsights'
    });
    goToScreen('income');
  };

  const handleDiveDeeper = (type: string) => {
    trackAction('dive_deeper_clicked', {
      analysis_type: type,
      user_has_income: Boolean(income),
      user_has_spending: Boolean(spending),
      user_has_savings: Boolean(savings)
    });
    
    switch (type) {
      case 'spending':
        goToScreen('spendingAnalysisUpload');
        break;
      case 'savings':
        goToScreen('savingsAnalysisInput');
        break;
      case 'goals':
        goToScreen('savingsAnalysisInput');
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fadeIn">
        {/* Enhanced Header with gradient text */}
        <Header 
          variant="gradient"
          size="xl"
          badge={{
            text: "Your Financial Health Report",
            variant: "info"
          }}
          subtitle="Personalized insights based on your unique situation"
        >
          Here's what we found
        </Header>

        {/* Enhanced Financial Snapshot */}

          <ParametersReview
            income={income}
            spending={spending}
            savings={savings}
            onEdit={handleEditNumbers}            
          />


        {/* Enhanced Insights Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Your Key Insights
              </h2>
              <p className="text-gray-600 mt-1">
                {showAIInsights 
                  ? "AI-powered personalized recommendations"
                  : "The most important things to focus on right now"
                }
              </p>
            </div>
            
            {/* AI Toggle Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  showAIInsights
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CpuChipIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">
                  {showAIInsights ? 'AI Insights' : 'Try AI Insights'}
                </span>
              </button>
              
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  <span className="text-xs font-medium">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                  <span className="text-xs font-medium">Optimize</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  <span className="text-xs font-medium">Action needed</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conditional Insights Display */}
          {showAIInsights ? (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
              <AIFinancialInsights 
                context="general"
                showHealthScore={true}
                className="bg-transparent border-0 shadow-none"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-300 hover:translate-x-2"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <InsightCard
                    type={insight.type}
                    icon={React.createElement(insight.icon, { className: "h-8 w-8 text-indigo-600" })}
                    title={insight.title}
                    text={insight.text}
                    action={insight.action}
                    benchmark={insight.benchmark}
                    className="hover:shadow-lg transition-shadow duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pro Feature Teaser - Weekly Insights */}
        <div className="mb-16">
          <ProFeatureTeaser 
            feature="weekly-insights"
            context="Imagine getting insights like these every week, automatically updated with your latest spending"
          />
        </div>

        {/* Enhanced Dive Deeper Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to dive deeper?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose an area to explore and get actionable recommendations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <DiveDeeperCard
              type="spending"
              icon={<CreditCardIcon className="h-6 w-6 text-gray-600" />}
              title="Analyze Spending"
              description="Upload your bank transactions and discover exactly where your money goes"
              features={[
                "Automatic categorization",
                "Spending trends over time", 
                "Compare to benchmarks",
                "Find saving opportunities"
              ]}
              actionText="Upload CSV →"
              onClick={() => handleDiveDeeper('spending')}
              className="group"
            />
            
            <DiveDeeperCard
              type="savings"
              icon={<BuildingLibraryIcon className="h-6 w-6 text-gray-600" />}
              title="Optimize Savings"
              description="Analyze where you keep your money and maximize your returns"
              features={[
                "Savings account analysis",
                "Interest rate comparison",
                "Investment opportunities", 
                "Emergency fund strategy"
              ]}
              actionText="Analyze savings →"
              onClick={() => handleDiveDeeper('savings')}
              className="group"
            />
            
            {/* <DiveDeeperCard
              type="goals"
              icon={<FlagIcon className="h-6 w-6 text-gray-600" />}
              title="Set Goals"
              description="Set specific targets and get a roadmap to achieve them"
              features={[
                "Custom goal timelines",
                "Monthly savings targets",
                "Progress tracking",
                "Milestone celebrations"
              ]}
              actionText="Plan goals →"
              onClick={() => handleDiveDeeper('goals')}
              className="group"
            /> */}
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={handleEditNumbers}
                      className="px-4 py-2 border-2 border-indigo-500 text-indigo-600 rounded-lg text-sm font-medium
                   hover:bg-indigo-500 hover:text-white transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
          >
            <span className="font-medium">Edit my numbers</span>
          </button>
          
          <button
            onClick={() => goToScreen('whatHappensNext')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium
                     hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 shadow-lg"
          >
            <span className="font-medium">Continue Your Journey →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialInsightsScreen;