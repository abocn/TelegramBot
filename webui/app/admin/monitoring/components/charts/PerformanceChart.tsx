'use client'

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart
} from 'recharts'
import { formatAxisLabel, formatTooltipDateRange } from '@/lib/monitoring-utils'
import { CHART_COLORS } from '../types'

interface PerformanceChartProps {
  data: Array<{
    date: string
    avgExecutionTime: number
    totalCommands: number
    successfulCommands: number
    failedCommands: number
  }>
  timeFrame: string
}

export default function PerformanceChart({ data, timeFrame }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No performance data available
      </div>
    )
  }

  const transformedData = data.map(point => ({
    ...point,
    timestamp: point.date
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={transformedData} margin={{ top: 15, right: 15, left: 25, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(date) => formatAxisLabel(date, timeFrame)}
          stroke="#9ca3af"
          fontSize={11}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={11}
          width={30}
          tickFormatter={(value) => `${Math.ceil(value)}ms`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg">
                  <p className="text-xs font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                      {entry.name}: {Math.round(Number(entry.value))}ms
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="avgExecutionTime"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          dot={false}
          name="Execution Time (ms)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}