import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { sql, and, gte, desc, count, avg, sum } from 'drizzle-orm'
import { requireAdmin, createAuthResponse } from '@/lib/auth-middleware'

interface CommandPerformanceData extends Record<string, string | number | boolean | null | undefined> {
  date: string
  totalCommands: number
  successfulCommands: number
  failedCommands: number
  avgExecutionTime: number
}

interface CommandVolumeData extends Record<string, string | number | boolean | null | undefined> {
  timestamp: string
  commandsCount: number
}

interface MonitoringStats {
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    const authResponse = createAuthResponse(authResult)

    if (authResponse) {
      return authResponse
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || '30d'
    const live = searchParams.get('live') === 'true'

    const now = new Date()
    const startDate = new Date()

    const match = timeframe.match(/^(\d+)([hdwmy])$/)
    if (match) {
      const [, num, unit] = match
      const value = parseInt(num)

      switch (unit) {
        case 'h':
          startDate.setHours(now.getHours() - value)
          break
        case 'd':
          startDate.setDate(now.getDate() - value)
          break
        case 'w':
          startDate.setDate(now.getDate() - (value * 7))
          break
        case 'm':
          startDate.setMonth(now.getMonth() - value)
          break
        case 'y':
          startDate.setFullYear(now.getFullYear() - value)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }
    } else if (timeframe === 'all') {
      startDate.setFullYear(2020)
    } else {
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }
    }

    const [totalErrorsResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
      .where(gte(schema.botErrorsTable.createdAt, startDate))
    const [unresolvedErrorsResult] = await db
      .select({ count: count() })
      .from(schema.botErrorsTable)
      .where(and(
        gte(schema.botErrorsTable.createdAt, startDate),
        sql`${schema.botErrorsTable.resolved} = false`
      ))

    const hoursInTimeframe = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60))

    const [commandErrorsResult] = await db
      .select({ count: count() })
      .from(schema.commandUsageTable)
      .where(and(
        gte(schema.commandUsageTable.createdAt, startDate),
        sql`${schema.commandUsageTable.errorMessage} IS NOT NULL`
      ))

    const errorRate = commandErrorsResult.count / hoursInTimeframe
    const resolvedErrors = await db
      .select({
        createdAt: schema.botErrorsTable.createdAt,
        resolvedAt: schema.botErrorsTable.resolvedAt
      })
      .from(schema.botErrorsTable)
      .where(and(
        gte(schema.botErrorsTable.createdAt, startDate),
        sql`${schema.botErrorsTable.resolved} = true AND ${schema.botErrorsTable.resolvedAt} IS NOT NULL`
      ))
    const avgResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, error) => {
          if (error.resolvedAt && error.createdAt) {
            return sum + (error.resolvedAt.getTime() - error.createdAt.getTime())
          }
          return sum
        }, 0) / resolvedErrors.length / (1000 * 60 * 60)
      : 0

    // eslint-disable-next-line prefer-const
    let systemHealth = {
      botUptime: false,
      databaseConnected: false,
      valkeyConnected: false,
      memoryUsageBytes: 0,
      avgResponseTime: 0
    }

    let metricsAvailable = false

    try {
      const metricsResponse = await fetch('http://localhost:3030/metrics')
      if (metricsResponse.ok) {
        const metricsText = await metricsResponse.text()
        metricsAvailable = true

        const lines = metricsText.split('\n')
        for (const line of lines) {
          if (line.startsWith('telegram_bot_up')) {
            const value = line.split(' ').pop()
            systemHealth.botUptime = value === '1'
          }
          if (line.startsWith('database_connection_status')) {
            const value = line.split(' ').pop()
            systemHealth.databaseConnected = value === '1'
          }
          if (line.startsWith('valkey_connection_status')) {
            const value = line.split(' ').pop()
            systemHealth.valkeyConnected = value === '1'
          }
          if (line.startsWith('bot_memory_usage_bytes{type="rss"}')) {
            const match = line.match(/(\d+)$/)
            if (match) {
              systemHealth.memoryUsageBytes = parseInt(match[1])
            }
          }
        }
      }
    } catch {
      console.warn('[!] Metrics endpoint not available, using database fallback')
    }

    if (!metricsAvailable) {
      const latestHealthRecord = await db
        .select()
        .from(schema.systemHealthTable)
        .orderBy(desc(schema.systemHealthTable.timestamp))
        .limit(1)

      if (latestHealthRecord.length > 0) {
        const health = latestHealthRecord[0]
        systemHealth.botUptime = health.botUptime
        systemHealth.databaseConnected = health.databaseConnected
        systemHealth.valkeyConnected = health.valkeyConnected
        systemHealth.memoryUsageBytes = health.memoryUsageBytes || 0
        systemHealth.avgResponseTime = health.avgResponseTime || 0
      }
    } else {
      const latestHealthRecord = await db
        .select({ avgResponseTime: schema.systemHealthTable.avgResponseTime })
        .from(schema.systemHealthTable)
        .orderBy(desc(schema.systemHealthTable.timestamp))
        .limit(1)

      if (latestHealthRecord.length > 0 && latestHealthRecord[0].avgResponseTime) {
        systemHealth.avgResponseTime = latestHealthRecord[0].avgResponseTime
      }
    }
    const [commandStatsResult] = await db
      .select({
        totalCommands: count(),
        successfulCommands: sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = true THEN 1 ELSE 0 END`),
        avgExecutionTime: avg(schema.commandUsageTable.executionTime)
      })
      .from(schema.commandUsageTable)
      .where(gte(schema.commandUsageTable.createdAt, startDate))
    const commandSuccessRate = commandStatsResult.totalCommands > 0
      ? (Number(commandStatsResult.successfulCommands) / commandStatsResult.totalCommands) * 100
      : 100
    const commandsPerHour = commandStatsResult.totalCommands / hoursInTimeframe
    const errorsByType = await db
      .select({
        type: schema.botErrorsTable.errorType,
        count: count()
      })
      .from(schema.botErrorsTable)
      .where(gte(schema.botErrorsTable.createdAt, startDate))
      .groupBy(schema.botErrorsTable.errorType)
      .orderBy(desc(count()))
      .limit(10)
    const errorsBySeverity = await db
      .select({
        severity: schema.botErrorsTable.severity,
        count: count()
      })
      .from(schema.botErrorsTable)
      .where(gte(schema.botErrorsTable.createdAt, startDate))
      .groupBy(schema.botErrorsTable.severity)
    const telegramErrorsByCode = await db
      .select({
        code: schema.telegramErrorsTable.errorCode,
        description: schema.telegramErrorsTable.errorDescription,
        count: count()
      })
      .from(schema.telegramErrorsTable)
      .where(gte(schema.telegramErrorsTable.createdAt, startDate))
      .groupBy(schema.telegramErrorsTable.errorCode, schema.telegramErrorsTable.errorDescription)
      .orderBy(desc(count()))
      .limit(10)
    const errorTrend = await db
      .select({
        date: sql<string>`DATE(${schema.botErrorsTable.createdAt})`,
        total: count(),
        resolved: sum(sql`CASE WHEN ${schema.botErrorsTable.resolved} = true THEN 1 ELSE 0 END`)
      })
      .from(schema.botErrorsTable)
      .where(gte(schema.botErrorsTable.createdAt, startDate))
      .groupBy(sql`DATE(${schema.botErrorsTable.createdAt})`)
      .orderBy(sql`DATE(${schema.botErrorsTable.createdAt})`)

    let systemHealthTimeline = await db
      .select()
      .from(schema.systemHealthTable)
      .where(gte(schema.systemHealthTable.timestamp, startDate))
      .orderBy(desc(schema.systemHealthTable.timestamp))
      .limit(100)

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const [recentCommandsCheck] = await db
      .select({ count: count() })
      .from(schema.commandUsageTable)
      .where(gte(schema.commandUsageTable.createdAt, oneHourAgo))

    const mostRecentHealth = systemHealthTimeline[0]
    const needsSyntheticRecord = recentCommandsCheck.count > 0 && 
      (!mostRecentHealth || mostRecentHealth.timestamp < oneHourAgo)

    if (needsSyntheticRecord) {
      const [successfulCmds] = await db
        .select({ count: count() })
        .from(schema.commandUsageTable)
        .where(and(
          gte(schema.commandUsageTable.createdAt, oneHourAgo),
          sql`${schema.commandUsageTable.isSuccess} = true`
        ))

      const currentErrorRate = recentCommandsCheck.count > 0 
        ? (recentCommandsCheck.count - successfulCmds.count) / recentCommandsCheck.count
        : 0

      const syntheticRecord = {
        id: 'synthetic-current',
        timestamp: new Date(),
        botUptime: systemHealth.botUptime,
        databaseConnected: systemHealth.databaseConnected,
        valkeyConnected: systemHealth.valkeyConnected,
        memoryUsageBytes: systemHealth.memoryUsageBytes,
        activeUsers24h: 0,
        commandsLastHour: recentCommandsCheck.count,
        errorRate: currentErrorRate,
        avgResponseTime: systemHealth.avgResponseTime
      }

      systemHealthTimeline = [syntheticRecord, ...systemHealthTimeline]
    }

    const errorRateByTimestamp = new Map<string, number>()

    if (systemHealthTimeline.length > 0) {
      const commandDataForErrorRate = await db
        .select({
          createdAt: schema.commandUsageTable.createdAt,
          isError: sql<boolean>`${schema.commandUsageTable.errorMessage} IS NOT NULL`
        })
        .from(schema.commandUsageTable)
        .where(gte(schema.commandUsageTable.createdAt, startDate))
        .orderBy(schema.commandUsageTable.createdAt)

      for (const health of systemHealthTimeline) {
        const timestamp = health.timestamp.getTime()
        const hourBefore = timestamp - (60 * 60 * 1000)

        const relevantCommands = commandDataForErrorRate.filter(cmd => {
          const cmdTime = cmd.createdAt.getTime()
          return cmdTime >= hourBefore && cmdTime <= timestamp
        })

        const totalCommands = relevantCommands.length
        const errorCommands = relevantCommands.filter(cmd => cmd.isError).length

        const errorRate = totalCommands > 0 ? errorCommands / totalCommands : 0
        errorRateByTimestamp.set(health.timestamp.toISOString(), errorRate)
      }
    }

    let groupByExpression: ReturnType<typeof sql>
    let timestampExpression: ReturnType<typeof sql<string>>

    const timeframeMatch = timeframe.match(/^(\d+)([hdwmy])$/)
    const value: number = timeframeMatch ? parseInt(timeframeMatch[1]) : 30
    const unit: string = timeframeMatch ? timeframeMatch[2] : 'd'

    if (unit === 'h') {
      if (value <= 3) {
        groupByExpression = sql`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt}) + INTERVAL '15 minute' * FLOOR(EXTRACT(minute FROM ${schema.commandUsageTable.createdAt})::integer / 15)`
        timestampExpression = sql<string>`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt}) + INTERVAL '15 minute' * FLOOR(EXTRACT(minute FROM ${schema.commandUsageTable.createdAt})::integer / 15)`
      } else {
        groupByExpression = sql`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt})`
      }
    } else if (unit === 'd') {
      if (value === 1) {
        groupByExpression = sql`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt})`
      } else if (value <= 7) {
        groupByExpression = sql`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt}) - INTERVAL '1 hour' * (EXTRACT(hour FROM ${schema.commandUsageTable.createdAt})::integer % 4)`
        timestampExpression = sql<string>`DATE_TRUNC('hour', ${schema.commandUsageTable.createdAt}) - INTERVAL '1 hour' * (EXTRACT(hour FROM ${schema.commandUsageTable.createdAt})::integer % 4)`
      } else {
        groupByExpression = sql`DATE(${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE(${schema.commandUsageTable.createdAt})`
      }
    } else if (unit === 'w') {
      groupByExpression = sql`DATE(${schema.commandUsageTable.createdAt})`
      timestampExpression = sql<string>`DATE(${schema.commandUsageTable.createdAt})`
    } else if (unit === 'm') {
      if (value <= 3) {
        groupByExpression = sql`DATE(${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE(${schema.commandUsageTable.createdAt})`
      } else if (value <= 12) {
        groupByExpression = sql`DATE_TRUNC('week', ${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE_TRUNC('week', ${schema.commandUsageTable.createdAt})`
      } else {
        groupByExpression = sql`DATE_TRUNC('month', ${schema.commandUsageTable.createdAt})`
        timestampExpression = sql<string>`DATE_TRUNC('month', ${schema.commandUsageTable.createdAt})`
      }
    } else if (unit === 'y') {
      groupByExpression = sql`DATE_TRUNC('month', ${schema.commandUsageTable.createdAt})`
      timestampExpression = sql<string>`DATE_TRUNC('month', ${schema.commandUsageTable.createdAt})`
    } else {
      groupByExpression = sql`DATE(${schema.commandUsageTable.createdAt})`
      timestampExpression = sql<string>`DATE(${schema.commandUsageTable.createdAt})`
    }

    const commandPerformance = await db
      .select({
        date: timestampExpression,
        totalCommands: count(),
        successfulCommands: sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = true THEN 1 ELSE 0 END`),
        failedCommands: sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = false THEN 1 ELSE 0 END`),
        avgExecutionTime: avg(schema.commandUsageTable.executionTime)
      })
      .from(schema.commandUsageTable)
      .where(gte(schema.commandUsageTable.createdAt, startDate))
      .groupBy(groupByExpression)
      .orderBy(groupByExpression)

    const topErrorCommands = await db
      .select({
        commandName: schema.commandUsageTable.commandName,
        totalCommands: count(),
        errorCount: sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = false THEN 1 ELSE 0 END`),
        successCount: sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = true THEN 1 ELSE 0 END`)
      })
      .from(schema.commandUsageTable)
      .where(gte(schema.commandUsageTable.createdAt, startDate))
      .groupBy(schema.commandUsageTable.commandName)
      .having(sql`SUM(CASE WHEN ${schema.commandUsageTable.isSuccess} = false THEN 1 ELSE 0 END) > 0`)
      .orderBy(desc(sum(sql`CASE WHEN ${schema.commandUsageTable.isSuccess} = false THEN 1 ELSE 0 END`)))
      .limit(10)

    const topErrorCommandsFormatted = topErrorCommands
      .filter(cmd => Number(cmd.errorCount) > 0)
      .map(cmd => ({
        commandName: cmd.commandName,
        errorCount: Number(cmd.errorCount),
        successCount: Number(cmd.successCount),
        failureRate: Number(cmd.errorCount) > 0
          ? (Number(cmd.errorCount) / Number(cmd.totalCommands)) * 100
          : 0
      }))

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(gte(schema.usersTable.updatedAt, startDate))

    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? sql`1=1`
        : gte(schema.usersTable.createdAt, startDate)
      )

    const today = new Date()
    today.setHours(today.getHours() - 24)
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    const thisMonth = new Date()
    thisMonth.setDate(thisMonth.getDate() - 30)

    const [activeTodayResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? gte(schema.usersTable.updatedAt, today) // Live: just active today
        : and(
            gte(schema.usersTable.updatedAt, today),
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const [activeThisWeekResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? gte(schema.usersTable.updatedAt, thisWeek) // Live: just active this week
        : and(
            gte(schema.usersTable.updatedAt, thisWeek),
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const [activeThisMonthResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? gte(schema.usersTable.updatedAt, thisMonth) // Live: just active this month
        : and(
            gte(schema.usersTable.updatedAt, thisMonth),
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const [newUsersTodayResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? gte(schema.usersTable.createdAt, today) // Live: just new today
        : and(
            gte(schema.usersTable.createdAt, today),
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const [newUsersThisWeekResult] = await db
      .select({ count: count() })
      .from(schema.usersTable)
      .where(live
        ? gte(schema.usersTable.createdAt, thisWeek) // Live: just new this week
        : and(
            gte(schema.usersTable.createdAt, thisWeek),
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const userGrowth = await db
      .select({
        date: sql<string>`DATE(${schema.usersTable.createdAt})`,
        count: count()
      })
      .from(schema.usersTable)
      .where(gte(schema.usersTable.createdAt, startDate))
      .groupBy(sql`DATE(${schema.usersTable.createdAt})`)
      .orderBy(sql`DATE(${schema.usersTable.createdAt})`)

    let cumulativeCount = 0
    const userGrowthWithCumulative = userGrowth.map(day => {
      cumulativeCount += day.count
      return {
        date: day.date,
        count: day.count,
        cumulativeCount
      }
    })

    const topLanguages = await db
      .select({
        language: schema.usersTable.languageCode,
        count: count()
      })
      .from(schema.usersTable)
      .groupBy(schema.usersTable.languageCode)
      .orderBy(desc(count()))
      .limit(10)

    const [aiStatsResult] = await db
      .select({
        totalAiUsers: count(),
        totalAiRequests: sum(schema.usersTable.aiRequests),
        totalAiCharacters: sum(schema.usersTable.aiCharacters),
        avgTemperature: avg(schema.usersTable.aiTemperature)
      })
      .from(schema.usersTable)
      .where(live
        ? sql`${schema.usersTable.aiRequests} > 0`
        : and(
            sql`${schema.usersTable.aiRequests} > 0`,
            gte(schema.usersTable.createdAt, startDate)
          )
      )

    const [sessionStatsResult] = await db
      .select({
        activeSessions: sql<number>`count(*) filter (where ${schema.sessionsTable.expiresAt} > now())::int`,
        totalSessions: sql<number>`count(*)::int`,
        avgSessionDuration: sql<number>`avg(extract(epoch from (${schema.sessionsTable.expiresAt} - ${schema.sessionsTable.createdAt})) / 3600)::int`
      })
      .from(schema.sessionsTable)
      .where(live
        ? sql`1=1`
        : gte(schema.sessionsTable.createdAt, startDate)
      )

    const stats: MonitoringStats = {
      // Error Overview
      totalErrors: totalErrorsResult.count,
      unresolvedErrors: unresolvedErrorsResult.count,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,

      // System Health
      systemUptime: systemHealth.botUptime,
      databaseConnected: systemHealth.databaseConnected,
      valkeyConnected: systemHealth.valkeyConnected,
      currentMemoryUsage: systemHealth.memoryUsageBytes,
      avgResponseTime: systemHealth.avgResponseTime,

      // Performance Metrics
      commandsPerHour: Math.round(commandsPerHour * 100) / 100,
      commandSuccessRate: Math.round(commandSuccessRate * 100) / 100,
      avgCommandExecutionTime: Math.round((Number(commandStatsResult.avgExecutionTime) || 0) * 100) / 100,
      activeUsersInTimeframe: activeUsersResult.count,

      // Error Analytics
      errorsByType: errorsByType.map(e => ({ type: e.type, count: e.count })),
      errorsBySeverity: errorsBySeverity.map(e => ({ severity: e.severity, count: e.count })),
      errorTrend: errorTrend.map(e => ({
        date: e.date,
        total: e.total,
        resolved: Number(e.resolved)
      })),
      telegramErrorsByCode: telegramErrorsByCode.map(e => ({
        code: e.code || 0,
        description: e.description,
        count: e.count
      })),

      // System Health Timeline
      systemHealthTimeline: systemHealthTimeline.map(h => ({
        timestamp: h.timestamp.toISOString(),
        botUptime: h.botUptime,
        databaseConnected: h.databaseConnected,
        valkeyConnected: h.valkeyConnected,
        memoryUsageBytes: h.memoryUsageBytes || 0,
        activeUsers24h: h.activeUsers24h || 0,
        commandsLastHour: h.commandsLastHour || 0,
        errorRate: errorRateByTimestamp.get(h.timestamp.toISOString()) || h.errorRate || 0,
        avgResponseTime: h.avgResponseTime || 0
      })),

      // Command Performance
      commandPerformance: commandPerformance.map((c): CommandPerformanceData => ({
        date: c.date,
        totalCommands: c.totalCommands,
        successfulCommands: Number(c.successfulCommands),
        failedCommands: Number(c.failedCommands),
        avgExecutionTime: Math.round((Number(c.avgExecutionTime) || 0) * 100) / 100
      })),

      commandVolume: await (async (): Promise<CommandVolumeData[]> => {
        const volumeData = await db
          .select({
            timestamp: timestampExpression,
            commandCount: count()
          })
          .from(schema.commandUsageTable)
          .where(gte(schema.commandUsageTable.createdAt, startDate))
          .groupBy(groupByExpression)
          .orderBy(groupByExpression)

        return volumeData.map((v): CommandVolumeData => ({
          timestamp: v.timestamp,
          commandsCount: v.commandCount
        }))
      })(),

      // Top Error Commands
      topErrorCommands: topErrorCommandsFormatted,

      // User Stats
      totalUsers: totalUsersResult.count,
      activeToday: activeTodayResult.count,
      activeThisWeek: activeThisWeekResult.count,
      activeThisMonth: activeThisMonthResult.count,
      newUsersToday: newUsersTodayResult.count,
      newUsersThisWeek: newUsersThisWeekResult.count,
      userGrowth: userGrowthWithCumulative,
      topLanguages: topLanguages.map(lang => ({
        language: lang.language || 'Not Set',
        count: lang.count
      })),
      aiStats: aiStatsResult ? {
        totalAiUsers: aiStatsResult.totalAiUsers,
        totalAiRequests: Number(aiStatsResult.totalAiRequests) || 0,
        totalAiCharacters: Number(aiStatsResult.totalAiCharacters) || 0,
        avgTemperature: Number(aiStatsResult.avgTemperature) || 0
      } : undefined,
      sessionStats: sessionStatsResult ? {
        activeSessions: sessionStatsResult.activeSessions || 0,
        totalSessions: sessionStatsResult.totalSessions || 0,
        avgSessionDuration: sessionStatsResult.avgSessionDuration || 0
      } : undefined
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[!] Error fetching monitoring stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring statistics' },
      { status: 500 }
    )
  }
}
