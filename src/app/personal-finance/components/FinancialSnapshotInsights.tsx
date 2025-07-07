'use client';

import React from 'react';
import { 
  CurrencyDollarIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { DashboardStats } from '../utils/dashboardStats';

interface FinancialSnapshotInsightsProps {
  stats: DashboardStats;
  isPaidSnapshot?: boolean;
  className?: string;
}

export const FinancialSnapshotInsights: React.FC<FinancialSnapshotInsightsProps> = ({
  stats,
  isPaidSnapshot = false,
  className = ""
}) => {
  if (!isPaidSnapshot) return null;

  // Calculate insights from the real data
  const monthlyExpenses = stats.monthlyAverageExpenses;
  const runwayMonths = stats.runwayMonths || 0;
  const diningEstimate = monthlyExpenses * 0.15; // Estimate 15% on dining
  const subscriptionsEstimate = monthlyExpenses * 0.08; // Estimate 8% on subscriptions
  const savingsRate = (stats.monthlyAverageSavings / stats.monthlyAverageIncome) * 100;
  
  // Calculate freedom date based on current savings rate
  const targetFreedomAmount = monthlyExpenses * 300; // 25 years of expenses (4% rule)
  const currentSavings = stats.totalSavings || 0;
  const monthsToFreedom = stats.monthlyAverageSavings > 0 
    ? Math.ceil((targetFreedomAmount - currentSavings) / stats.monthlyAverageSavings)
    : null;
  
  const freedomDate = monthsToFreedom 
    ? new Date(Date.now() + monthsToFreedom * 30 * 24 * 60 * 60 * 1000).getFullYear()
    : null;

  const insights = [
    {
      icon: <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />,
      title: "Hidden Subscriptions",
      value: `$${Math.round(subscriptionsEstimate)}/mo`,
      description: `Estimated recurring charges found`,
      color: "orange"
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6 text-red-600" />,
      title: "Dining Out Impact", 
      value: `$${Math.round(diningEstimate * 12)}/yr`,
      description: `= ${Math.round(diningEstimate / monthlyExpenses * runwayMonths)} months of runway`,
      color: "red"
    },
    {
      icon: <CalendarDaysIcon className="h-6 w-6 text-blue-600" />,
      title: "Your Freedom Date",
      value: freedomDate ? freedomDate.toString() : "Calculate needed",
      description: "If you maintain current savings rate",
      color: "blue"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 bg-green-100 rounded-full">
            <SparklesIcon className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-lg font-semibold text-green-600">🎯 Your Financial Snapshot Insights</span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Here's What Your Real Data Reveals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${getColorClasses(insight.color)} transition-all duration-200 hover:shadow-md`}>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {insight.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-2xl font-bold text-gray-900 mb-1">{insight.value}</p>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Wins Section */}
        <div className="mt-6 p-4 bg-white/80 rounded-lg border border-green-100">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Your Top Opportunities
          </h4>
          <div className="text-left space-y-2 text-sm text-gray-700">
            <div>💰 <strong>Quick win:</strong> Cancel unused subscriptions to save ~${Math.round(subscriptionsEstimate * 0.3)}/mo</div>
            <div>🍽️ <strong>Optimize dining:</strong> Cook 2 more meals per week to extend runway by {Math.round(0.3)} months</div>
            <div>📈 <strong>Savings boost:</strong> Increase savings rate to {Math.round(savingsRate + 5)}% to reach freedom {monthsToFreedom ? Math.round(monthsToFreedom * 0.15) : 12} months sooner</div>
          </div>
        </div>
      </div>
    </div>
  );
};
