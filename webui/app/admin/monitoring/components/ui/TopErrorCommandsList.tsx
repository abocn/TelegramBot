'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle } from 'lucide-react'

interface TopErrorCommand {
  commandName: string
  errorCount: number
  failureRate: number
}

interface TopErrorCommandsListProps {
  data: TopErrorCommand[] | undefined
  loading: boolean
}

export default function TopErrorCommandsList({ data, loading }: TopErrorCommandsListProps) {
  if (loading) {
    return <Skeleton className="h-[250px] w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
        <p className="text-lg font-medium">No Errors Found</p>
        <p className="text-sm mt-1">All commands executed successfully</p>
      </div>
    )
  }

  return (
    <div className="h-[250px]">
      <div className="space-y-3 overflow-y-auto h-full">
        {data.slice(0, 5).map((cmd, index) => (
          <div key={cmd.commandName} className="relative">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-mono font-medium">/{cmd.commandName}</span>
                  <div className="flex gap-3 mt-1">
                    <Badge variant="destructive" className="text-xs">
                      {cmd.failureRate.toFixed(1)}% failure
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {cmd.errorCount} errors
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {cmd.errorCount}
                </span>
                <span className="text-xs text-muted-foreground ml-1">failures</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}