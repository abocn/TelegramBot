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
import { CHART_COLORS } from '../types'

interface UserGrowthChartProps {
  data: Array<{
    timestamp: string
    count: number
    cumulativeCount: number
  }>
  timeFrame: string
}

export default function UserGrowthChart({ data, timeFrame }: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No user growth data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 15, right: 15, left: 25, bottom: 15 }}>
        <defs>
          <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
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
                  <p className="text-xs" style={{ color: CHART_COLORS.primary }}>
                    New Users: {Math.round(Number(payload[0].value))}
                  </p>
                  {payload[1] && (
                    <p className="text-xs" style={{ color: CHART_COLORS.secondary }}>
                      Total: {Math.round(Number(payload[1].value))}
                    </p>
                  )}
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART_COLORS.primary}
          fill="url(#userGrowthGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}