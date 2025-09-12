'use client'

import { useState, useEffect } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { type TimeFrame } from '@/components/ui/time-range-selector'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { MonitoringStats } from './components/types'
import OverviewTab from './components/tabs/OverviewTab'
import HealthTab from './components/tabs/HealthTab'
import PerformanceTab from './components/tabs/PerformanceTab'
import ErrorsTab from './components/tabs/ErrorsTab'
import UsersTab from './components/tabs/UsersTab'
import AITab from './components/tabs/AITab'
import MonitoringLayout from './components/MonitoringLayout'

export default function MonitoringDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [liveMode, setLiveMode] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/account')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, timeFrame, liveMode])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats()
    }, parseInt(refreshInterval) * 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/monitoring?timeframe=${timeFrame}&live=${liveMode}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setStatsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats()
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null
  }





  return (
    <MonitoringLayout
      timeFrame={timeFrame}
      setTimeFrame={setTimeFrame}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      refreshInterval={refreshInterval}
      setRefreshInterval={setRefreshInterval}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing || statsLoading}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      liveMode={liveMode}
      setLiveMode={setLiveMode}
      error={error}
    >
      <TabsContent value="overview">
        <OverviewTab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} />
      </TabsContent>

      <TabsContent value="health">
        <HealthTab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} />
      </TabsContent>

      <TabsContent value="performance">
        <PerformanceTab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} />
      </TabsContent>

      <TabsContent value="errors">
        <ErrorsTab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} liveMode={liveMode} />
      </TabsContent>

      <TabsContent value="ai">
        <AITab stats={stats} timeFrame={timeFrame} statsLoading={statsLoading} liveMode={liveMode} />
      </TabsContent>
    </MonitoringLayout>
  )
}
