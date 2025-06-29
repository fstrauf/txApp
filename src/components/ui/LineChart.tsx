// Tremor LineChart [v1.0.0]
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import React from "react"
import {
  Line,
  LineChart as ReChartsLineChart,
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

//#region Tooltip

type TooltipProps = Pick<ChartTooltipProps, "active" | "payload" | "label">

type PayloadItem = {
  category: string
  value: number
  color: AvailableChartColorsKeys
  formatter?: (value: number) => string
  isPrimary?: boolean
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
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-900">{label}</p>
          </div>
          {payload.map(({ value, category, color, formatter, isPrimary }, index) => (
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
                    "text-right whitespace-nowrap",
                    // text color - always dark for readability on white background
                    "text-gray-700",
                  )}
                >
                  {category} {!isPrimary && "(Total)"}
                </p>
              </div>
              <p
                className={cn(
                  // base
                  "text-right font-medium whitespace-nowrap tabular-nums",
                  // text color - always dark for readability on white background
                  "text-gray-900",
                )}
              >
                {formatter ? formatter(value) : valueFormatter(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

type BaseEventProps = {
  eventType: "line"
  categoryClicked: string
  [key: string]: number | string
}

type LineChartEventProps = BaseEventProps | null | undefined

interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
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
  onValueChange?: (value: LineChartEventProps) => void
  tooltipCallback?: (tooltipCallbackContent: TooltipProps) => void
  customTooltip?: React.ComponentType<TooltipProps>
  connectNulls?: boolean
  type?: "linear" | "step" | "stepBefore" | "stepAfter"
  // Dual y-axis support
  secondaryCategories?: string[]
  secondaryColors?: AvailableChartColorsKeys[]
  secondaryValueFormatter?: (value: number) => string
  showSecondaryYAxis?: boolean
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  (
    {
      data = [],
      index,
      categories = [],
      colors = defaultColors,
      valueFormatter = (value: number) => value.toString(),
      showLegend = true,
      showTooltip = true,
      showGrid = true,
      showXAxis = true,
      showYAxis = true,
      onValueChange,
      tooltipCallback,
      customTooltip,
      connectNulls = false,
      type = "linear",
      className,
      secondaryCategories = [],
      secondaryColors = defaultColors,
      secondaryValueFormatter = (value: number) => value.toString(),
      showSecondaryYAxis = false,
      ...other
    },
    forwardedRef,
  ) => {
    const CustomTooltip = customTooltip
    const categoryColors = constructCategoryColors(categories, colors)
    const secondaryCategoryColors = constructCategoryColors(secondaryCategories, secondaryColors)

    const prevActiveRef = React.useRef<boolean | undefined>(undefined)
    const prevLabelRef = React.useRef<string | undefined>(undefined)

    const handleLineClick = (
      data: any,
      event: React.MouseEvent,
    ) => {
      event.stopPropagation()
      if (!onValueChange) return

      onValueChange({
        eventType: "line",
        categoryClicked: data.dataKey,
        ...data.payload,
      })
    }

    return (
      <div
        ref={forwardedRef}
        className={cn("w-full h-full min-h-60", className)}
        tremor-id="tremor-raw"
        {...other}
      >
        <ResponsiveContainer className="size-full">
          <ReChartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200"
              />
            )}
            {showXAxis && (
              <XAxis
                dataKey={index}
                className="text-xs fill-gray-500"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
            )}
            {showYAxis && (
              <YAxis
                yAxisId="left"
                className="text-xs fill-gray-500"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={valueFormatter}
              />
            )}
            {showSecondaryYAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs fill-gray-500"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={secondaryValueFormatter}
              />
            )}
            {showTooltip && (
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                isAnimationActive={false}
                content={({ active, payload, label }) => {
                  const cleanPayload = payload
                    ? payload.map((item: any) => {
                        const isPrimaryCategory = categories.includes(item.dataKey);
                        const isSecondaryCategory = secondaryCategories.includes(item.dataKey);
                        const colorMap = isPrimaryCategory ? categoryColors : secondaryCategoryColors;
                        const formatter = isPrimaryCategory ? valueFormatter : secondaryValueFormatter;
                        
                        return {
                          category: item.dataKey,
                          value: item.value,
                          color: colorMap.get(item.dataKey) as AvailableChartColorsKeys,
                          formatter: formatter,
                          isPrimary: isPrimaryCategory
                        };
                      })
                    : []

                  const payloadLabel: string = label || ""

                  if (
                    tooltipCallback &&
                    (active !== prevActiveRef.current ||
                      payloadLabel !== prevLabelRef.current)
                  ) {
                    tooltipCallback({
                      active,
                      payload: cleanPayload,
                      label: payloadLabel,
                    })
                    prevActiveRef.current = active
                    prevLabelRef.current = payloadLabel
                  }

                  return showTooltip && active ? (
                    CustomTooltip ? (
                      <CustomTooltip active={active} payload={cleanPayload} label={payloadLabel} />
                    ) : (
                      <ChartTooltip
                        active={active}
                        payload={cleanPayload}
                        label={payloadLabel}
                        valueFormatter={valueFormatter}
                      />
                    )
                  ) : null
                }}
              />
            )}
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{
                  paddingBottom: "20px",
                  fontSize: "12px",
                }}
              />
            )}
            {categories.map((category) => (
              <Line
                key={category}
                type={type}
                dataKey={category}
                yAxisId="left"
                stroke={`var(--color-${categoryColors.get(category) || AvailableChartColors[0]})`}
                strokeWidth={2}
                dot={{
                  fill: `var(--color-${categoryColors.get(category) || AvailableChartColors[0]})`,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                }}
                connectNulls={connectNulls}
                onClick={handleLineClick}
                className={cn(
                  getColorClassName(
                    categoryColors.get(category) || AvailableChartColors[0],
                    "stroke",
                  ),
                  onValueChange ? "cursor-pointer" : "cursor-default",
                )}
                style={{
                  [`--color-${categoryColors.get(category) || AvailableChartColors[0]}`]: `rgb(var(--color-${categoryColors.get(category) || AvailableChartColors[0]}) / 1)`,
                } as React.CSSProperties}
              />
            ))}
            {secondaryCategories.map((category) => (
              <Line
                key={`secondary-${category}`}
                type={type}
                dataKey={category}
                yAxisId="right"
                stroke={`var(--color-${secondaryCategoryColors.get(category) || AvailableChartColors[0]})`}
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{
                  fill: `var(--color-${secondaryCategoryColors.get(category) || AvailableChartColors[0]})`,
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 2,
                }}
                connectNulls={connectNulls}
                onClick={handleLineClick}
                className={cn(
                  getColorClassName(
                    secondaryCategoryColors.get(category) || AvailableChartColors[0],
                    "stroke",
                  ),
                  onValueChange ? "cursor-pointer" : "cursor-default",
                )}
                style={{
                  [`--color-${secondaryCategoryColors.get(category) || AvailableChartColors[0]}`]: `rgb(var(--color-${secondaryCategoryColors.get(category) || AvailableChartColors[0]}) / 1)`,
                } as React.CSSProperties}
              />
            ))}
          </ReChartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

LineChart.displayName = "LineChart"

export { LineChart, type LineChartEventProps, type TooltipProps } 