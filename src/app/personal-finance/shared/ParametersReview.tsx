import React from 'react';
import { ParameterCard } from './ParameterCard';
import { Box } from '@/components/ui/Box';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export interface ParametersReviewProps {
  income: number;
  spending: number;
  savings: number;
  onEdit: () => void;
}

export const ParametersReview: React.FC<ParametersReviewProps> = ({ 
  income, 
  spending, 
  savings, 
  onEdit,
}) => {
  const monthlySavings = income - spending;
  const savingsRate = income > 0 ? ((monthlySavings) / income) * 100 : 0;
  const monthsOfExpenses = spending > 0 ? savings / spending : 0;

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600';
    if (rate >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRunwayColor = (months: number) => {
    if (months >= 6) return 'text-green-600';
    if (months >= 3) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Box variant="gradient" className="mb-4 shadow-soft hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <ChartBarIcon className="h-5 w-5 text-indigo-600 mr-2 inline" /> Your Financial Snapshot
        </h3>
        <button
          onClick={onEdit}
          className="px-4 py-2 border-2 border-indigo-500 text-indigo-600 rounded-lg text-sm font-medium
                   hover:bg-indigo-500 hover:text-white transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
        >
          Edit Numbers
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ParameterCard 
          label="Monthly Income" 
          value={income} 
          subtext="Take-home pay" 
        />
        <ParameterCard 
          label="Monthly Spending" 
          value={spending} 
          subtext="Total expenses" 
        />
        <ParameterCard 
          label="Current Savings" 
          value={savings} 
          subtext="Emergency fund" 
        />
      </div>
      
      <div className="pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Monthly Cash Flow</div>
            <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {monthlySavings >= 0 ? '+' : ''}${monthlySavings.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Savings Rate</div>
            <div className={`text-2xl font-bold ${getSavingsRateColor(savingsRate)}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1 font-medium">Emergency Runway</div>
            <div className={`text-2xl font-bold ${getRunwayColor(monthsOfExpenses)}`}>
              {monthsOfExpenses.toFixed(1)} months
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}; 