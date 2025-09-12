'use client'

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  Legend
} from 'recharts'
import { formatAxisLabel, formatTooltipDateRange } from '@/lib/monitoring-utils'
import { CHART_COLORS } from '../types'

interface ActivityMetricsChartProps {
  data: Array<{
    timestamp: string
    commandsCount: number
  }>
  timeFrame: string
  activeUsers: number
}

export default function ActivityMetricsChart({ data, timeFrame }: ActivityMetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No activity metrics data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
          tickFormatter={(value) => Math.ceil(value).toString()} 
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg">
                  <p className="text-xs font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                      {entry.name}: {Math.round(Number(entry.value))}
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="commandsCount"
          stroke={CHART_COLORS.secondary}
          strokeWidth={2}
          dot={false}
          name="Commands"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}