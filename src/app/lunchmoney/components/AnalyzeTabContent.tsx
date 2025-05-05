'use client';

import React, { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

// Define types (can be refined)
interface MonthlySummary {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  netSavings: number;
  // Store dynamic category totals here
  categoryTotals: Record<string, number>; 
}

interface AnalysisData {
  monthlySummaries: MonthlySummary[];
  avgIncomeLast12Months: number;
  avgSavingsLast12Months: number;
  lastMonthSpend: number;
  avgAnnualSpendLast12Months: number;
}

// Helper function to get month string
const getMonthKey = (date: Date): string => format(date, 'yyyy-MM');

// Helper function for number formatting
const formatNumber = (num: number): string => {
  // Uses browser's default locale for separators, shows 2 decimal places
  return new Intl.NumberFormat(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(num); 
};

// Define top categories outside the component or at the top level if static
const topCategoriesToTrack = ['Groceries', 'Shopping', 'Transport', 'Utilities', 'Travel', 'Dining & Drinks']; // Example categories

// --- 1. Define the Fetch Function --- 
const fetchAnalysisTransactions = async (): Promise<any[]> => {
  // Calculate date range inside the fetch function
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), 12);
  
  const params = new URLSearchParams({
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  });

  console.log(`[Analyze RQ] Fetching transactions from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

  const response = await fetch(`/api/lunch-money/transactions?${params}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.error || `Failed to fetch transactions (${response.status})`);
  }
  const data = await response.json();
  console.log(`[Analyze RQ] Fetched ${data.transactions?.length || 0} transactions.`);
  return data.transactions || []; // Return the transactions array
};

// --- 1. Define Fetch Function for Categories --- 
const fetchAnalysisCategories = async (): Promise<any[]> => {
  console.log("[Analyze RQ] Fetching categories...");
  const response = await fetch('/api/lunch-money/categories');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.error || `Failed to fetch categories (${response.status})`);
  }
  const data = await response.json();
  console.log(`[Analyze RQ] Fetched ${data.categories?.length || 0} categories.`);
  // We primarily need the names for aggregation keys
  return data.categories || []; 
};

// --- Define Fetch Function for Assets/Savings --- 
const fetchTotalSavings = async (): Promise<{ totalSavings: number }> => {
  console.log("[Analyze RQ] Fetching total savings...");
  const response = await fetch('/api/lunch-money/assets'); // Our new endpoint
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.error || `Failed to fetch total savings (${response.status})`);
  }
  const data = await response.json();
  console.log(`[Analyze RQ] Fetched total savings: ${data.totalSavings}`);
  return data; // Expects { totalSavings: number }
};

export default function AnalyzeTabContent() {
  // --- 2. Use useQuery Hook --- 
  const { 
    data: transactions, // Rename data to transactions for clarity
    isLoading, // Use isLoading from useQuery
    isError,   // Use isError from useQuery
    error      // Use error from useQuery
  } = useQuery({
    queryKey: ['lunchMoneyTransactions', 'analyze', { period: 'last13Months' }], // Unique query key
    queryFn: fetchAnalysisTransactions, // The function to fetch data
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 15, // Cache data for 15 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });

  // --- Add Category Query --- 
  const { 
    data: categoriesData,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: errorCategories
  } = useQuery({
    queryKey: ['lunchMoneyCategories', 'analyze'], // Unique key for categories
    queryFn: fetchAnalysisCategories,
    staleTime: 1000 * 60 * 60, // Categories change less often, cache for 1 hour
    gcTime: 1000 * 60 * 75,
    refetchOnWindowFocus: false,
  });

  // --- Add Assets/Savings Query --- 
  const {
    data: savingsData,
    isLoading: isLoadingSavings,
    isError: isErrorSavings,
    error: errorSavings
  } = useQuery({
    queryKey: ['lunchMoneyTotalSavings', 'analyze'],
    queryFn: fetchTotalSavings,
    staleTime: 1000 * 60 * 15, // Cache savings for 15 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Extract category names for convenience (only when data is available)
  const categoryNames = useMemo(() => {
      if (!categoriesData) return [];
      // Filter out the transfer and income categories from the list used for display
      return categoriesData
        .map(cat => cat.name)
        .filter(Boolean) // Ensure names exist
        .filter(name => name !== 'Payment, Transfer' && name !== 'Income'); // Exclude Income too
  }, [categoriesData]);

  // Create a separate list of categories for calculation (including Income)
  const allCategoryNamesForCalc = useMemo(() => {
      if (!categoriesData) return [];
      return categoriesData
        .map(cat => cat.name)
        .filter(Boolean) // Ensure names exist
        .filter(name => name !== 'Payment, Transfer'); // Exclude only transfers for calc
  }, [categoriesData]);

  // --- 3. Adapt useMemo to use query data --- 
  const analysisData = useMemo((): AnalysisData | null => {
    // Wait for both transactions and categories
    if (!transactions || !allCategoryNamesForCalc || transactions.length === 0 || allCategoryNamesForCalc.length === 0) return null;

    console.log("[Analyze RQ] Recalculating analysis data with categories (Revised Logic)...");
    
    // --- Filter out transfer transactions --- 
    const filteredTransactions = transactions.filter(tx => 
        tx.lunchMoneyCategory !== "Payment, Transfer"
    );
    console.log(`[Analyze RQ] Started with ${transactions.length} txs, ${filteredTransactions.length} after filtering transfers.`);

    const monthlyData: Record<string, {
      income: number;
      expenses: number;
      categories: Record<string, number>; 
    }> = {};
    
    const endDate = new Date();
    const startDateForAvg = subMonths(startOfMonth(endDate), 12); // Start of 12 months ago
    // Get the start of the current month to exclude it from averages
    const startOfCurrentMonth = startOfMonth(endDate); 
    const lastFullMonthEnd = endOfMonth(subMonths(endDate, 1));
    const lastFullMonthStart = startOfMonth(subMonths(endDate, 1));

    // Use the filtered list for aggregation
    filteredTransactions.forEach(tx => {
      // Ensure amount is a number and date is valid
      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount || 0));
      if (isNaN(amount)) return; 
      let txDate: Date;
      try {
        txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) throw new Error('Invalid date');
      } catch (e) {
        console.warn(`[Analyze] Skipping transaction with invalid date: ${tx.date}`, tx);
        return; 
      }
      
      const monthKey = getMonthKey(txDate);
      
      // Initialize month data if it doesn't exist
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expenses: 0,
          // Initialize using ALL fetched category names (excl. transfers)
          categories: Object.fromEntries(allCategoryNamesForCalc.map(catName => [catName, 0])) 
        };
      }
      
      // Accumulate income/expenses based on CATEGORY
      const categoryName = tx.lunchMoneyCategory;

      if (categoryName === 'Income') {
        // Treat as Income if category is Income
        monthlyData[monthKey].income += amount;
        // Also update the specific Income category total
        if (monthlyData[monthKey].categories['Income'] !== undefined) {
           monthlyData[monthKey].categories['Income'] += amount;
        }
      } else {
        // Treat as Expense otherwise (amount can be +ve for refunds or -ve for spending)
        monthlyData[monthKey].expenses += amount; 
        
        // Accumulate specific category totals (net sum)
        if (categoryName && monthlyData[monthKey].categories[categoryName] !== undefined) {
           monthlyData[monthKey].categories[categoryName] += amount; 
        }
      }
    });

    // Calculate net savings and finalize summaries
    const monthlySummaries: MonthlySummary[] = Object.entries(monthlyData)
      .map(([month, data]) => {
        // Net Savings = Income + Net Expenses (where expenses are likely negative)
        const netSavings = data.income + data.expenses;
        const summary: MonthlySummary = {
          month,
          income: data.income,
          expenses: data.expenses,
          netSavings: netSavings,
          categoryTotals: data.categories 
        };
        return summary;
      })
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort by month

    // Calculate 12-month averages and last month spend
    let totalIncomeLast12 = 0;
    let totalSavingsLast12 = 0;
    let totalExpensesLast12 = 0;
    let monthsCounted = 0;
    let lastMonthSpend = 0;

    monthlySummaries.forEach(summary => {
        const summaryMonthStart = startOfMonth(new Date(summary.month + '-01T00:00:00Z')); // Ensure consistent date parsing
        
        // Check if the month falls within the last 12 full months AND is BEFORE the current month
        if (summaryMonthStart >= startDateForAvg && summaryMonthStart < startOfCurrentMonth) { 
            totalIncomeLast12 += summary.income;
            totalSavingsLast12 += summary.netSavings;
            totalExpensesLast12 += summary.expenses; // Use the net expense value
            monthsCounted++;
        }
        
        // Check if it's the last full month
        if (summaryMonthStart >= lastFullMonthStart && summaryMonthStart <= lastFullMonthEnd) {
           lastMonthSpend = summary.expenses;
        }
    });

    const avgIncomeLast12Months = monthsCounted > 0 ? totalIncomeLast12 / monthsCounted : 0;
    const avgSavingsLast12Months = monthsCounted > 0 ? totalSavingsLast12 / monthsCounted : 0;
    const avgAnnualSpendLast12Months = monthsCounted > 0 ? (totalExpensesLast12 / monthsCounted) * 12 : 0;
    
    console.log(`[Analyze RQ] Calculation complete. Months processed: ${monthlySummaries.length}, Months in avg: ${monthsCounted}`);

    return {
      monthlySummaries,
      avgIncomeLast12Months,
      avgSavingsLast12Months,
      lastMonthSpend,
      avgAnnualSpendLast12Months,
    };
  }, [transactions, categoriesData, allCategoryNamesForCalc]);

  // --- Calculate Years Runway (only if all data is available) ---
  const yearsRunway = useMemo(() => {
    // Check if necessary data exists
    if (!analysisData || !savingsData) {
      return null; 
    }
    // Use the absolute value of the average annual spend
    const absAvgAnnualSpend = Math.abs(analysisData.avgAnnualSpendLast12Months);

    // If absolute average spend is zero (or negligible), runway is effectively infinite
    if (absAvgAnnualSpend < 0.01) { 
      return null; // Represent infinite runway as N/A for simplicity
    }
    
    // Calculate runway
    return savingsData.totalSavings / absAvgAnnualSpend;
  }, [analysisData, savingsData]);

  // --- 5. Update Loading/Error Handling --- 
  if (isLoading || isLoadingCategories || isLoadingSavings) { 
    return <div className="text-center py-12">Loading analysis data...</div>;
  }

  if (isError || isErrorCategories || isErrorSavings) { 
    const txErrorMsg = isError ? (error instanceof Error ? error.message : String(error)) : null;
    const catErrorMsg = isErrorCategories ? (errorCategories instanceof Error ? errorCategories.message : String(errorCategories)) : null;
    const savingsErrorMsg = isErrorSavings ? (errorSavings instanceof Error ? errorSavings.message : String(errorSavings)) : null;
    return <div className="text-center py-12 text-red-600">
      Error loading data: 
      {txErrorMsg && <div>Transactions: {txErrorMsg}</div>}
      {catErrorMsg && <div>Categories: {catErrorMsg}</div>}
      {savingsErrorMsg && <div>Total Savings: {savingsErrorMsg}</div>} 
    </div>;
  }

  // --- Check analysisData (derived from query data) --- 
  if (!analysisData) {
    return <div className="text-center py-12">No transaction data found or processed for analysis.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Analysis</h2>
      
      {/* 1. Refactored Key Metrics Display using Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3 text-gray-800">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[ 
            { label: 'Total Savings', value: savingsData ? formatNumber(savingsData.totalSavings) : '-', color: 'text-gray-900' },
            { label: 'Years Runway', value: yearsRunway !== null ? formatNumber(yearsRunway) : 'N/A', color: 'text-gray-900' },
            { label: 'Avg Income (12mo)', value: formatNumber(analysisData.avgIncomeLast12Months), color: 'text-green-600' },
            { label: 'Avg Net Savings (12mo)', value: formatNumber(analysisData.avgSavingsLast12Months), color: analysisData.avgSavingsLast12Months >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Avg Annual Spend (12mo)', value: formatNumber(analysisData.avgAnnualSpendLast12Months), color: 'text-red-600' },
            { label: 'Last Month Spend', value: formatNumber(analysisData.lastMonthSpend), color: 'text-red-600' },
          ].map(metric => (
            <div key={metric.label} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{metric.label}</div>
              <div className={`text-xl font-semibold ${metric.color}`}>{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-medium mb-3 text-gray-800">Monthly Summary</h3>
        <table className="min-w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-left">Month</th>
              <th className="border-b border-gray-200 px-3 py-2 text-right">Income</th>
              <th className="border-b border-gray-200 px-3 py-2 text-right">Expenses</th>
              <th className="border-b border-gray-200 px-3 py-2 text-right">Net Savings</th>
              {/* Category headers */}
              {categoryNames.map((catName: string) => (
                <th key={catName} className="border-b border-gray-200 px-3 py-2 text-right">{catName}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {analysisData.monthlySummaries.length > 0 ? (
              analysisData.monthlySummaries.map((summary, index) => (
                <tr key={summary.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap">{summary.month}</td>
                  <td className="px-3 py-2 text-right text-green-600 font-medium">{formatNumber(summary.income)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{formatNumber(summary.expenses)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${summary.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatNumber(summary.netSavings)}</td>
                  {/* Category cells */}
                  {categoryNames.map((catName: string) => (
                    <td key={catName} className="px-3 py-2 text-right text-gray-700">
                      {formatNumber(summary.categoryTotals[catName] || 0)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4 + categoryNames.length} className="border border-gray-300 px-2 py-1 text-center italic">Processing data or no data available...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
} 