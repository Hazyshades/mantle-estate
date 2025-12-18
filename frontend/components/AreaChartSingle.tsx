"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart with single data series"

const chartData = [
  { date: "2024-04-01", value: 222 },
  { date: "2024-04-02", value: 97 },
  { date: "2024-04-03", value: 167 },
  { date: "2024-04-04", value: 242 },
  { date: "2024-04-05", value: 373 },
  { date: "2024-04-06", value: 301 },
  { date: "2024-04-07", value: 245 },
  { date: "2024-04-08", value: 409 },
  { date: "2024-04-09", value: 59 },
  { date: "2024-04-10", value: 261 },
  { date: "2024-04-11", value: 327 },
  { date: "2024-04-12", value: 292 },
  { date: "2024-04-13", value: 342 },
  { date: "2024-04-14", value: 137 },
  { date: "2024-04-15", value: 120 },
  { date: "2024-04-16", value: 138 },
  { date: "2024-04-17", value: 446 },
  { date: "2024-04-18", value: 364 },
  { date: "2024-04-19", value: 243 },
  { date: "2024-04-20", value: 89 },
  { date: "2024-04-21", value: 137 },
  { date: "2024-04-22", value: 224 },
  { date: "2024-04-23", value: 138 },
  { date: "2024-04-24", value: 387 },
  { date: "2024-04-25", value: 215 },
  { date: "2024-04-26", value: 75 },
  { date: "2024-04-27", value: 383 },
  { date: "2024-04-28", value: 122 },
  { date: "2024-04-29", value: 315 },
  { date: "2024-04-30", value: 454 },
  { date: "2024-05-01", value: 165 },
  { date: "2024-05-02", value: 293 },
  { date: "2024-05-03", value: 247 },
  { date: "2024-05-04", value: 385 },
  { date: "2024-05-05", value: 481 },
  { date: "2024-05-06", value: 498 },
  { date: "2024-05-07", value: 388 },
  { date: "2024-05-08", value: 149 },
  { date: "2024-05-09", value: 227 },
  { date: "2024-05-10", value: 293 },
  { date: "2024-05-11", value: 335 },
  { date: "2024-05-12", value: 197 },
  { date: "2024-05-13", value: 197 },
  { date: "2024-05-14", value: 448 },
  { date: "2024-05-15", value: 473 },
  { date: "2024-05-16", value: 338 },
  { date: "2024-05-17", value: 499 },
  { date: "2024-05-18", value: 315 },
  { date: "2024-05-19", value: 235 },
  { date: "2024-05-20", value: 177 },
  { date: "2024-05-21", value: 82 },
  { date: "2024-05-22", value: 81 },
  { date: "2024-05-23", value: 252 },
  { date: "2024-05-24", value: 294 },
  { date: "2024-05-25", value: 201 },
  { date: "2024-05-26", value: 213 },
  { date: "2024-05-27", value: 420 },
  { date: "2024-05-28", value: 233 },
  { date: "2024-05-29", value: 78 },
  { date: "2024-05-30", value: 340 },
  { date: "2024-05-31", value: 178 },
  { date: "2024-06-01", value: 178 },
  { date: "2024-06-02", value: 470 },
  { date: "2024-06-03", value: 103 },
  { date: "2024-06-04", value: 439 },
  { date: "2024-06-05", value: 88 },
  { date: "2024-06-06", value: 294 },
  { date: "2024-06-07", value: 323 },
  { date: "2024-06-08", value: 385 },
  { date: "2024-06-09", value: 438 },
  { date: "2024-06-10", value: 155 },
  { date: "2024-06-11", value: 92 },
  { date: "2024-06-12", value: 492 },
  { date: "2024-06-13", value: 81 },
  { date: "2024-06-14", value: 426 },
  { date: "2024-06-15", value: 307 },
  { date: "2024-06-16", value: 371 },
  { date: "2024-06-17", value: 475 },
  { date: "2024-06-18", value: 107 },
  { date: "2024-06-19", value: 341 },
  { date: "2024-06-20", value: 408 },
  { date: "2024-06-21", value: 169 },
  { date: "2024-06-22", value: 317 },
  { date: "2024-06-23", value: 480 },
  { date: "2024-06-24", value: 132 },
  { date: "2024-06-25", value: 141 },
  { date: "2024-06-26", value: 434 },
  { date: "2024-06-27", value: 448 },
  { date: "2024-06-28", value: 149 },
  { date: "2024-06-29", value: 103 },
  { date: "2024-06-30", value: 446 },
]

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function AreaChartSingle() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Area Chart - Single</CardTitle>
          <CardDescription>
            Shows data for the last 3 months
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select period"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData} accessibilityLayer>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillValue)"
              stroke="var(--color-value)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}