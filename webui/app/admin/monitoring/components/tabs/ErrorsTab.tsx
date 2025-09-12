'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'
import { TabComponentProps, MonitoringCardProps } from '../types'
import ErrorRateChart from '../charts/ErrorRateChart'
import { ChartCard } from '../ui/ChartCard'
import TopErrorCommandsList from '../ui/TopErrorCommandsList'

export default function ErrorsTab({ stats, timeFrame, statsLoading }: TabComponentProps) {
  const errorCards: MonitoringCardProps[] = [
    {
      title: 'Total Errors',
      value: stats?.totalErrors || 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'from-red-500/10 to-rose-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
      showTimeframe: true
    },
    {
      title: 'Unresolved Errors',
      value: stats?.unresolvedErrors || 0,
      icon: <XCircle className="w-5 h-5" />,
      color: 'from-orange-500/10 to-amber-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      showTimeframe: true
    },
    {
      title: 'Error Rate',
      value: `${stats?.errorRate?.toFixed(2) || 0}/hr`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-yellow-500/10 to-orange-500/10',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      showTimeframe: true
    },
    {
      title: 'Avg Resolution Time',
      value: `${stats?.avgResolutionTime?.toFixed(1) || 0}h`,
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      showTimeframe: true
    }
  ]

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {errorCards.map((card, index) => (
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
            title="Top Error Commands"
            description="Commands with highest failure rates"
            icon={AlertCircle}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <TopErrorCommandsList
              data={stats?.topErrorCommands}
              loading={statsLoading}
            />
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <ChartCard
            title="Error Rate Timeline"
            description="Error rate trends from health records"
            icon={TrendingUp}
            loading={statsLoading}
            showTimeframe={true}
            timeFrame={timeFrame}
          >
            <div className="h-[250px]">
              <ErrorRateChart
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