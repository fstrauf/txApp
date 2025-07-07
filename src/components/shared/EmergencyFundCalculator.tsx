'use client';

import { Box } from '@/components/ui/Box';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle, Zap, Rocket } from 'lucide-react';
import posthog from 'posthog-js';
import { useEmergencyFundCalculator } from '@/hooks/useEmergencyFundCalculator';
import { FinancialSnapshotOffer } from '@/app/personal-finance/components/FinancialSnapshotOffer';

interface CalculatorResult {
  months: number;
  message: string;
  emoji: string;
  icon: React.ReactNode;
  ctaText: string;
  bgColor: string;
  textColor: string;
}

const getResultData = (months: number): CalculatorResult => {
  if (months < 3) {
    return {
      months,
      message: "You're in the danger zone. Let's build your safety net.",
      emoji: "⚠️",
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      ctaText: "Build Your Safety Net",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    };
  } else if (months < 6) {
    return {
      months,
      message: "Good start! Most experts recommend 6-12 months.",
      emoji: "✓",
      icon: <CheckCircle className="w-6 h-6 text-orange-600" />,
      ctaText: "Reach 6+ Months",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    };
  } else if (months < 12) {
    return {
      months,
      message: "You're financially fit! Ready to optimize further?",
      emoji: "💪",
      icon: <Zap className="w-6 h-6 text-green-600" />,
      ctaText: "Optimize Your Strategy",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    };
  } else {
    return {
      months,
      message: "You have F-You Money! Let's make it grow.",
      emoji: "🚀",
      icon: <Rocket className="w-6 h-6 text-blue-600" />,
      ctaText: "Maximize Your Freedom",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    };
  }
};

interface EmergencyFundCalculatorProps {
  showClearButton?: boolean;
}

export const EmergencyFundCalculator: React.FC<EmergencyFundCalculatorProps> = ({ 
  showClearButton = false 
}) => {
  const {
    savings,
    expenses,
    result,
    showResult,
    updateSavings,
    updateExpenses,
    setResult,
    clearCalculator,
  } = useEmergencyFundCalculator();

  const handleCalculate = () => {
    const savingsAmount = parseFloat(savings.replace(/,/g, ''));
    const expensesAmount = parseFloat(expenses.replace(/,/g, ''));

    if (isNaN(savingsAmount) || isNaN(expensesAmount) || expensesAmount <= 0) {
      return;
    }

    const months = Math.round((savingsAmount / expensesAmount) * 10) / 10;
    const resultData = getResultData(months);
    
    // Convert to the hook's result format (without icon)
    const hookResult = {
      months: resultData.months,
      message: resultData.message,
      emoji: resultData.emoji,
      ctaText: resultData.ctaText,
      bgColor: resultData.bgColor,
      textColor: resultData.textColor,
    };
    
    setResult(hookResult);

    // Track the calculation
    posthog.capture('homepage_calculator_used', {
      savings_amount: savingsAmount,
      monthly_expenses: expensesAmount,
      calculated_months: months,
      result_category: months < 3 ? 'danger' : months < 6 ? 'starting' : months < 12 ? 'good' : 'excellent'
    });
  };

  const handleCtaClick = () => {
    if (result) {
      posthog.capture('homepage_calculator_cta_clicked', {
        calculated_months: result.months,
        cta_text: result.ctaText,
        result_category: result.months < 3 ? 'danger' : result.months < 6 ? 'starting' : result.months < 12 ? 'good' : 'excellent'
      });
    }
  };

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    updateSavings(formatted);
  };

  const handleExpensesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    updateExpenses(formatted);
  };

  // Helper to get the full result data with icon for display
  const getDisplayResult = (): CalculatorResult | null => {
    if (!result) return null;
    return getResultData(result.months);
  };

  const displayResult = getDisplayResult();

  return (
    <Box variant="elevated" padding="lg" className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h3 className="text-2xl font-bold text-gray-900">
            What's Your Emergency Fund Runway?
          </h3>
          {showClearButton && (savings || expenses) && (
            <button
              onClick={clearCalculator}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Calculate how many months of freedom you can afford right now
        </p>
        {(savings || expenses) && (
          <div className="mt-2">
            <p className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
              ✓ Values saved from your previous calculation
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="savings" className="block text-sm font-medium text-gray-700 mb-2">
            Total Savings ($)
          </label>
          <input
            id="savings"
            type="text"
            value={savings}
            onChange={handleSavingsChange}
            placeholder="30,000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="expenses" className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Expenses ($)
          </label>
          <input
            id="expenses"
            type="text"
            value={expenses}
            onChange={handleExpensesChange}
            placeholder="3,000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={!savings || !expenses}
        className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Calculate My Freedom
      </button>

      {/* Result Display */}
      {showResult && displayResult && (
        <>
          <div className={`mt-6 p-6 ${displayResult.bgColor} rounded-xl border border-gray-200 transition-all duration-500 ease-in-out`}>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {displayResult.icon}
                <span className="text-2xl">{displayResult.emoji}</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                You have <span className={`${displayResult.textColor} font-black`}>{displayResult.months}</span> months of freedom!
              </h4>
              <p className={`${displayResult.textColor} font-medium`}>
                {displayResult.message}
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/personal-finance"
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {displayResult.ctaText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <p className="text-xs text-gray-500 mt-2">
                Get the complete picture with AI-powered insights
              </p>
            </div>
          </div>

          {/* Financial Snapshot Offer - Show after calculation */}
          <div className="mt-8">
            <FinancialSnapshotOffer />
          </div>
        </>
      )}

      {/* Sample calculation hint */}
      {!showResult && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Example: $30,000 saved ÷ $3,000/month = 10 months of freedom</p>
        </div>
      )}
    </Box>
  );
}; 