// src/app/personal-finance/screens/InitialInsightsScreen.tsx
'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { 
  ParametersReview, 
  InsightCard, 
  DiveDeeperCard, 
  PrimaryButton 
} from '@/app/personal-finance/shared/FinanceComponents';

const InitialInsightsScreen: React.FC = () => {
  const { userData, nextScreen, setCurrentScreen } = usePersonalFinanceStore();
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
        text: `Your ${savings.toLocaleString()} in savings could earn more with better returns.`,
        action: "Consider high-interest savings accounts or investments for excess funds.",
        benchmark: "Best NZ savings rates: Heartland Bank 4.1%, Rabobank 4.0%"
      });
    }

    return insights.slice(0, 3); // Show top 3 insights
  };

  const insights = generateInsights();

  const handleEditNumbers = () => {
    setCurrentScreen('income'); // Go back to income screen to edit
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
    <div className="max-w-6xl mx-auto p-8">
      {/* Header - Matching Artifact Style */}
      <div className="text-center mb-12">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Your Financial Health Report</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Here's what we found
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Personalized insights based on your situation
        </p>
      </div>

      {/* Financial Snapshot */}
      <ParametersReview
        income={income}
        spending={spending}
        savings={savings}
        onEdit={handleEditNumbers}
        className="mb-12"
      />

      {/* Insights Section */}
      <div className="mb-12">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              type={insight.type}
              icon={insight.icon}
              title={insight.title}
              text={insight.text}
              action={insight.action}
              benchmark={insight.benchmark}
            />
          ))}
        </div>
      </div>

      {/* Dive Deeper Section - Matching Artifact Layout */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            🔍 Dive Deeper Into Your Finances
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DiveDeeperCard
            type="spending"
            icon="💳"
            title="Breakdown Your Expenses"
            description="Upload your bank transactions and discover exactly where your money goes"
            features={[
              "Automatic categorization",
              "Spending trends over time", 
              "Compare to benchmarks",
              "Find saving opportunities"
            ]}
            actionText="Upload CSV from your bank →"
            onClick={() => handleDiveDeeper('spending')}
          />
          
          <DiveDeeperCard
            type="savings"
            icon="🏦"
            title="Optimize Your Savings"
            description="Analyze where you keep your money and maximize your returns"
            features={[
              "Savings account analysis",
              "Interest rate comparison",
              "Investment opportunities", 
              "Emergency fund strategy"
            ]}
            actionText="Analyze your savings →"
            onClick={() => handleDiveDeeper('savings')}
          />
          
          <DiveDeeperCard
            type="goals"
            icon="🎯"
            title="Plan Your Goals"
            description="Set specific targets and get a roadmap to achieve them"
            features={[
              "Custom goal timelines",
              "Monthly savings targets",
              "Progress tracking",
              "Milestone celebrations"
            ]}
            actionText="Set your goals →"
            onClick={() => handleDiveDeeper('goals')}
          />
        </div>
      </div>

      {/* Action Buttons - Fixed Layout */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <PrimaryButton
          variant="secondary"
          onClick={handleEditNumbers}
          className="w-full sm:w-auto"
        >
          ← Back to Insights
        </PrimaryButton>
        
        <div className="flex gap-4">
          <button
            onClick={() => handleDiveDeeper('spending')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialInsightsScreen;