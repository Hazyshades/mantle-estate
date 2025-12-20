"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PricePoint } from "~backend/city/price_history"

interface PriceChartShadcnProps {
  data: PricePoint[]
  showIndexPrice?: boolean
  showMarketPrice?: boolean
  timeRange?: "1d" | "1w" | "1m" | "all"
  height?: number
}

const chartConfig = {
  indexPrice: {
    label: "Index Price",
    color: "hsl(217, 91%, 60%)", // Bright blue for light theme
  },
  marketPrice: {
    label: "Market Price",
    color: "hsl(210, 50%, 55%)", // Medium blue for light theme
  },
} satisfies ChartConfig

export default function PriceChartShadcn({ 
  data, 
  showIndexPrice = true, 
  showMarketPrice = false,
  timeRange = "all",
  height = 384
}: PriceChartShadcnProps) {
  // Unique IDs for gradients
  const gradientIdIndex = React.useId().replace(/:/g, "")
  const gradientIdMarket = React.useId().replace(/:/g, "")
  
  // Transform PricePoint data into chart format
  const chartData = React.useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.timestamp).toISOString(),
      timestamp: point.timestamp,
      indexPrice: point.indexPrice ?? point.price,
      marketPrice: point.marketPrice ?? point.price,
    }))
  }, [data])

  // Format date based on time range
  const getDateFormatter = () => {
    if (chartData.length === 0) return () => ""
    
    if (timeRange === "1d") {
      return (value: string) => {
        const date = new Date(value)
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      }
    }
    
    if (timeRange === "1w") {
      return (value: string) => {
        const date = new Date(value)
        return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
      }
    }
    
    if (timeRange === "1m") {
      return (value: string) => {
        const date = new Date(value)
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    }
    
    // For "all" - show date with year
    return (value: string) => {
      const date = new Date(value)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }
  }

  const dateFormatter = getDateFormatter()

  // Calculate dynamic Y-axis domain based on visible data
  const yAxisDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 100]
    
    const values: number[] = []
    
    if (showIndexPrice) {
      chartData.forEach((point) => {
        if (point.indexPrice != null) {
          values.push(point.indexPrice)
        }
      })
    }
    
    if (showMarketPrice) {
      chartData.forEach((point) => {
        if (point.marketPrice != null) {
          values.push(point.marketPrice)
        }
      })
    }
    
    if (values.length === 0) return [0, 100]
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    
    // Add more padding on top (15%) and bottom (10%) to prevent clipping
    const topPadding = range * 0.15 || (max * 0.15)
    const bottomPadding = range * 0.1 || (min * 0.1)
    const domainMin = Math.max(0, min - bottomPadding)
    const domainMax = max + topPadding
    
    return [domainMin, domainMax]
  }, [chartData, showIndexPrice, showMarketPrice])

  if (chartData.length === 0) {
    return null
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: `${height}px` }}
    >
      <AreaChart 
        data={chartData} 
        accessibilityLayer
        margin={{ top: 40, right: 20, bottom: 20, left: 20 }}
      >
        <defs>
          {showIndexPrice && (
            <linearGradient id={`fillIndex-${gradientIdIndex}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-indexPrice)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-indexPrice)"
                stopOpacity={0.1}
              />
            </linearGradient>
          )}
          {showMarketPrice && (
            <linearGradient id={`fillMarket-${gradientIdMarket}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-marketPrice)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-marketPrice)"
                stopOpacity={0.1}
              />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={timeRange === "1m" ? 0 : 32}
          angle={timeRange === "1m" ? -45 : 0}
          textAnchor={timeRange === "1m" ? "end" : "middle"}
          height={timeRange === "1m" ? 80 : 30}
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
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null

            const date = new Date(label)
            const formattedDate = timeRange === "1d"
              ? date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: timeRange === "all" ? "numeric" : undefined,
                })

            return (
              <div className="rounded-lg border bg-card p-2 shadow-sm">
                <div className="grid gap-2">
                  <div className="font-medium text-sm">{formattedDate}</div>
                  <div className="grid gap-1.5">
                    {payload.map((item, index) => {
                      if (!item.value) return null
                      
                      // Only show items for visible series
                      if (item.dataKey === "indexPrice" && !showIndexPrice) return null
                      if (item.dataKey === "marketPrice" && !showMarketPrice) return null
                      
                      const label = item.dataKey === "indexPrice" ? "Index Price" : "Market Price"
                      const color = item.color || (item.dataKey === "indexPrice" ? chartConfig.indexPrice.color : chartConfig.marketPrice.color)
                      
                      return (
                        <div key={index} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm text-muted-foreground">{label}</span>
                          </div>
                          <span 
                            className="text-sm font-mono font-medium tabular-nums text-foreground"
                            style={{ color: color }}
                          >
                            ${typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }}
        />
        <Legend
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            
            return (
              <div className="flex items-center justify-center gap-6 mt-4">
                {payload.map((entry, index) => {
                  if (!entry.value) return null
                  
                  // Only show legend items for visible series
                  if (entry.value === "indexPrice" && !showIndexPrice) return null
                  if (entry.value === "marketPrice" && !showMarketPrice) return null
                  
                  return (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: entry.color,
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.value === "indexPrice" ? "Index Price" : "Market Price"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
        {showIndexPrice && (
          <Area
            dataKey="indexPrice"
            type="natural"
            fill={`url(#fillIndex-${gradientIdIndex})`}
            stroke="var(--color-indexPrice)"
          />
        )}
        {showMarketPrice && (
          <Area
            dataKey="marketPrice"
            type="natural"
            fill={`url(#fillMarket-${gradientIdMarket})`}
            stroke="var(--color-marketPrice)"
          />
        )}
      </AreaChart>
    </ChartContainer>
  )
}
