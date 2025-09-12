'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'
import { PIE_COLORS } from '../types'

interface LanguageDistributionChartProps {
  data: Array<{
    language: string
    count: number
  }>
}

export default function LanguageDistributionChart({ data }: LanguageDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No language distribution data available
      </div>
    )
  }

  const chartData = data.slice(0, 6)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="count"
          label={({ value, index }) => {
            const item = chartData[index || 0]
            const total = chartData.reduce((sum, item) => sum + item.count, 0)
            const percent = total > 0 && value ? (((value as number) / total) * 100).toFixed(1) : '0'
            return `${item?.language || ''}: ${percent}%`
          }}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{data.language}</p>
                  <p className="text-sm text-primary">
                    Users: {data.count}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}