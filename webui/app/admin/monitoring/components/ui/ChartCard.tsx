'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartCardProps } from '../types'
import ChartErrorBoundary from './ChartErrorBoundary'

interface ChartCardWithAnimationProps extends ChartCardProps {
  animationDelay?: number
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  loading = false,
  children,
  showTimeframe = true,
  timeFrame,
  animationDelay = 0
}: ChartCardWithAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {title}
                {showTimeframe && timeFrame && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">· {timeFrame}</span>
                )}
              </CardTitle>
              {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <div className="h-[250px]">
              <ChartErrorBoundary>
                {children}
              </ChartErrorBoundary>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}