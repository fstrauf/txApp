// src/app/personal-finance/screens/InitialInsightsScreen.tsx
'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { PrimaryButton } from '@/app/personal-finance/shared/PrimaryButton';
import { Box } from '@/components/ui/Box';
import { ParametersReview } from '@/app/personal-finance/shared/ParametersReview';
import { InsightCard } from '@/app/personal-finance/shared/InsightCard';
import {DiveDeeperCard} from '@/app/personal-finance/shared/DiveDeeperCard';

const InitialInsightsScreen: React.FC = () => {
  const { userData, setCurrentScreen } = usePersonalFinanceStore();
  const { income, spending, savings } = userData;

  // Calculate insights
  const monthlySavings = income - spending;
  const savingsRate = income > 0 ? ((monthlySavings) / income) * 100 : 0;
  const monthsOfExpenses = spending > 0 ? savings / spending : 0;

  const generateInsights = () => {
    const insights = [];

    // Savings rate insight
    if (savingsRate >= 20) {
      insights.push({
        type: "success" as const,
        icon: "🎉",
        title: "Excellent savings habit!",
        text: `Your ${savingsRate.toFixed(1)}% savings rate puts you in the top 10% of Kiwis your age.`,
        action: "Keep it up! Consider increasing by 2-3% if possible.",
        benchmark: `At current rate: $${(monthlySavings * 12).toLocaleString()}/year`
      });
    } else if (savingsRate >= 15) {
      insights.push({
        type: "success" as const,
        icon: "✅",
        title: "Great savings rate!",
        text: `Your ${savingsRate.toFixed(1)}% savings rate is above the NZ average of 12%.`,
        action: "You're doing well! Consider bumping it up to 20% if possible.",
        benchmark: `At current rate: $${(monthlySavings * 12).toLocaleString()}/year`
      });
    } else if (savingsRate >= 10) {
      insights.push({
        type: "optimize" as const,
        icon: "💡",
        title: "Room to improve your savings",
        text: `Your ${savingsRate.toFixed(1)}% savings rate is close to the NZ average. You could boost this!`,
        action: "Try to increase to 15% by reducing one major expense category.",
        benchmark: "Target: 15-20% savings rate"
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: "warning" as const,
        icon: "⚠️",
        title: "Low savings rate needs attention",
        text: `Your ${savingsRate.toFixed(1)}% savings rate is below the recommended minimum of 10%.`,
        action: "Focus on reducing expenses or increasing income to save at least 10%.",
        benchmark: "Minimum recommended: 10% savings rate"
      });
    } else {
      insights.push({
        type: "warning" as const,
        icon: "🚨",
        title: "Not saving any money",
        text: "You're spending all or more than your income. This needs immediate attention.",
        action: "Review your expenses urgently and cut non-essential spending.",
        benchmark: "Start with saving just $50-100 per month"
      });
    }

    // Emergency fund insight
    if (monthsOfExpenses >= 6) {
      insights.push({
        type: "success" as const,
        icon: "💪",
        title: "Excellent emergency fund!",
        text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months if income stopped.`,
        action: "Consider investing excess savings for higher returns.",
        benchmark: "Recommended: 3-6 months of expenses"
      });
    } else if (monthsOfExpenses >= 3) {
      insights.push({
        type: "optimize" as const,
        icon: "💰",
        title: "Good emergency fund",
        text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months if income stopped.`,
        action: "Consider building up to 6 months for extra security.",
        benchmark: `Target: $${(spending * 6).toLocaleString()} (6 months expenses)`
      });
    } else if (monthsOfExpenses >= 1) {
      insights.push({
        type: "warning" as const,
        icon: "⚠️",
        title: "Build your emergency fund",
        text: `Your savings would last ${monthsOfExpenses.toFixed(1)} months if income stopped.`,
        action: `Build emergency fund to $${(spending * 3).toLocaleString()} (3 months expenses) before other goals.`,
        benchmark: monthlySavings > 0 ? `Timeline: ${Math.ceil((spending * 3 - savings) / monthlySavings)} months at current savings rate` : "Focus on saving first"
      });
    } else {
      insights.push({
        type: "warning" as const,
        icon: "🚨",
        title: "No emergency buffer",
        text: "You have very little savings to cover unexpected expenses.",
        action: "Start building an emergency fund immediately - even $500 helps!",
        benchmark: "First target: $1,000 emergency fund"
      });
    }

    // High savings optimization
    if (savings >= 15000 && monthsOfExpenses >= 6) {
      insights.push({
        type: "optimize" as const,
        icon: "📈",
        title: "Optimize your excess savings",
        text: `Your $${savings.toLocaleString()} in savings could earn more with better returns.`,
        action: "Consider high-interest savings accounts or investments for excess funds.",
        benchmark: "Best NZ savings rates: Heartland Bank 4.1%, Rabobank 4.0%"
      });
    }

    return insights.slice(0, 3); // Show top 3 insights
  };

  const insights = generateInsights();

  const handleEditNumbers = () => {
    setCurrentScreen('income');
  };

  const handleDiveDeeper = (type: string) => {
    switch (type) {
      case 'spending':
        setCurrentScreen('spendingAnalysisUpload');
        break;
      case 'savings':
        setCurrentScreen('savingsAnalysisInput');
        break;
      case 'goals':
        setCurrentScreen('goalPlanning');
        break;
      default:
        break;
    }
  };

  return (
    <Box variant="gradient" className="max-w-6xl mx-auto mb-4">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fadeIn">
        {/* Enhanced Header with gradient text */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-primary uppercase tracking-wide">
              Your Financial Health Report
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Here's what we found
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Personalized insights based on your unique situation
          </p>
        </div>

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
                The most important things to focus on right now
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"><span className="text-xs">Success</span></span>
              
              <span className="w-2 h-2 bg-orange-500 rounded-full ml-3"><span className="text-xs">Optimize</span></span>
              
              <span className="w-2 h-2 bg-red-500 rounded-full ml-3"><span className="text-xs">Action needed</span></span>
            </div>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="transform transition-all duration-300 hover:translate-x-2"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <InsightCard
                  type={insight.type}
                  icon={insight.icon}
                  title={insight.title}
                  text={insight.text}
                  action={insight.action}
                  benchmark={insight.benchmark}
                  className="hover:shadow-lg transition-shadow duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Dive Deeper Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to dive deeper?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose an area to explore and get actionable recommendations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <DiveDeeperCard
              type="spending"
              icon="💳"
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
              icon="🏦"
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
            
            <DiveDeeperCard
              type="goals"
              icon="🎯"
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
            />
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={handleEditNumbers}
            className="group flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="font-medium">Edit my numbers</span>
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleDiveDeeper('spending')}
              className="text-sm text-gray-500 hover:text-primary transition-colors duration-200 font-medium"
            >
              Skip for now
            </button>
            
            <PrimaryButton
              onClick={() => handleDiveDeeper('spending')}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started →
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default InitialInsightsScreen;