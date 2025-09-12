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

interface ConnectionStatusChartProps {
  data: Array<{
    timestamp: string
    botUptime: boolean
    databaseConnected: boolean
    valkeyConnected: boolean
  }>
  timeFrame: string
}

export default function ConnectionStatusChart({ data, timeFrame }: ConnectionStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No connection status data available
      </div>
    )
  }

  const connectionData = data.map(record => ({
    timestamp: record.timestamp,
    botUptime: record.botUptime ? 1 : 0,
    databaseConnected: record.databaseConnected ? 1 : 0,
    valkeyConnected: record.valkeyConnected ? 1 : 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={connectionData}>
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
          ticks={[0, 1]}
          tickFormatter={(value) => value === 1 ? 'ON' : 'OFF'}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label ? formatTooltipDateRange(payload, String(label), timeFrame) : ''}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {entry.name}: {entry.value === 1 ? 'Connected' : 'Disconnected'}
                    </p>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="botUptime"
          stroke={CHART_COLORS.success}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
          name="Bot"
        />
        <Line
          type="monotone"
          dataKey="databaseConnected"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
          name="Database"
        />
        <Line
          type="monotone"
          dataKey="valkeyConnected"
          stroke={CHART_COLORS.secondary}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
          name="Valkey"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}