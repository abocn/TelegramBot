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

interface ErrorRateChartProps {
  data: Array<{
    date: string
    totalCommands: number
    successfulCommands: number
    failedCommands: number
    avgExecutionTime: number
  }>
  timeFrame: string
}

export default function ErrorRateChart({ data, timeFrame }: ErrorRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No error rate data available
      </div>
    )
  }

  const transformedData = data.map(point => ({
    ...point,
    timestamp: point.date,
    errorRate: point.totalCommands > 0 ? point.failedCommands / point.totalCommands : 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={transformedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(date) => formatAxisLabel(date, timeFrame)}
          stroke="#9ca3af"
          fontSize={12}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          domain={[0, 1]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          width={45}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  <p className="text-sm" style={{ color: CHART_COLORS.error }}>
                    Error Rate: {(Number(payload[0].value) * 100).toFixed(2)}%
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="errorRate"
          stroke={CHART_COLORS.error}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}