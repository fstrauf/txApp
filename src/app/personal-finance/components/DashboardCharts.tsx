'use client';

import React, { useState, useMemo } from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { MonthlyTable } from '@/components/analytics';
import { DonutChart } from '@/components/ui/DonutChart';
import { MonthlySpendingChart } from '@/components/ui/MonthlySpendingChart';
import { parseTransactionDate } from '@/lib/utils';
import { constructCategoryColors, getColorClassName, AvailableChartColorsKeys } from '@/lib/chartUtils';
import { DataAnalysisEngine } from '../engine/DataAnalysisEngine';
import {
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ListBulletIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardChartsProps {
  transactions?: any[];
}

type TimeFilter = 'all' | 'last30' | 'last90' | 'last12months';
type ViewMode = 'charts' | 'transactions' | 'monthly';

const DashboardCharts: React.FC<DashboardChartsProps> = ({ transactions: propTransactions }) => {
  const { userData } = usePersonalFinanceStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('charts');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use transactions from props or store
  const allTransactions = propTransactions || userData.transactions || [];
  const hasData = allTransactions.length > 0;

  // Filter transactions based on time period
  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return allTransactions;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFilter) {
      case 'last30':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'last12months':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return allTransactions.filter(t => {
      const transactionDate = parseTransactionDate(t.date);
      return transactionDate >= cutoffDate;
    });
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
        transactions: data.transactions
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, hasData]);

  // Create color mapping for categories
  const chartColors: AvailableChartColorsKeys[] = ['indigo', 'blue', 'emerald', 'amber', 'red', 'orange', 'teal', 'violet', 'pink', 'cyan'];
  const categoryColors = useMemo(() => {
    return constructCategoryColors(
      categorySpending.map(cat => cat.category),
      chartColors
    );
  }, [categorySpending]);

  // Simplified for now - focus on working charts
  const monthlyData = useMemo(() => {
    return [];
  }, []);

  // Handle chart interaction
  const handleChartValueChange = (value: any) => {
    const newCategory = (value && value.categoryClicked) ? 
      (selectedCategory === value.categoryClicked ? null : value.categoryClicked) : null;
    setSelectedCategory(newCategory);
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
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transaction Data</h3>
        <p className="text-gray-500">
          Upload transaction data or link a spreadsheet to see charts and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Time Filter */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="last12months">Last 12 Months</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('charts')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'charts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ChartPieIcon className="h-4 w-4 mr-2 inline" />
            Charts
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'transactions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ListBulletIcon className="h-4 w-4 mr-2 inline" />
            Transactions
          </button>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              {filteredTransactions.length} transactions
            </span>
          </div>
          <div className="text-sm text-blue-700">
            Total Expenses: {formatCurrency(
              filteredTransactions
                .filter(t => t.isDebit && t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </div>
          <div className="text-sm text-blue-700">
            {categorySpending.length} categories
          </div>
        </div>
      </div>

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          {categorySpending.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Expenses by Category
              </h3>
              <div className="flex justify-center items-center h-64 sm:h-80">
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
                  className="w-64 h-64 sm:w-80 sm:h-80"
                  showTooltip={true}
                  selectedCategory={selectedCategory}
                  onValueChange={handleChartValueChange}
                />
              </div>
              {selectedCategory && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="font-medium text-gray-800">
                    {formatCategoryName(selectedCategory)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Click chart segments to filter
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Category Breakdown</h3>
            {categorySpending.map((category, index) => (
              <div
                key={index} 
                className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition-all cursor-pointer ${
                  selectedCategory === category.category 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  const newCategory = selectedCategory === category.category ? null : category.category;
                  setSelectedCategory(newCategory);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 bg-gray-400"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {formatCategoryName(category.category)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.percentage.toFixed(1)}% • {category.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(category.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Analysis */}
      {viewMode === 'monthly' && dataEngine && (
        <div className="space-y-6">
          {monthlyData.length > 1 && (
            <MonthlySpendingChart
              timeSeriesData={dataEngine.getCategoryTimeSeriesData()}
              monthlyData={dataEngine.getMonthlySpending()}
              rollingMetrics={dataEngine.getRollingMetrics()}
              selectedCategories={[]}
              onCategoryToggle={() => {}}
            />
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Breakdown</h3>
            </div>
            <MonthlyTable data={monthlyData} />
          </div>
        </div>
      )}

      {/* Transactions List */}
      {viewMode === 'transactions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              All Transactions {selectedCategory && `• ${formatCategoryName(selectedCategory)}`}
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTransactions
                  .filter(t => !selectedCategory || t.category === selectedCategory)
                  .sort((a, b) => parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime())
                  .map((transaction, index) => (
                    <tr key={transaction.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseTransactionDate(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {formatCategoryName(transaction.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={transaction.isDebit ? 'text-red-600' : 'text-green-600'}>
                          {transaction.isDebit ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts; 