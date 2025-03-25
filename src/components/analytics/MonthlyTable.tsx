'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Category } from '@prisma/client';

// Define types manually to avoid Prisma client issues
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

interface MonthlyTableProps {
  data: MonthlyAggregate[];
}

export default function MonthlyTable({ data }: MonthlyTableProps) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Get all unique category names
  const allCategories = new Set<string>();
  data.forEach(month => {
    month.categoryExpenses.forEach(expense => {
      allCategories.add(expense.category.name);
    });
  });
  
  const categoryNames = Array.from(allCategories).sort();

  // Toggle category details for a month
  const toggleMonth = (monthId: string) => {
    if (expandedMonth === monthId) {
      setExpandedMonth(null);
    } else {
      setExpandedMonth(monthId);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Month
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Income
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expenses
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Net Savings
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Savings Rate
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(month => (
            <React.Fragment key={month.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {format(new Date(month.month), 'MMMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(month.income)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(month.expenses)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={month.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(month.netSavings)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={month.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(month.savingsRate)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => toggleMonth(month.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {expandedMonth === month.id ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
              
              {/* Category breakdown */}
              {expandedMonth === month.id && (
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-3">Category Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {categoryNames.map(catName => {
                          const catExpense = month.categoryExpenses.find(
                            e => e.category.name === catName
                          );
                          const amount = catExpense ? catExpense.amount : 0;
                          const percentage = month.expenses > 0 ? (amount / month.expenses) * 100 : 0;
                          
                          return (
                            <div key={catName} className="flex justify-between">
                              <span className="text-sm text-gray-600">{catName}</span>
                              <span className="text-sm font-medium">
                                {formatCurrency(amount)} ({formatPercentage(percentage)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 