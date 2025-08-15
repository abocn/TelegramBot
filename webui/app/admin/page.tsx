'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Users,
  Activity,
  Globe,
  Calendar,
  MessageSquare,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts'

interface UserStats {
  totalUsers: number
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  newUsersToday: number
  newUsersThisWeek: number
  topLanguages: Array<{ language: string; count: number }>
  topCommands: Array<{
    command: string;
    count: number;
    successRate: number;
    avgExecutionTime: number;
  }>
  totalCommands: number
  failedCommands: number
  userGrowth: Array<{ date: string; count: number; cumulativeCount: number }>
  commandUsageOverTime: Array<{
    date: string;
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    avgExecutionTime: number
  }>
  commandSuccessOverTime: Array<{ date: string; successRate: number }>
  sessionStats: {
    activeSessions: number;
    totalSessions: number;
    avgSessionDuration: number;
  }
  aiStats: {
    totalAiUsers: number;
    totalAiRequests: number;
    totalAiCharacters: number;
    avgTemperature: number;
  }
}

type TimeFrame = '7d' | '30d' | '90d' | 'all'

const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#6b7280'
}

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame] = useState<TimeFrame>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

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
  }, [user, timeFrame])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/stats?timeframe=${timeFrame}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getYearHeatmapData = () => {
    if (!stats?.userGrowth) return { data: [], maxValue: 0 }

    const dataMap = new Map()
    stats.userGrowth.forEach(item => {
      dataMap.set(item.date, item.count)
    })

    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    const startOfWeek = new Date(oneYearAgo)
    startOfWeek.setDate(oneYearAgo.getDate() - oneYearAgo.getDay())

    const heatmapData = []
    const currentDate = new Date(startOfWeek)

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      heatmapData.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
        dayOfWeek: currentDate.getDay(),
        isFuture: currentDate > today
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const maxValue = Math.max(...heatmapData.map(d => d.count), 1)
    return { data: heatmapData, maxValue }
  }

  const getHeatmapColor = (value: number, maxValue: number, isFuture: boolean) => {
    if (isFuture) return 'bg-border/30'
    if (value === 0) return 'bg-border/50 dark:bg-border/30'

    const intensity = value / maxValue
    if (intensity <= 0.2) return 'bg-green-100 dark:bg-green-900/60 border-green-200 dark:border-green-800'
    if (intensity <= 0.4) return 'bg-green-200 dark:bg-green-800/70 border-green-300 dark:border-green-700'
    if (intensity <= 0.6) return 'bg-green-300 dark:bg-green-700/80 border-green-400 dark:border-green-600'
    if (intensity <= 0.8) return 'bg-green-400 dark:bg-green-600/90 border-green-500 dark:border-green-500'
    return 'bg-green-500 dark:bg-green-500 border-green-600 dark:border-green-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">{t('adminDashboard.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null
  }

  const statCards = [
    {
      title: t('adminDashboard.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      description: 'All registered users'
    },
    {
      title: t('adminDashboard.activeToday'),
      value: stats?.activeToday || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
      description: 'Active in last 24h'
    },
    {
      title: t('adminDashboard.activeThisWeek'),
      value: stats?.activeThisWeek || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      description: 'Active in last 7 days'
    },
    {
      title: t('adminDashboard.activeThisMonth'),
      value: stats?.activeThisMonth || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-orange-500/10 to-amber-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      description: 'Active in last 30 days'
    },
    {
      title: t('adminDashboard.newUsersToday'),
      value: stats?.newUsersToday || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-cyan-500/10 to-teal-500/10',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      description: 'Joined today'
    },
    {
      title: t('adminDashboard.newUsersThisWeek'),
      value: stats?.newUsersThisWeek || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'from-red-500/10 to-rose-500/10',
      iconColor: 'text-red-600 dark:text-red-400',
      description: 'Joined this week'
    },
    {
      title: t('adminDashboard.activeSessions'),
      value: stats?.sessionStats?.activeSessions || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      description: t('adminDashboard.currentlyActive')
    },
    {
      title: t('adminDashboard.aiEnabledUsers'),
      value: stats?.aiStats?.totalAiUsers || 0,
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'from-indigo-500/10 to-blue-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      description: t('adminDashboard.usingAiFeatures')
    },
    {
      title: t('adminDashboard.totalAiCharacters'),
      value: stats?.aiStats?.totalAiCharacters || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-emerald-500/10 to-green-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      description: t('adminDashboard.charactersProcessedByAi')
    }
  ]

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
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{t('adminDashboard.title')}</h1>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('adminDashboard.refresh')}
            </Button>
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

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full"
            >
              <Card className={`bg-gradient-to-br ${stat.color} border-muted h-full flex flex-col`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={stat.iconColor}>
                      {stat.icon}
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
                      <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle>{t('adminDashboard.userGrowth')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                  <div className="flex justify-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ) : (
                <div>
                  {stats?.userGrowth && stats.userGrowth.length > 0 ? (
                    (() => {
                      const { data: heatmapData, maxValue } = getYearHeatmapData()
                      const weeks = Math.ceil(heatmapData.length / 7)
                      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{t('adminDashboard.less')}</span>
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-sm bg-border/50 dark:bg-border/30 border border-border/20"></div>
                              <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/60 border border-green-200 dark:border-green-800"></div>
                              <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800/70 border border-green-300 dark:border-green-700"></div>
                              <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700/80 border border-green-400 dark:border-green-600"></div>
                              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600/90 border border-green-500 dark:border-green-500"></div>
                              <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500 border border-green-600 dark:border-green-400"></div>
                            </div>
                            <span>{t('adminDashboard.more')}</span>
                          </div>

                          <div className="overflow-x-auto">
                            <div className="inline-block min-w-full">
                              <div className="flex">
                                <div className="flex flex-col mr-2">
                                  <div className="h-4"></div>
                                  {dayLabels.map((day, index) => (
                                    <div key={day} className="h-3 text-xs text-muted-foreground flex items-center mb-1" style={{ fontSize: '10px' }}>
                                      {index % 2 === 1 ? day : ''}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex flex-col">
                                  <div className="flex h-4 mb-1">
                                    {Array.from({ length: weeks }, (_, weekIndex) => {
                                      const weekStart = weekIndex * 7
                                      const date = heatmapData[weekStart]?.date
                                      if (!date) return <div key={weekIndex} className="w-3 mr-1"></div>

                                      const monthDate = new Date(date)
                                      const isFirstWeekOfMonth = monthDate.getDate() <= 7

                                      return (
                                        <div key={weekIndex} className="w-3 mr-1 text-xs text-muted-foreground" style={{ fontSize: '10px' }}>
                                          {isFirstWeekOfMonth ? monthDate.toLocaleDateString('en-US', { month: 'short' }) : ''}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  <div className="flex">
                                    {Array.from({ length: weeks }, (_, weekIndex) => (
                                      <div key={weekIndex} className="flex flex-col mr-1">
                                        {Array.from({ length: 7 }, (_, dayIndex) => {
                                          const dataIndex = weekIndex * 7 + dayIndex
                                          const dayData = heatmapData[dataIndex]

                                          if (!dayData) {
                                            return <div key={dayIndex} className="w-3 h-3 mb-1"></div>
                                          }

                                          const colorClass = getHeatmapColor(dayData.count, maxValue, dayData.isFuture)

                                          return (
                                            <UITooltip key={dayIndex}>
                                              <TooltipTrigger asChild>
                                                <div
                                                  className={`w-3 h-3 rounded-sm mb-1 cursor-pointer hover:ring-1 hover:ring-primary transition-all border ${colorClass}`}
                                                />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>{new Date(dayData.date).toLocaleDateString()}</p>
                                                <p>{dayData.count} new users</p>
                                              </TooltipContent>
                                            </UITooltip>
                                          )
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                            <span>{t('adminDashboard.pastYearTotal')}: {heatmapData.reduce((sum, d) => sum + d.count, 0).toLocaleString()} {t('adminDashboard.newUsers')}</span>
                            <span>{t('adminDashboard.peakDay')}: {maxValue} {t('adminDashboard.users')}</span>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      {t('adminDashboard.noGrowthData')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="h-full"
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle>{t('adminDashboard.topLanguages')}</CardTitle>
                </div>
                <CardDescription>{t('adminDashboard.topLanguagesDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.topLanguages?.slice(0, 5).map((lang, index) => {
                      const percentage = stats.totalUsers > 0 
                        ? ((lang.count / stats.totalUsers) * 100).toFixed(1)
                        : '0'
                      return (
                        <div key={lang.language} className="relative">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="font-medium">{lang.language || t('adminDashboard.notSet')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium">{lang.count}</span>
                              <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                            </div>
                          </div>
                          <div 
                            className="absolute bottom-0 left-0 h-0.5 bg-primary/30 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )
                    }) || (
                      <p className="text-muted-foreground text-center py-8">
                        {t('adminDashboard.noLanguageData')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="h-full"
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle>{t('adminDashboard.topCommands')}</CardTitle>
                </div>
                <CardDescription>{t('adminDashboard.topCommandsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.topCommands?.slice(0, 5).map((cmd, index) => (
                      <div key={cmd.command} className="relative">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <span className="font-mono font-medium">/{cmd.command}</span>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {cmd.successRate?.toFixed(1) || 100}% success
                                </span>
                                {cmd.avgExecutionTime && (
                                  <span className="text-xs text-muted-foreground">
                                    ~{cmd.avgExecutionTime}ms
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{cmd.count}</span>
                            <span className="text-xs text-muted-foreground ml-1">uses</span>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        {t('adminDashboard.noCommandData')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle>{t('adminDashboard.commandUsageOverTime')}</CardTitle>
              </div>
              <CardDescription>{t('adminDashboard.commandUsageOverTimeDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  {stats?.commandUsageOverTime && stats.commandUsageOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.commandUsageOverTime}>
                        <defs>
                          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.error} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.error} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{label ? formatDate(String(label)) : ''}</p>
                                  {payload.map((entry, index) => (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      {entry.name}: {entry.value}
                                    </p>
                                  ))}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                        <Bar dataKey="successfulCommands" stackId="a" fill={CHART_COLORS.success} name={t('adminDashboard.successful')} />
                        <Bar dataKey="failedCommands" stackId="a" fill={CHART_COLORS.error} name={t('adminDashboard.failed')} />
                        <Line
                          type="monotone"
                          dataKey="avgExecutionTime"
                          stroke={CHART_COLORS.warning}
                          strokeWidth={2}
                          name={t('adminDashboard.avgExecutionMs')}
                          yAxisId="right"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      {t('adminDashboard.noCommandUsageData')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.65 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle>{t('adminDashboard.commandSuccessRate')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    {stats?.commandSuccessOverTime && stats.commandSuccessOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.commandSuccessOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            stroke="#9ca3af"
                            fontSize={12}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload[0]) {
                                return (
                                  <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">{label ? formatDate(String(label)) : ''}</p>
                                    <p className="text-sm text-primary">
                                      {t('adminDashboard.successRate')}: {Number(payload[0].value).toFixed(1)}%
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="successRate"
                            stroke={CHART_COLORS.success}
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        {t('adminDashboard.noSuccessRateData')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle>{t('adminDashboard.languageDistribution')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    {stats?.topLanguages && stats.topLanguages.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.topLanguages.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            label={({ language, percent }) => 
                              `${language}: ${((percent || 0) * 100).toFixed(1)}%`
                            }
                          >
                            {stats.topLanguages.slice(0, 6).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload[0]) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">{data.language}</p>
                                    <p className="text-sm text-primary">
                                      Users: {data.count}
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        {t('adminDashboard.noLanguageDistributionData')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.75 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle>{t('adminDashboard.aiUsageStatistics')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
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
                        <p className="text-sm font-medium text-muted-foreground">{t('adminDashboard.aiUsers')}</p>
                        <p className="text-2xl font-bold">{stats?.aiStats?.totalAiUsers || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('adminDashboard.aiRequests')}</p>
                        <p className="text-2xl font-bold">{(stats?.aiStats?.totalAiRequests || 0).toLocaleString()}</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('adminDashboard.aiCharacters')}</p>
                        <p className="text-2xl font-bold">{(stats?.aiStats?.totalAiCharacters || 0).toLocaleString()}</p>
                      </div>
                      <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('adminDashboard.avgTemperature')}</p>
                        <p className="text-2xl font-bold">{(stats?.aiStats?.avgTemperature || 0).toFixed(2)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}