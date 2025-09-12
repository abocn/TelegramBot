'use client'

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { formatAxisLabel, formatTooltipDateRange } from '@/lib/monitoring-utils'
import { CHART_COLORS, CommandVolumeData } from '../types'

interface CommandVolumeChartProps {
  data: CommandVolumeData[]
  timeFrame: string
}

export default function CommandVolumeChart({ data, timeFrame }: CommandVolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No command volume data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="commandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          tickFormatter={(value) => Math.round(value).toString()}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  <p className="text-sm" style={{ color: CHART_COLORS.secondary }}>
                    Commands: {Math.round(Number(payload[0].value))}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type="monotone"
          dataKey="commandsCount"
          stroke={CHART_COLORS.secondary}
          fill="url(#commandGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}