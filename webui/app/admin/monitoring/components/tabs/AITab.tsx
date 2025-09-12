'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Users
} from 'lucide-react'
import { TabComponentProps, AICardProps } from '../types'
import AIUsageStats from '../ui/AIUsageStats'

export default function AITab({ stats, timeFrame, statsLoading, liveMode }: TabComponentProps) {
  const aiCards: AICardProps[] = [
    {
      title: 'Total AI Characters',
      value: stats?.aiStats?.totalAiCharacters || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-emerald-500/10 to-green-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'AI Enabled Users',
      value: stats?.aiStats?.totalAiUsers || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-indigo-500/10 to-blue-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    }
  ]

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {aiCards.map((card, index) => (
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
                    {!liveMode && (
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
                    {card.description ? <p className="text-xs text-muted-foreground mt-1">{card.description}</p> : null}
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
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <AIUsageStats
          data={stats?.aiStats}
          loading={statsLoading}
          liveMode={liveMode}
          timeFrame={timeFrame}
        />
      </motion.div>
    </div>
  )
}