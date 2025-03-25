'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import MonthlyTable from './MonthlyTable';

// Define types explicitly to match MonthlyTable
interface CategoryExpense {
  id: string;
  monthlyAggregateId: string;
  categoryId: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
}

interface MonthlyAggregate {
  id: string;
  userId: string;
  month: Date;
  income: number;
  tax: number;
  credit: number;
  netIncome: number;
  expenses: number;
  netSavings: number;
  netBurn: number;
  savingsRate: number;
  createdAt: Date;
  updatedAt: Date;
  categoryExpenses: CategoryExpense[];
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAggregate[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 11), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch monthly data when component mounts
  useEffect(() => {
    fetchMonthlyData();
  }, []);

  // Function to fetch monthly data
  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/monthly?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      const data = await response.json();
      
      if (!data.monthlyData) {
        throw new Error('Invalid response format');
      }
      
      // Convert strings to dates for proper formatting
      const formattedData = data.monthlyData.map((item: any) => ({
        ...item,
        month: new Date(item.month),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        categoryExpenses: item.categoryExpenses.map((expense: any) => ({
          ...expense,
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt),
        })),
      }));
      
      setMonthlyData(formattedData);
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading monthly data';
      setError(errorMessage);
      console.error('Error fetching monthly data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate data for current month
  const generateCurrentMonth = async () => {
    try {
      setIsGenerating(true);
      const currentMonth = format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch('/api/analytics/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateMonth',
          month: currentMonth,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate data');
      }
      
      // Refresh the data
      await fetchMonthlyData();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generating monthly data';
      setError(errorMessage);
      console.error('Error generating monthly data:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to recalculate all months in range
  const recalculateRange = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/analytics/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'recalculate',
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to recalculate data');
      }
      
      // Refresh the data
      await fetchMonthlyData();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error recalculating monthly data';
      setError(errorMessage);
      console.error('Error recalculating monthly data:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={fetchMonthlyData}
          className="bg-gray-100 hover:bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Update Range
        </button>
        
        <button
          onClick={generateCurrentMonth}
          disabled={isGenerating}
          className="bg-blue-500 hover:bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Current Month'}
        </button>
        
        <button
          onClick={recalculateRange}
          disabled={isGenerating}
          className="bg-indigo-500 hover:bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isGenerating ? 'Processing...' : 'Recalculate All'}
        </button>
      </div>
      
      {loading ? (
        <div className="py-4 text-center">Loading monthly data...</div>
      ) : monthlyData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-8 rounded text-center">
          <p>No monthly data available for the selected period.</p>
          <p className="mt-2">
            Click "Generate Current Month" to create your first monthly summary.
          </p>
        </div>
      ) : (
        <MonthlyTable data={monthlyData} />
      )}
    </div>
  );
} 