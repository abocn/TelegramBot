'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Database,
  Zap,
  HardDrive,
  Timer,
  Server
} from 'lucide-react'
import { fillDataPoints, aggregateDataByInterval } from '@/lib/monitoring-utils'
import { TabComponentProps, MonitoringCardProps } from '../types'
import MemoryUsageChart from '../charts/MemoryUsageChart'
import ConnectionStatusChart from '../charts/ConnectionStatusChart'
import { ChartCard } from '../ui/ChartCard'

export default function HealthTab({ stats, timeFrame, statsLoading }: TabComponentProps) {
  const processChartData = <T extends Record<string, string | number | boolean | null | undefined>>(
    data: T[],
    aggregationRules?: { [key: string]: 'avg' | 'sum' | 'max' | 'min' | 'last' },
    skipAggregation: boolean = false
  ) => {
    const processedData = skipAggregation ? data : aggregateDataByInterval(data, timeFrame, 'timestamp', aggregationRules)
    return fillDataPoints(processedData, timeFrame, 'timestamp')
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const systemHealthCards: MonitoringCardProps[] = [
    {
      title: 'Database',
      value: stats?.databaseConnected ? 'Connected' : 'Disconnected',
      icon: <Database className="w-5 h-5" />,
      color: stats?.databaseConnected ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10',
      iconColor: stats?.databaseConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      showTimeframe: false
    },
    {
      title: 'Valkey/Redis',
      value: stats?.valkeyConnected ? 'Connected' : 'Disconnected',
      icon: <Zap className="w-5 h-5" />,
      color: stats?.valkeyConnected ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10',
      iconColor: stats?.valkeyConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      showTimeframe: false
    },
    {
      title: 'Memory Usage',
      value: formatBytes(stats?.currentMemoryUsage || 0),
      icon: <HardDrive className="w-5 h-5" />,
      color: 'from-purple-500/10 to-indigo-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      showTimeframe: false
    },
    {
      title: 'Response Time',
      value: `${stats?.avgResponseTime?.toFixed(0) || '0'}ms`,
      icon: <Timer className="w-5 h-5" />,
      color: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      showTimeframe: true
    }
  ]

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {systemHealthCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
          >
            <Card className={`bg-gradient-to-br ${card.color} border-muted h-full flex flex-col`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                    {card.showTimeframe !== false && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">· {timeFrame}</span>
                    )}
                  </CardTitle>
                  <div className={card.iconColor}>
                    {card.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent className={`${card.description ? 'flex-1 flex flex-col justify-between' : '-mb-1'}`}>
                {statsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.description && <p className="text-xs text-muted-foreground mt-1">{card.description}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ChartCard
            title="Memory Usage Trend"
            icon={HardDrive}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <MemoryUsageChart
                data={processChartData(stats?.systemHealthTimeline?.slice().reverse() || [])} 
                timeFrame={timeFrame}
                gradientId="memoryGradient"
              />
            </div>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <ChartCard
            title="Connection Status Timeline"
            icon={Server}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <ConnectionStatusChart
                data={processChartData(stats?.systemHealthTimeline?.slice().reverse() || [])} 
                timeFrame={timeFrame}
              />
            </div>
          </ChartCard>
        </motion.div>
      </div>
    </div>
  )
}