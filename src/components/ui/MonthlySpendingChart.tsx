'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { formatCurrency } from '@/app/personal-finance/engine/FinancialRulesEngine';
import { constructCategoryColors, getColorClassName, AvailableChartColorsKeys } from '@/lib/chartUtils';
import { Box } from './Box';
import type { TimeSeriesData, MonthlyAggregation, RollingMetrics } from '@/app/personal-finance/engine/DataAnalysisEngine';

interface MonthlySpendingChartProps {
  timeSeriesData: TimeSeriesData[];
  monthlyData: MonthlyAggregation[];
  rollingMetrics?: RollingMetrics[];
  selectedCategories?: string[];
  onCategoryToggle?: (category: string) => void;
  className?: string;
}

type ChartType = 'area' | 'line' | 'bar';
type ViewMode = 'categories' | 'total' | 'rolling';

const CHART_COLORS: AvailableChartColorsKeys[] = [
  'indigo', 'blue', 'emerald', 'amber', 'red', 'orange', 'teal', 'violet', 'pink', 'cyan'
];

export function MonthlySpendingChart({
  timeSeriesData,
  monthlyData,
  rollingMetrics,
  selectedCategories = [],
  onCategoryToggle,
  className = ''
}: MonthlySpendingChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [showRollingAverage, setShowRollingAverage] = useState(false);

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <Box variant="elevated" className={`p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No monthly spending data available</p>
          <p className="text-sm mt-1">Import transaction data to see trends over time</p>
        </div>
      </Box>
    );
  }

  // Get all unique categories
  const allCategories = Array.from(
    new Set(timeSeriesData.flatMap(month => Object.keys(month.categories)))
  ).sort();

  // Create color mapping for categories
  const categoryColors = constructCategoryColors(allCategories, CHART_COLORS);

  // Prepare data based on view mode
  const prepareChartData = () => {
    if (viewMode === 'total') {
      return timeSeriesData.map(month => ({
        monthName: month.monthName,
        monthKey: month.monthKey,
        total: month.total,
        ...(rollingMetrics && showRollingAverage && {
          rollingAverage: rollingMetrics.find(r => r.monthKey === month.monthKey)?.rollingAverage || 0
        })
      }));
    }

    if (viewMode === 'rolling' && rollingMetrics) {
      return rollingMetrics.map(metric => {
        const monthData = timeSeriesData.find(m => m.monthKey === metric.monthKey);
        return {
          monthName: monthData?.monthName || metric.monthKey,
          monthKey: metric.monthKey,
          currentMonth: metric.currentMonth,
          rollingAverage: metric.rollingAverage,
          percentageChange: metric.percentageChange
        };
      });
    }

    // Categories view
    const categoriesToShow = selectedCategories.length > 0 ? selectedCategories : allCategories.slice(0, 8);
    
    return timeSeriesData.map(month => {
      const result: any = {
        monthName: month.monthName,
        monthKey: month.monthKey,
        total: month.total
      };
      
      categoriesToShow.forEach(category => {
        result[category] = month.categories[category] || 0;
      });
      
      return result;
    });
  };

  const chartData = prepareChartData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span>{formatCurrency(entry.value)}</span>
              {entry.name === 'percentageChange' && (
                <span className={`ml-1 ${entry.value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ({entry.value > 0 ? '+' : ''}{entry.value.toFixed(1)}%)
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render the appropriate chart based on type and view mode
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 40, bottom: 60 }
    };

    if (viewMode === 'total') {
      const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'line' ? LineChart : BarChart;
      
      return (
        <ChartComponent {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="monthName" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value, true)} fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {chartType === 'area' && (
            <>
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#4f46e5" 
                fill="#4f46e5" 
                fillOpacity={0.3} 
                name="Total Spending"
              />
              {showRollingAverage && (
                <Area 
                  type="monotone" 
                  dataKey="rollingAverage" 
                  stroke="#f59e0b" 
                  fill="none" 
                  strokeDasharray="5 5"
                  name="6-Month Average"
                />
              )}
            </>
          )}
          
          {chartType === 'line' && (
            <>
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#4f46e5" 
                strokeWidth={3}
                dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                name="Total Spending"
              />
              {showRollingAverage && (
                <Line 
                  type="monotone" 
                  dataKey="rollingAverage" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                  name="6-Month Average"
                />
              )}
            </>
          )}
          
          {chartType === 'bar' && (
            <>
              <Bar dataKey="total" fill="#4f46e5" name="Total Spending" />
              {showRollingAverage && (
                <Bar dataKey="rollingAverage" fill="#f59e0b" name="6-Month Average" opacity={0.7} />
              )}
            </>
          )}
        </ChartComponent>
      );
    }

    if (viewMode === 'rolling' && rollingMetrics) {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="monthName" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value, true)} fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Line 
            type="monotone" 
            dataKey="currentMonth" 
            stroke="#4f46e5" 
            strokeWidth={3}
            dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
            name="Current Month"
          />
          <Line 
            type="monotone" 
            dataKey="rollingAverage" 
            stroke="#f59e0b" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
            name="6-Month Rolling Average"
          />
        </LineChart>
      );
    }

    // Categories view
    const categoriesToShow = selectedCategories.length > 0 ? selectedCategories : allCategories.slice(0, 8);
    const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'line' ? LineChart : BarChart;
    
    return (
      <ChartComponent {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="monthName" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />
        <YAxis tickFormatter={(value) => formatCurrency(value, true)} fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {categoriesToShow.map((category, index) => {
          const color = categoryColors.get(category);
          const colorValue = color ? `var(--color-${color}-500)` : CHART_COLORS[index % CHART_COLORS.length];
          
          if (chartType === 'area') {
            return (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={colorValue}
                fill={colorValue}
                fillOpacity={0.6}
                name={category}
              />
            );
          } else if (chartType === 'line') {
            return (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colorValue}
                strokeWidth={2}
                dot={{ fill: colorValue, strokeWidth: 2, r: 3 }}
                name={category}
              />
            );
          } else {
            return (
              <Bar
                key={category}
                dataKey={category}
                stackId="1"
                fill={colorValue}
                name={category}
              />
            );
          }
        })}
      </ChartComponent>
    );
  };

  return (
    <Box variant="elevated" className={`p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Monthly Spending Trends
          </h3>
          <p className="text-sm text-gray-600">
            {timeSeriesData.length} months of data • 
            {viewMode === 'categories' && ` ${selectedCategories.length > 0 ? selectedCategories.length : Math.min(8, allCategories.length)} categories shown`}
            {viewMode === 'total' && ' Total spending over time'}
            {viewMode === 'rolling' && ' Rolling average comparison'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['categories', 'total', 'rolling'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {mode === 'categories' && 'By Category'}
                {mode === 'total' && 'Total'}
                {mode === 'rolling' && 'Rolling Avg'}
              </button>
            ))}
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['area', 'line', 'bar'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  chartType === type
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Rolling Average Toggle for Total view */}
          {viewMode === 'total' && rollingMetrics && (
            <button
              onClick={() => setShowRollingAverage(!showRollingAverage)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all border ${
                showRollingAverage
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:text-gray-800'
              }`}
            >
              6M Avg
            </button>
          )}
        </div>
      </div>

      {/* Category selection for categories view */}
      {viewMode === 'categories' && allCategories.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Categories:</span>
            {allCategories.slice(0, 12).map((category) => (
              <button
                key={category}
                onClick={() => onCategoryToggle?.(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  selectedCategories.includes(category) || (selectedCategories.length === 0 && allCategories.slice(0, 8).includes(category))
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
            {allCategories.length > 12 && (
              <span className="text-xs text-gray-500 self-center">
                +{allCategories.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">Avg/Month</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">Highest</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(Math.max(...monthlyData.map(m => m.total)))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">Lowest</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(Math.min(...monthlyData.map(m => m.total)))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">Total Period</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(monthlyData.reduce((sum, m) => sum + m.total, 0))}
          </div>
        </div>
      </div>
    </Box>
  );
} 