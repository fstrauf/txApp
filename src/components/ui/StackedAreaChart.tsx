"use client"

import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  AvailableChartColorsKeys,
  constructCategoryColors,
  defaultColors,
  getColorClassName,
} from "@/lib/chartUtils"
import { cn } from "@/lib/utils"

type PayloadItem = {
  category: string
  value: number
  color: AvailableChartColorsKeys
}

interface ChartTooltipProps {
  active: boolean | undefined
  payload: PayloadItem[]
  label: string
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-2 text-sm shadow-md">
        <div className="mb-2">
          <p className="font-medium text-gray-900">{label}</p>
        </div>
        <div className="space-y-1">
          {payload.map(({ category, value, color }, index) => (
            <div
              key={`id-${index}`}
              className="flex items-center justify-between space-x-8"
            >
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    getColorClassName(color, "bg"),
                  )}
                />
                <p className="whitespace-nowrap text-right text-gray-700">
                  {category}
                </p>
              </div>
              <p className="whitespace-nowrap text-right font-medium tabular-nums text-gray-900">
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

interface StackedAreaChartProps {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  className?: string
}

export const StackedAreaChart = ({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (value) => `${value}%`,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  className,
}: StackedAreaChartProps) => {
  const categoryColors = constructCategoryColors(categories, colors)

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && <XAxis dataKey={index} />}
          {showYAxis && (
            <YAxis
              tickFormatter={(value) => `${value}`}
              domain={[0, 100]}
              allowDataOverflow={true}
            />
          )}
          {showTooltip && (
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              isAnimationActive={false}
              cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                const cleanPayload =
                  payload?.filter(item => item.dataKey && typeof item.value === 'number').map((item) => ({
                    ...item,
                    value: item.value as number,
                    category: String(item.dataKey!),
                    color: categoryColors.get(
                      String(item.dataKey!),
                    ) as AvailableChartColorsKeys,
                  })) ?? []
                cleanPayload.reverse()
                return (
                  <ChartTooltip
                    active={active}
                    payload={cleanPayload}
                    label={label}
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                )
              }}
            />
          )}

          {categories.map((category) => {
            const color = categoryColors.get(category) || defaultColors[0]
            return (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                strokeWidth={2}
                stroke={`var(--color-${color})`}
                fill={`var(--color-${color})`}
                fillOpacity={0.8}
                className={cn(
                  getColorClassName(color, "stroke"),
                  getColorClassName(color, "fill"),
                )}
                style={
                  {
                    [`--color-${color}`]: `rgb(var(--color-${color}-500))`,
                  } as React.CSSProperties
                }
              />
            )
          })}

          {showLegend && (
            <Legend
              verticalAlign="top"
              height={40}
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-4">
                  {payload?.map((item) => (
                    <div key={item.value} className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: item.color,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 