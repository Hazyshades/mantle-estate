"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PricePoint } from "~backend/city/price_history"

interface PriceChartAreaProps {
  data: PricePoint[]
}

const chartConfig = {
  value: {
    label: "Price",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export default function PriceChartArea({ data }: PriceChartAreaProps) {
  // Unique ID for gradient to avoid conflicts with multiple charts
  const gradientId = React.useId().replace(/:/g, "")
  
  // Transform PricePoint data into chart format
  const chartData = React.useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.timestamp).toISOString(),
      value: point.price,
      timestamp: point.timestamp,
    }))
  }, [data])

  // Determine date format based on data range
  const getDateFormatter = () => {
    if (chartData.length === 0) return () => ""
    
    const firstDate = new Date(chartData[0].timestamp)
    const lastDate = new Date(chartData[chartData.length - 1].timestamp)
    const diffMs = lastDate.getTime() - firstDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    // If data is for the last 7 days - show time
    if (diffDays < 7) {
      return (value: string) => {
        const date = new Date(value)
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      }
    }
    // If data is for the last year - show date without year
    if (diffDays < 365) {
      return (value: string) => {
        const date = new Date(value)
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    }
    // For longer periods - show date with year
    return (value: string) => {
      const date = new Date(value)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }
  }

  const dateFormatter = getDateFormatter()

  // Calculate dynamic Y-axis domain based on visible data
  const yAxisDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 100]
    
    const values = chartData.map((point) => point.value).filter((v) => v != null)
    
    if (values.length === 0) return [0, 100]
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    
    // Add 10% padding on top and bottom to prevent clipping
    const padding = range * 0.1 || (max * 0.1)
    const domainMin = Math.max(0, min - padding)
    const domainMax = max + padding
    
    return [domainMin, domainMax]
  }, [chartData])

  if (chartData.length === 0) {
    return null
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <AreaChart 
        data={chartData} 
        accessibilityLayer
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <defs>
          <linearGradient id={`fillValue-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-value)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={dateFormatter}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={yAxisDomain}
          tickFormatter={(value) => {
            if (value >= 1000000) {
              return `$${(value / 1000000).toFixed(1)}M`
            }
            if (value >= 1000) {
              return `$${(value / 1000).toFixed(0)}K`
            }
            return `$${value.toFixed(0)}`
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                const date = new Date(value)
                const diffMs = Date.now() - date.getTime()
                const diffDays = diffMs / (1000 * 60 * 60 * 24)
                
                if (diffDays < 7) {
                  return date.toLocaleTimeString("en-US", { 
                    hour: "2-digit", 
                    minute: "2-digit",
                    day: "numeric",
                    month: "short"
                  })
                }
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: diffDays > 365 ? "numeric" : undefined,
                })
              }}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="value"
          type="natural"
          fill={`url(#fillValue-${gradientId})`}
          stroke="var(--color-value)"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}