'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Activity,
  TrendingUp,
  Globe
} from 'lucide-react'
import { fillDataPoints, aggregateDataByInterval } from '@/lib/monitoring-utils'
import { TabComponentProps } from '../types'
import UserGrowthChart from '../charts/UserGrowthChart'
import LanguageDistributionChart from '../charts/LanguageDistributionChart'
import { ChartCard } from '../ui/ChartCard'

export default function UsersTab({ stats, timeFrame, statsLoading, liveMode }: TabComponentProps) {
  const processChartData = <T extends Record<string, string | number | boolean | null | undefined>>(
    data: T[],
    aggregationRules?: { [key: string]: 'avg' | 'sum' | 'max' | 'min' | 'last' },
    skipAggregation: boolean = false
  ) => {
    const processedData = skipAggregation ? data : aggregateDataByInterval(data, timeFrame, 'timestamp', aggregationRules)
    return fillDataPoints(processedData, timeFrame, 'timestamp')
  }

  const userCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      description: liveMode ? 'Registered users' : `Users registered in ${timeFrame}`,
      showTimeframe: !liveMode
    },
    {
      title: 'Active Users',
      value: stats?.activeToday?.toLocaleString() || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
      description: liveMode ? 'Active in last 24h' : `Active in last 24h (from ${timeFrame} cohort)`,
      showTimeframe: !liveMode
    },
    {
      title: 'New Users',
      value: stats?.newUsersToday?.toLocaleString() || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-cyan-500/10 to-teal-500/10',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      description: liveMode ? 'Joined in last 24h' : `Joined in last 24h (within ${timeFrame})`,
      showTimeframe: !liveMode
    },
    {
      title: 'Active Sessions',
      value: stats?.sessionStats?.activeSessions || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      description: 'Currently active user sessions',
      showTimeframe: false
    }
  ]

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {userCards.map((card, index) => (
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
                    {card.showTimeframe && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">· {timeFrame}</span>
                    )}
                  </CardTitle>
                  <div className={card.iconColor}>
                    {card.icon}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
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
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <ChartCard
          title="User Growth"
          icon={TrendingUp}
          loading={statsLoading}
          showTimeframe={true}
          timeFrame={timeFrame}
        >
          <div className="h-[250px]">
            <UserGrowthChart
              data={(() => {
                const rawData = stats?.userGrowth || []
                if (rawData.length === 0) return []

                const normalizedData = rawData.map(item => ({
                  timestamp: item.date,
                  count: item.count,
                  cumulativeCount: item.cumulativeCount
                }))

                return processChartData(normalizedData, {
                  count: 'sum',
                  cumulativeCount: 'last'
                }, false)
              })()}
              timeFrame={timeFrame}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Language Distribution"
          icon={() => (
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          )}
          loading={statsLoading}
          showTimeframe={false}
        >
          <div className="h-[250px]">
            <LanguageDistributionChart
              data={stats?.topLanguages || []}
            />
          </div>
        </ChartCard>
      </motion.div>
    </div>
  )
}