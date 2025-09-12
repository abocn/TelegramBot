export interface CommandPerformanceData extends Record<string, string | number | boolean | null | undefined> {
  date: string
  totalCommands: number
  successfulCommands: number
  failedCommands: number
  avgExecutionTime: number
}

export interface CommandVolumeData extends Record<string, string | number | boolean | null | undefined> {
  timestamp: string
  commandsCount: number
}

export interface MonitoringStats {
  // Error Overview
  totalErrors: number
  unresolvedErrors: number
  errorRate: number
  avgResolutionTime: number

  // System Health
  systemUptime: boolean
  databaseConnected: boolean
  valkeyConnected: boolean
  currentMemoryUsage: number
  avgResponseTime: number

  // Performance Metrics
  commandsPerHour: number
  commandSuccessRate: number
  avgCommandExecutionTime: number
  activeUsersInTimeframe?: number

  // Error Analytics
  errorsByType: Array<{ type: string; count: number }>
  errorsBySeverity: Array<{ severity: string; count: number }>
  errorTrend: Array<{ date: string; total: number; resolved: number }>
  telegramErrorsByCode: Array<{ code: number; description: string; count: number }>

  // System Health Timeline
  systemHealthTimeline: Array<{
    timestamp: string
    botUptime: boolean
    databaseConnected: boolean
    valkeyConnected: boolean
    memoryUsageBytes: number
    activeUsers24h: number
    commandsLastHour: number
    errorRate: number
    avgResponseTime: number
  }>

  // Command Performance
  commandPerformance: CommandPerformanceData[]

  // Command Volume
  commandVolume: CommandVolumeData[]

  // Top Error Commands
  topErrorCommands: Array<{
    commandName: string
    errorCount: number
    successCount: number
    failureRate: number
  }>

  // User Stats
  totalUsers?: number
  activeToday?: number
  activeThisWeek?: number
  activeThisMonth?: number
  newUsersToday?: number
  newUsersThisWeek?: number
  userGrowth?: Array<{ date: string; count: number; cumulativeCount: number }>
  topLanguages?: Array<{ language: string; count: number }>
  aiStats?: {
    totalAiUsers: number
    totalAiRequests: number
    totalAiCharacters: number
    avgTemperature: number
  }
  sessionStats?: {
    activeSessions: number
    totalSessions: number
    avgSessionDuration: number
  }
}

export interface RefreshIntervalSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
  iconColor: string
  loading?: boolean
  showTimeframe?: boolean
  timeFrame?: string
}

export interface AICardProps {
  title: string
  value: number
  icon: React.ReactElement
  color: string
  iconColor: string
  description?: string
}

export interface MonitoringCardProps {
  title: string
  value: string | number
  icon: React.ReactElement
  color: string
  iconColor: string
  description?: string
  showTimeframe?: boolean
}

export interface ChartCardProps {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  children: React.ReactNode
  showTimeframe?: boolean
  timeFrame?: string
}

export interface TabComponentProps {
  stats: MonitoringStats | null
  timeFrame: string
  statsLoading: boolean
  liveMode?: boolean
  setLiveMode?: (liveMode: boolean) => void
}

export const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#6b7280'
}

export const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']