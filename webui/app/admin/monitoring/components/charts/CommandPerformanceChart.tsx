'use client'

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
  Bar,
  ComposedChart
} from 'recharts'
import { formatAxisLabel, formatTooltipDateRange } from '@/lib/monitoring-utils'
import { CHART_COLORS, CommandPerformanceData } from '../types'

interface CommandPerformanceChartProps {
  data: CommandPerformanceData[]
  timeFrame: string
}

export default function CommandPerformanceChart({ data, timeFrame }: CommandPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No command performance data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => formatAxisLabel(date, timeFrame)}
          stroke="#9ca3af"
          fontSize={12}
        />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {entry.name}: {
                        entry.dataKey === 'avgExecutionTime'
                          ? `${Number(entry.value).toFixed(2)}ms`
                          : Math.round(Number(entry.value))
                      }
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Bar
          dataKey="successfulCommands"
          stackId="a"
          fill={CHART_COLORS.success}
          name="Successful"
        />
        <Bar
          dataKey="failedCommands"
          stackId="a"
          fill={CHART_COLORS.error}
          name="Failed"
        />
        <Line
          type="monotone"
          dataKey="avgExecutionTime"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          name="Avg Execution (ms)"
          yAxisId="right"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}