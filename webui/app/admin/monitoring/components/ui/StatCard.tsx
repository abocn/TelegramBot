'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCardProps } from '../types'

interface StatCardWithAnimationProps extends StatCardProps {
  animationDelay?: number
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  iconColor,
  loading = false,
  showTimeframe = true,
  timeFrame,
  animationDelay = 0
}: StatCardWithAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className="h-full"
    >
      <Card className={`bg-gradient-to-br ${color} border-muted h-full flex flex-col`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
              {showTimeframe && timeFrame && (
                <span className="text-xs font-normal text-muted-foreground ml-1">· {timeFrame}</span>
              )}
            </CardTitle>
            <div className={iconColor}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}