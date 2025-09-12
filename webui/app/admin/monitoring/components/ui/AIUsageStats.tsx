'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Activity,
  TrendingUp,
  MessageSquare
} from 'lucide-react'

interface AIStats {
  totalAiUsers: number
  totalAiRequests: number
  totalAiCharacters: number
  avgTemperature: number
}

interface AIUsageStatsProps {
  data: AIStats | undefined
  loading: boolean
  liveMode: boolean | undefined
  timeFrame: string
}

export default function AIUsageStats({ data, loading, liveMode, timeFrame }: AIUsageStatsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              AI Usage Statistics
              {!liveMode && (
                <span className="text-sm font-normal text-muted-foreground ml-2">· {timeFrame}</span>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Users</p>
                  <p className="text-2xl font-bold">{data?.totalAiUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Requests</p>
                  <p className="text-2xl font-bold">{(data?.totalAiRequests || 0).toLocaleString()}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Characters</p>
                  <p className="text-2xl font-bold">{(data?.totalAiCharacters || 0).toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Temperature</p>
                  <p className="text-2xl font-bold">{(data?.avgTemperature || 0).toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}