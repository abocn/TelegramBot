'use client'

import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimeRangeSelector, type TimeFrame } from '@/components/ui/time-range-selector'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Shield,
  AlertTriangle,
  Activity,
  RefreshCw,
  Users,
  Cpu,
  Eye,
  MessageSquare
} from 'lucide-react'
import { RefreshIntervalSelector } from './ui/RefreshIntervalSelector'

interface MonitoringLayoutProps {
  timeFrame: TimeFrame
  setTimeFrame: (timeFrame: TimeFrame) => void
  autoRefresh: boolean
  setAutoRefresh: (enabled: boolean) => void
  refreshInterval: string
  setRefreshInterval: (interval: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
  liveMode: boolean
  setLiveMode: (enabled: boolean) => void
  error: string | null
  children: React.ReactNode
}

export default function MonitoringLayout({
  timeFrame,
  setTimeFrame,
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  setRefreshInterval,
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
  liveMode,
  setLiveMode,
  error,
  children
}: MonitoringLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 items-center justify-center flex">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Monitoring</h1>
            </div>
            <div className="flex items-center gap-2">
              <TimeRangeSelector
                value={timeFrame}
                onValueChange={setTimeFrame}
              />

              <div className="flex items-center gap-2 px-3 h-8 border border-input rounded-md bg-transparent shadow-xs">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="h-4 w-7"
                />
                <span className="text-sm">Auto</span>
                {autoRefresh && (
                  <RefreshIntervalSelector
                    value={refreshInterval}
                    onValueChange={setRefreshInterval}
                  />
                )}
              </div>

              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg border border-red-500/20"
          >
            {error}
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="overview" className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="health" className="inline-flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="performance" className="inline-flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="errors" className="inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="users" className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="ai" className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                AI
              </TabsTrigger>
            </TabsList>
            {(activeTab === 'users' || activeTab === 'ai') && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={liveMode}
                  onCheckedChange={setLiveMode}
                  className="h-4 w-7"
                />
                <span className="text-sm">Live</span>
              </div>
            )}
          </div>

          {children}
        </Tabs>
      </div>
    </div>
  )
}