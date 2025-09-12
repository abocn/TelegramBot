'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  TrendingUp,
  HardDrive,
  Timer
} from 'lucide-react'
import { fillDataPoints, aggregateDataByInterval, parseTimeframe } from '@/lib/monitoring-utils'
import { TabComponentProps, MonitoringCardProps } from '../types'
import MemoryUsageChart from '../charts/MemoryUsageChart'
import ActivityMetricsChart from '../charts/ActivityMetricsChart'
import PerformanceChart from '../charts/PerformanceChart'
import { ChartCard } from '../ui/ChartCard'

export default function OverviewTab({ stats, timeFrame, statsLoading }: TabComponentProps) {
  const processChartData = <T extends Record<string, string | number | boolean | null | undefined>>(
    data: T[],
    aggregationRules?: { [key: string]: 'avg' | 'sum' | 'max' | 'min' | 'last' },
    skipAggregation: boolean = false,
    defaultValues: Partial<T> = {}
  ) => {
    const processedData = skipAggregation ? data : aggregateDataByInterval(data, timeFrame, 'timestamp', aggregationRules)
    return fillDataPoints(processedData, timeFrame, 'timestamp', defaultValues)
  }

  const overviewCards: MonitoringCardProps[] = [
    {
      title: 'Bot Status',
      value: stats?.systemUptime ? 'Online' : 'Offline',
      icon: stats?.systemUptime ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />,
      color: stats?.systemUptime ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10',
      iconColor: stats?.systemUptime ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      showTimeframe: false
    },
    {
      title: 'Active Users',
      value: stats?.activeUsersInTimeframe || stats?.systemHealthTimeline?.[0]?.activeUsers24h || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      showTimeframe: true
    },
    {
      title: 'Commands Rate',
      value: (() => {
        const { unit } = parseTimeframe(timeFrame)
        const rate = stats?.commandsPerHour || 0
        if (unit === 'h') return `${rate.toFixed(1)}/hr`
        if (unit === 'd') return `${(rate * 24).toFixed(0)}/day`
        return `${rate.toFixed(1)}/hr`
      })(),
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'from-cyan-500/10 to-teal-500/10',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      showTimeframe: true
    },
    {
      title: 'Success Rate',
      value: `${stats?.commandSuccessRate?.toFixed(1) || '100'}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-500/10 to-green-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      showTimeframe: true
    }
  ]

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card, index) => (
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
                    <div className="text-2xl font-bold">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </div>
                    {card.description && <p className="text-xs text-muted-foreground mt-1">{card.description}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ChartCard
            title="Memory Usage"
            icon={HardDrive}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <MemoryUsageChart
                data={processChartData(stats?.systemHealthTimeline?.slice().reverse() || [])} 
                timeFrame={timeFrame}
                gradientId="memoryGradientOverview"
              />
            </div>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <ChartCard
            title="Activity Metrics"
            icon={() => (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
            )}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <ActivityMetricsChart
                data={stats?.commandVolume || []}
                timeFrame={timeFrame}
                activeUsers={stats?.activeUsersInTimeframe || 0}
              />
            </div>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <ChartCard
            title="Performance"
            icon={() => (
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <PerformanceChart
                data={stats?.commandPerformance || []}
                timeFrame={timeFrame}
              />
            </div>
          </ChartCard>
        </motion.div>
      </div>
    </div>
  )
}