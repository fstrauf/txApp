// Tremor StackedBarChart [v1.0.0]
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import React from "react"
import {
  Bar,
  BarChart as ReChartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  AvailableChartColors,
  constructCategoryColors,
  defaultColors,
  getColorClassName,
  type AvailableChartColorsKeys,
} from "@/lib/chartUtils"
import { cn } from "@/lib/utils"

const getColorHex = (colorName: AvailableChartColorsKeys): string => {
  const colorMap: Record<AvailableChartColorsKeys, string> = {
    indigo: '#6366f1',
    blue: '#3b82f6',
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    orange: '#f97316',
    teal: '#14b8a6',
    violet: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    lime: '#84cc16',
    fuchsia: '#d946ef',
    sky: '#0ea5e9',
    rose: '#f43f5e',
    green: '#22c55e',
    yellow: '#eab308'
  };
  return colorMap[colorName] || '#6b7280';
}

//#region Tooltip

type PayloadItem = {
  category: string
  value: number
  color: AvailableChartColorsKeys
}

interface ChartTooltipProps {
  active: boolean | undefined
  payload: PayloadItem[]
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({
  active,
  payload,
  valueFormatter,
}: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={cn(
          // base
          "rounded-md border text-sm shadow-md",
          // border color - always light
          "border-gray-200",
          // background color - always white
          "bg-white",
        )}
      >
        <div className={cn("space-y-1 px-4 py-2")}>
          {payload.map(({ value, category, color }, index) => (
            <div
              key={`id-${index}`}
              className="flex items-center justify-between space-x-8"
            >
              <div className="flex items-center space-x-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    getColorClassName(color, "bg"),
                  )}
                />
                <p
                  className={cn(
                    // base
                    "text-left whitespace-nowrap text-sm",
                    // text color - always dark for readability on white background
                    "text-gray-700",
                  )}
                >
                  {category}
                </p>
              </div>
              <p
                className={cn(
                  // base
                  "text-right font-medium whitespace-nowrap tabular-nums text-sm",
                  // text color - always dark for readability on white background
                  "text-gray-900",
                )}
              >
                {valueFormatter(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

//#endregion

type BaseEventProps = {
  eventType: "bar"
  categoryClicked: string
  [key: string]: number | string
}

type StackedBarChartEventProps = BaseEventProps | null | undefined

interface StackedBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  categories?: string[]
  xAxisKey?: string
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  showTooltip?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
  selectedCategory?: string | null
  onValueChange?: (value: StackedBarChartEventProps) => void
}

const StackedBarChart = React.forwardRef<HTMLDivElement, StackedBarChartProps>(
  (
    {
      data = [],
      categories = [],
      xAxisKey = "displayMonth",
      colors = defaultColors,
      valueFormatter = (value: number) => value.toString(),
      showTooltip = true,
      showXAxis = true,
      showYAxis = true,
      showGrid = true,
      showLegend = false,
      selectedCategory,
      onValueChange,
      className,
      ...other
    },
    forwardedRef,
  ) => {

    if (!data.length) return null

    // Get categories from data if not provided
    const dataCategories = categories.length > 0 ? categories : (() => {
      const cats = new Set<string>()
      data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== xAxisKey && key !== 'month' && key !== 'total' && typeof item[key] === 'number') {
            cats.add(key)
          }
        })
      })
      return Array.from(cats)
    })()

    // Create color mapping
    const categoryColors = constructCategoryColors(dataCategories, colors)

    const formatAxisLabel = (value: string) => {
      if (value?.includes(' ')) {
        return value.split(' ')[0] // Just show month name
      }
      return value
    }

    const formatYAxisLabel = (value: number) => {
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}k`
      }
      return `$${value}`
    }

    const formatCategoryName = (category: string): string => {
      return category
        .replace(/_/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    const responsiveFontSize = 12;
    const responsiveTickColor = '#6b7280';
    const responsiveAxisColor = '#e5e7eb';

    return (
      <div
        ref={forwardedRef}
        className={cn("w-full h-full", className)}
        tremor-id="tremor-raw"
        {...other}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ReChartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" />
            )}
            
            {showXAxis && (
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={formatAxisLabel}
                tick={{ fontSize: responsiveFontSize, fill: responsiveTickColor }}
                axisLine={{ stroke: responsiveAxisColor }}
                tickLine={{ stroke: responsiveAxisColor }}
              />
            )}
            
            {showYAxis && (
              <YAxis
                tickFormatter={formatYAxisLabel}
                tick={{ fontSize: responsiveFontSize, fill: responsiveTickColor }}
                axisLine={{ stroke: responsiveAxisColor }}
                tickLine={{ stroke: responsiveAxisColor }}
              />
            )}

            {showTooltip && (
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const cleanPayload = payload
                    ? payload.map((item: any) => ({
                        category: formatCategoryName(item.dataKey),
                        value: item.value,
                        color: categoryColors.get(item.dataKey) as AvailableChartColorsKeys,
                      }))
                    : []

                  return showTooltip && active ? (
                    <ChartTooltip
                      active={active}
                      payload={cleanPayload}
                      valueFormatter={valueFormatter}
                    />
                  ) : null
                }}
              />
            )}

            {/* {showLegend && (
              <Legend 
                formatter={(value: string) => formatCategoryName(value)}
                wrapperStyle={{ 
                  fontSize: `${responsiveFontSize}px`, 
                  color: responsiveTickColor,
                  paddingTop: '16px'
                }}
              />
            )} */}

            {dataCategories.map((category, index) => {
              const baseColor = getColorHex(categoryColors.get(category) || colors[index % colors.length])
              
              return (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="a"
                  fill={baseColor}
                  radius={[0, 0, 0, 0]}
                />
              )
            })}
          </ReChartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

StackedBarChart.displayName = "StackedBarChart"

export { StackedBarChart, type StackedBarChartEventProps } 