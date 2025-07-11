'use client';

import React, { useState, useMemo } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { DonutChart } from '@/components/ui/DonutChart';
import { StackedBarChart } from '@/components/ui/StackedBarChart';
import { parseTransactionDate } from '@/lib/utils';
import { constructCategoryColors, getColorClassName, AvailableChartColorsKeys } from '@/lib/chartUtils';
import { DataAnalysisEngine } from '../engine/DataAnalysisEngine';
import {
  CalendarIcon,
  ChartBarIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface DashboardChartsProps {
  transactions?: any[];
  onTimeFilterChange?: (timeFilter: string) => void;
}

type TimeFilter = 'all' | 'month-1' | 'month-2' | 'month-3';

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  transactions: propTransactions, 
  onTimeFilterChange 
}) => {
  const { userData } = usePersonalFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Generate month options for the last 3 months
  const getMonthOptions = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({
        value: `month-${i}` as TimeFilter,
        label: monthName,
        date: date
      });
    }
    
    return months;
  };

  const monthOptions = getMonthOptions();

  // Use transactions from props or store
  const allTransactions = propTransactions || userData.transactions || [];
  const hasData = allTransactions.length > 0;

  // Filter transactions based on time period
  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return allTransactions;
    
    // Handle month-based filtering
    if (timeFilter.startsWith('month-')) {
      const monthsBack = parseInt(timeFilter.split('-')[1]);
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      
      return allTransactions.filter(t => {
        const transactionDate = parseTransactionDate(t.date);
        return transactionDate.getFullYear() === targetYear && 
               transactionDate.getMonth() + 1 === targetMonth;
      });
    }
    
    return allTransactions;
  }, [allTransactions, timeFilter]);

  // Initialize data analysis engine
  const dataEngine = useMemo(() => {
    if (filteredTransactions.length > 0) {
      return new DataAnalysisEngine(filteredTransactions);
    }
    return null;
  }, [filteredTransactions]);

  // Calculate category spending for pie chart
  const categorySpending = useMemo(() => {
    if (!hasData) return [];

    const expenseTransactions = filteredTransactions.filter(t => t.isDebit && t.amount > 0);
    const categoryMap = new Map<string, { amount: number; count: number; transactions: any[] }>();

    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { amount: 0, count: 0, transactions: [] };
      categoryMap.set(category, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1,
        transactions: [...existing.transactions, transaction]
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: expenseTransactions.reduce((sum, t) => sum + t.amount, 0) > 0 
          ? (data.amount / expenseTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100 
          : 0,
        transactionCount: data.count,
        transactions: data.transactions.sort((a, b) => b.amount - a.amount) // Sort transactions by amount descending
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, hasData]);

  // Monthly spending data for stacked bar chart
  const monthlySpendingData = useMemo(() => {
    if (!dataEngine) return [];
    
    const monthlyData = dataEngine.getMonthlySpending();
    const timeSeriesData = dataEngine.getCategoryTimeSeriesData();
    
    // Transform data for stacked bar chart
    return monthlyData.map(month => {
      const categoryBreakdown: { [key: string]: number } = {};
      
      // Get category spending for this month
      categorySpending.forEach(cat => {
        const monthTransactions = cat.transactions.filter(t => {
          const transactionDate = parseTransactionDate(t.date);
          const monthStart = new Date(month.year, month.month - 1, 1);
          const monthEnd = new Date(month.year, month.month, 0);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        });
        
        const monthlyAmount = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        if (monthlyAmount > 0) {
          categoryBreakdown[cat.category] = monthlyAmount;
        }
      });
      
      return {
        month: `${month.year}-${String(month.month).padStart(2, '0')}`,
        displayMonth: month.monthName,
        total: month.total,
        ...categoryBreakdown
      };
    }).slice(-12); // Last 12 months
  }, [dataEngine, categorySpending]);

  

  // Create color mapping for categories
  const chartColors: AvailableChartColorsKeys[] = ['indigo', 'blue', 'emerald', 'amber', 'red', 'orange', 'teal', 'violet', 'pink', 'cyan'];
  const categoryColors = useMemo(() => {
    return constructCategoryColors(
      categorySpending.map(cat => cat.category),
      chartColors
    );
  }, [categorySpending]);

  // Handle chart interaction
  const handleChartValueChange = (value: any) => {
    const newCategory = (value && value.categoryClicked) ? 
      (selectedCategory === value.categoryClicked ? null : value.categoryClicked) : null;
    setSelectedCategory(newCategory);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCategoryName = (category: string): string => {
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!hasData) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 sm:p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Transaction Data</h3>
        <p className="text-sm sm:text-base text-gray-500">
          Upload transaction data or link a spreadsheet to see charts and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        {/* Time Filter */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Time Period:</span>
            <select
              value={timeFilter}
              onChange={(e) => {
                const newFilter = e.target.value as TimeFilter;
                setTimeFilter(newFilter);
                onTimeFilterChange?.(newFilter);
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Available Months - removed since we're using fixed last 3 months */}
          {/* Month/Year Picker - removed since we're using fixed last 3 months */}
        </div>

        {/* Data Summary */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4" />
            <span>{filteredTransactions.length} transactions</span>
          </div>
          <div>
            Total Expenses: {formatCurrency(
              filteredTransactions
                .filter(t => t.isDebit && t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </div>
          <div>
            {categorySpending.length} categories
          </div>
        </div>
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8">
        {/* Doughnut Chart */}
        <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
            Expenses by Category
          </h3>
          <div className="flex justify-center items-center h-48 sm:h-64 lg:h-80">
            <DonutChart 
              data={categorySpending.map(cat => ({
                name: cat.category,
                amount: cat.amount,
                category: cat.category
              }))}
              value="amount"
              category="category"
              colors={chartColors}
              valueFormatter={(value: number) => formatCurrency(value)}
              className="w-40 h-40 sm:w-64 sm:h-64 lg:w-80 lg:h-80"
              showTooltip={true}
              selectedCategory={selectedCategory}
              onValueChange={handleChartValueChange}
            />
          </div>
          {selectedCategory && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg text-center">
              <div className="font-medium text-gray-800">
                {formatCategoryName(selectedCategory)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                Click chart segments to filter
              </div>
            </div>
          )}
        </div>

        {/* Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
            Monthly Spending Trends
          </h3>
          {dataEngine && monthlySpendingData.length > 1 ? (
            <div className="h-64 sm:h-80 lg:h-96">
              <StackedBarChart 
                data={monthlySpendingData}
                categories={categorySpending.map(cat => cat.category)}
                xAxisKey="displayMonth"
                selectedCategory={selectedCategory}
                onValueChange={(value) => {
                  if (value && value.categoryClicked) {
                    const newCategory = selectedCategory === value.categoryClicked ? null : value.categoryClicked;
                    setSelectedCategory(newCategory);
                  } else {
                    setSelectedCategory(null);
                  }
                }}
                valueFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                showXAxis={true}
                showYAxis={true}
                showGrid={false}
                showLegend={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64 lg:h-80 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Need more monthly data for trends</p>
                <p className="text-xs sm:text-sm">Add transactions from multiple months</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Savings Rate Chart */}
      {/* <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Savings/Burn Rate Over Time
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          Green bars show savings rate (positive), red bars show burn rate (negative)
        </p>
        {dataEngine && monthlySavingsRateData.length > 1 ? (
          <div className="flex justify-center">
            <SavingsRateChart data={monthlySavingsRateData} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Need more monthly data to show savings rate trends</p>
              <p className="text-sm">Add transactions from multiple months</p>
            </div>
          </div>
        )}
      </div> */}

      {/* Category Breakdown with Collapsible Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Category Breakdown</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Click categories to expand and view individual transactions
          </p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {categorySpending.map((category, index) => {
            const isExpanded = expandedCategories.has(category.category);
            const isSelected = selectedCategory === category.category;
            
            return (
              <div key={index}>
                {/* Category Header */}
                <div
                  className={`p-3 sm:p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    toggleCategoryExpansion(category.category);
                    // Also handle selection for chart interaction
                    const newCategory = selectedCategory === category.category ? null : category.category;
                    setSelectedCategory(newCategory);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                                                 <div 
                           className={`w-4 h-4 rounded-full ${getColorClassName(categoryColors.get(category.category) || 'indigo', 'bg')}`}
                         />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                          {formatCategoryName(category.category)}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {category.percentage.toFixed(1)}% • {category.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-gray-800">
                        {formatCurrency(category.amount)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Transactions */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    <div className="px-3 sm:px-4 py-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        TRANSACTIONS ({category.transactions.length})
                      </div>
                      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                        {category.transactions.map((transaction, txIndex) => (
                                                      <div 
                            key={txIndex}
                            className="flex items-center justify-between py-2 px-2 sm:px-3 bg-white rounded border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {transaction.description}
                                </p>
                                <span className="text-xs sm:text-sm font-bold text-red-600 ml-2 sm:ml-3">
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {parseTransactionDate(transaction.date).toLocaleDateString()}
                                {transaction.account && ` • ${transaction.account}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 