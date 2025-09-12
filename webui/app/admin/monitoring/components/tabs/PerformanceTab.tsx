'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Activity,
  TrendingUp
} from 'lucide-react'
import { fillDataPoints, aggregateDataByInterval } from '@/lib/monitoring-utils'
import { TabComponentProps } from '../types'
import CommandPerformanceChart from '../charts/CommandPerformanceChart'
import CommandVolumeChart from '../charts/CommandVolumeChart'
import CommandSuccessRateChart from '../charts/CommandSuccessRateChart'
import { ChartCard } from '../ui/ChartCard'

export default function PerformanceTab({ stats, timeFrame, statsLoading }: TabComponentProps) {
  const processChartData = <T extends Record<string, string | number | boolean | null | undefined>>(
    data: T[],
    aggregationRules?: { [key: string]: 'avg' | 'sum' | 'max' | 'min' | 'last' },
    skipAggregation: boolean = false
  ) => {
    const processedData = skipAggregation ? data : aggregateDataByInterval(data, timeFrame, 'timestamp', aggregationRules)
    return fillDataPoints(processedData, timeFrame, 'timestamp')
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ChartCard
          title="Command Performance Over Time"
          description="Command execution and success rates over time"
          icon={BarChart3}
          loading={statsLoading}
          showTimeframe={true}
          timeFrame={timeFrame}
        >
          <CommandPerformanceChart
            data={(() => {
              const rawData = stats?.commandPerformance || []
              if (rawData.length === 0) return []

              const normalizedData = rawData.map(item => ({
                ...item,
                timestamp: item.date
              }))
              return processChartData(normalizedData, {
                totalCommands: 'sum',
                successfulCommands: 'sum',
                failedCommands: 'sum',
                avgExecutionTime: 'avg'
              }, true).map(item => ({
                ...item,
                date: item.timestamp
              }))
            })()}
            timeFrame={timeFrame}
          />
        </ChartCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ChartCard
          title="Command Volume Trend"
          icon={Activity}
          loading={statsLoading}
          showTimeframe={true}
          timeFrame={timeFrame}
        >
          <CommandVolumeChart
            data={(() => {
              const rawData = stats?.commandVolume || []
              if (rawData.length === 0) return []

              return processChartData(rawData, {
                commandsCount: 'sum'
              }, true)
            })()}
            timeFrame={timeFrame}
          />
        </ChartCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <ChartCard
          title="Command Success Rate"
          icon={TrendingUp}
          loading={statsLoading}
          showTimeframe={true}
          timeFrame={timeFrame}
        >
          <CommandSuccessRateChart
            data={(() => {
              const rawData = stats?.commandPerformance || []
              if (rawData.length === 0) return []

              const normalizedData = rawData.map(item => ({
                ...item,
                timestamp: item.date
              }))

              return processChartData(normalizedData, {
                totalCommands: 'sum',
                successfulCommands: 'sum',
                failedCommands: 'sum'
              }, false).map(item => ({
                ...item,
                date: item.timestamp
              }))
            })()}
            timeFrame={timeFrame}
          />
        </ChartCard>
      </motion.div>
    </div>
  )
}