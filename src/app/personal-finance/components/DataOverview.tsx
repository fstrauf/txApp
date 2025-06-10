'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { parseTransactionDate } from '@/lib/utils';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DataOverviewProps {
  className?: string;
}

const DataOverview: React.FC<DataOverviewProps> = ({ className = '' }) => {
  const { userData } = usePersonalFinanceStore();
  const transactions = userData.transactions || [];

  const overviewData = React.useMemo(() => {
    if (!transactions.length) return null;

    // Calculate date range and months
    const transactionDates = transactions.map(t => parseTransactionDate(t.date));
    const oldestDate = new Date(Math.min(...transactionDates.map(d => d.getTime())));
    const newestDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
    const totalMonths = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    // Determine which transactions are being used for KPIs
    let transactionsUsed = transactions;
    let isUsingRollingWindow = false;
    
    if (totalMonths > 12) {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      
      transactionsUsed = transactions.filter(t => {
        const transactionDate = parseTransactionDate(t.date);
        return transactionDate >= twelveMonthsAgo;
      });
      isUsingRollingWindow = true;
    }

    // Calculate totals
    const expenses = transactionsUsed.filter(t => t.isDebit || t.amount < 0);
    const income = transactionsUsed.filter(t => !t.isDebit && t.amount > 0);
    
    const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransactions: transactions.length,
      transactionsUsed: transactionsUsed.length,
      dateRange: `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`,
      totalMonths,
      monthsUsedForKpis: isUsingRollingWindow ? 12 : totalMonths,
      totalIncome,
      totalExpenses,
      isUsingRollingWindow,
      oldestDate,
      newestDate
    };
  }, [transactions]);

  if (!overviewData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 border border-gray-200 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <InformationCircleIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Data Overview</h3>
        {overviewData.isUsingRollingWindow && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            12-Month Rolling Window
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Transaction Count */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-lg font-semibold text-gray-900">
              {overviewData.transactionsUsed.toLocaleString()}
              {overviewData.transactionsUsed !== overviewData.totalTransactions && (
                <span className="text-sm text-gray-500">
                  /{overviewData.totalTransactions.toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Date Range</p>
            <p className="text-lg font-semibold text-gray-900">
              {overviewData.monthsUsedForKpis} months
            </p>
            <p className="text-xs text-gray-500">
              {overviewData.dateRange}
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-lg font-semibold text-green-700">
              {formatCurrency(overviewData.totalIncome)}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-lg font-semibold text-red-700">
              {formatCurrency(overviewData.totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>
              {overviewData.isUsingRollingWindow 
                ? `KPIs calculated from last 12 months (${overviewData.transactionsUsed} transactions)`
                : `KPIs calculated from all ${overviewData.monthsUsedForKpis} months of data`
              }
            </span>
          </div>
          {overviewData.isUsingRollingWindow && (
            <div className="text-blue-600">
              <span className="font-medium">Rolling window active:</span> Using most recent 12 months for consistent comparison
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataOverview; 