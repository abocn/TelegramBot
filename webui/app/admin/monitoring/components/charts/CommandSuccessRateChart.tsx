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
import { CHART_COLORS, CommandPerformanceData } from '../types'

interface CommandSuccessRateChartProps {
  data: CommandPerformanceData[]
  timeFrame: string
}

export default function CommandSuccessRateChart({ data, timeFrame }: CommandSuccessRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No success rate data available
      </div>
    )
  }

  const successRateData = data.map(item => ({
    date: item.date,
    successRate: item.totalCommands > 0
      ? ((item.successfulCommands / item.totalCommands) * 100)
      : 100
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={successRateData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => formatAxisLabel(date, timeFrame)}
          stroke="#9ca3af"
          fontSize={12}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload[0]) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  <p className="text-sm text-primary">
                    Success Rate: {Number(payload[0].value).toFixed(1)}%
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="successRate"
          stroke={CHART_COLORS.success}
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}