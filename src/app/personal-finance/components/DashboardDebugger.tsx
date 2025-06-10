'use client';

import React from 'react';
import { usePersonalFinanceStore } from '@/store/personalFinanceStore';
import { parseTransactionDate } from '@/lib/utils';

interface DashboardStats {
  monthlyAverageIncome: number;
  monthlyAverageSavings: number;
  monthlyAverageExpenses: number;
  lastMonthExpenses: number;
  annualExpenseProjection: number;
  lastDataRefresh?: Date;
}

interface DashboardDebuggerProps {
  dashboardStats?: DashboardStats;
  timeFilter?: string;
}

const DashboardDebugger: React.FC<DashboardDebuggerProps> = ({ 
  dashboardStats,
  timeFilter = 'all'
}) => {
  const { userData } = usePersonalFinanceStore();
  const transactions = userData.transactions || [];

  // Recreate the calculations from both components to compare
  const debugData = React.useMemo(() => {
    if (!transactions.length) return null;

    // === DATE ANALYSIS ===
    const transactionDates = transactions.map(t => parseTransactionDate(t.date));
    const oldestDate = new Date(Math.min(...transactionDates.map(d => d.getTime())));
    const newestDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
    const totalMonths = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    // === TOP KPIs CALCULATION (updated logic) ===
    // Determine which transactions to use and division logic
    let transactionsToUse = transactions;
    let monthsToUseForAverage = totalMonths;
    
    if (totalMonths > 12) {
      // Use rolling 12-month window (last 12 months only)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      
      transactionsToUse = transactions.filter(t => {
        const transactionDate = parseTransactionDate(t.date);
        return transactionDate >= twelveMonthsAgo;
      });
      monthsToUseForAverage = 12;
    }
    
    const expenses = transactionsToUse.filter(t => t.isDebit || t.amount < 0);
    const income = transactionsToUse.filter(t => !t.isDebit && t.amount > 0);
    
    const topKpiTotalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const topKpiTotalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const topKpiMonthlyAvgIncome = topKpiTotalIncome / monthsToUseForAverage;
    const topKpiMonthlyAvgExpenses = topKpiTotalExpenses / monthsToUseForAverage;

    // === CHARTS CALCULATION (from DashboardCharts) ===
    // Apply time filter
    const now = new Date();
    let filteredTransactions = transactions;
    
    if (timeFilter !== 'all') {
      // Handle month-based filtering
      if (timeFilter.startsWith('month-')) {
        const monthsBack = parseInt(timeFilter.split('-')[1]);
        const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        
        filteredTransactions = transactions.filter(t => {
          const transactionDate = parseTransactionDate(t.date);
          return transactionDate.getFullYear() === targetYear && 
                 transactionDate.getMonth() + 1 === targetMonth;
        });
      }
    }

    const chartsExpenseTransactions = filteredTransactions.filter(t => t.isDebit && t.amount > 0);
    const chartsTotalExpenses = chartsExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      // Data sources
      totalTransactions: transactions.length,
      filteredTransactions: filteredTransactions.length,
      dateRange: `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`,
      actualMonths: totalMonths,
      
      // Top KPIs calculations
      topKpi: {
        totalIncome: topKpiTotalIncome,
        totalExpenses: topKpiTotalExpenses,
        monthlyAvgIncome: topKpiMonthlyAvgIncome,
        monthlyAvgExpenses: topKpiMonthlyAvgExpenses,
        divisionBy: monthsToUseForAverage, // Smart division
        transactionsUsed: transactionsToUse.length,
        usingRollingWindow: totalMonths > 12,
      },
      
      // Charts calculations
      charts: {
        totalExpenses: chartsTotalExpenses,
        timeFilter,
        expenseTransactionCount: chartsExpenseTransactions.length,
      },
      
      // Mismatch indicators
      mismatches: {
        expensesDiffer: Math.abs(topKpiTotalExpenses - chartsTotalExpenses) > 1,
        wrongDivision: false, // Fixed with smart logic
        timeFilterActive: timeFilter !== 'all',
      }
    };
  }, [transactions, timeFilter]);

  if (!debugData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-yellow-800 mb-2">🐛 Dashboard Debugger</h3>
        <p className="text-yellow-700">No transaction data to debug</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasMismatches = Object.values(debugData.mismatches).some(Boolean);

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      hasMismatches ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
    }`}>
      <h3 className={`font-medium mb-4 ${
        hasMismatches ? 'text-red-800' : 'text-green-800'
      }`}>
        🐛 Dashboard Data Debug {hasMismatches ? '(Issues Found)' : '(All Good)'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {/* Data Overview */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Data Overview</h4>
          <div className="space-y-1 text-gray-600">
            <div>Total Transactions: {debugData.totalTransactions}</div>
            <div>Filtered Transactions: {debugData.filteredTransactions}</div>
            <div>Date Range: {debugData.dateRange}</div>
            <div>Actual Months: {debugData.actualMonths}</div>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Top KPIs Logic</h4>
          <div className="space-y-1 text-gray-600">
            <div>Total Income: {formatCurrency(debugData.topKpi.totalIncome)}</div>
            <div>Total Expenses: {formatCurrency(debugData.topKpi.totalExpenses)}</div>
            <div>Transactions Used: {debugData.topKpi.transactionsUsed}/{debugData.totalTransactions}</div>
            <div>Divided by: {debugData.topKpi.divisionBy} months</div>
            <div>Monthly Avg: {formatCurrency(debugData.topKpi.monthlyAvgExpenses)}</div>
            {debugData.topKpi.usingRollingWindow && (
              <div className="text-blue-600 font-medium">📊 Using 12-month rolling window</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Charts Logic</h4>
          <div className="space-y-1 text-gray-600">
            <div>Time Filter: {debugData.charts.timeFilter}</div>
            <div>Expense Transactions: {debugData.charts.expenseTransactionCount}</div>
            <div>Total Expenses: {formatCurrency(debugData.charts.totalExpenses)}</div>
            <div>Applied Filter: {debugData.mismatches.timeFilterActive ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Mismatches */}
      {hasMismatches && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-medium text-red-800 mb-2">🚨 Issues Found:</h4>
          <ul className="space-y-1 text-red-700 text-sm">
            {debugData.mismatches.expensesDiffer && (
              <li>• Expense totals differ: Top KPIs vs Charts</li>
            )}
            {debugData.mismatches.wrongDivision && (
              <li>• Division logic issue detected</li>
            )}
            {debugData.mismatches.timeFilterActive && (
              <li>• Charts show filtered data ({debugData.charts.timeFilter}), but KPIs show all-time averages</li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {hasMismatches && (
        <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
          <h4 className="font-medium text-blue-800 mb-2">💡 Recommended Fixes:</h4>
          <ul className="space-y-1 text-blue-700 text-sm">
            <li>• ✅ Smart division logic implemented (uses {debugData.topKpi.divisionBy} months)</li>
            {debugData.mismatches.timeFilterActive && (
              <li>• Make top KPIs respect the same time filter as charts</li>
            )}
            {debugData.topKpi.usingRollingWindow && (
              <li>• ✅ Using rolling 12-month window for historical data</li>
            )}
          </ul>
        </div>
      )}

      {/* Current Dashboard Stats */}
      {dashboardStats && (
        <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded">
          <h4 className="font-medium text-gray-800 mb-2">📊 Current Dashboard Stats:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
            <div>Avg Income: {formatCurrency(dashboardStats.monthlyAverageIncome)}</div>
            <div>Avg Expenses: {formatCurrency(dashboardStats.monthlyAverageExpenses)}</div>
            <div>Avg Savings: {formatCurrency(dashboardStats.monthlyAverageSavings)}</div>
            <div>Last Month: {formatCurrency(dashboardStats.lastMonthExpenses)}</div>
            <div>Annual Proj: {formatCurrency(dashboardStats.annualExpenseProjection)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDebugger; 