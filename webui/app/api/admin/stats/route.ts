import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const sessionToken = bearerToken || cookieToken;

    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const sessionData = await validateSession(sessionToken);

    if (!sessionData || !sessionData.user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    if (!sessionData.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30d';

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let growthStartDate: Date;
    switch (timeframe) {
      case '7d':
        growthStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        growthStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        growthStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        growthStartDate = new Date(0);
        break;
      default:
        growthStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsersResult,
      activeTodayResult,
      activeThisWeekResult,
      activeThisMonthResult,
      newUsersTodayResult,
      newUsersThisWeekResult,
      topLanguagesResult,
      topCommandsResult,
      totalCommandsResult,
      failedCommandsResult,
      commandUsageOverTimeResult,
      commandSuccessOverTimeResult,
      sessionStatsResult,
      aiUsageStatsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable)
        .where(sql`${schema.usersTable.updatedAt} >= ${todayStart}`),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable)
        .where(sql`${schema.usersTable.updatedAt} >= ${weekStart}`),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable)
        .where(sql`${schema.usersTable.updatedAt} >= ${monthStart}`),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable)
        .where(sql`${schema.usersTable.createdAt} >= ${todayStart}`),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.usersTable)
        .where(sql`${schema.usersTable.createdAt} >= ${weekStart}`),
      db.select({
        language: schema.usersTable.languageCode,
        count: sql<number>`count(*)::int`
      })
        .from(schema.usersTable)
        .groupBy(schema.usersTable.languageCode)
        .orderBy(sql`count(*) desc`)
        .limit(10),
      db.select({
        commandName: schema.commandUsageTable.commandName,
        count: sql<number>`count(*)::int`,
        successRate: sql<number>`(count(*) filter (where ${schema.commandUsageTable.isSuccess} = true) * 100.0 / count(*))::numeric(5,2)`,
        avgExecutionTime: sql<number>`avg(${schema.commandUsageTable.executionTime})::int`
      })
        .from(schema.commandUsageTable)
        .where(sql`${schema.commandUsageTable.createdAt} >= ${monthStart}`)
        .groupBy(schema.commandUsageTable.commandName)
        .orderBy(sql`count(*) desc`)
        .limit(10),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.commandUsageTable)
        .where(sql`${schema.commandUsageTable.createdAt} >= ${monthStart}`),
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.commandUsageTable)
        .where(sql`${schema.commandUsageTable.createdAt} >= ${monthStart} AND ${schema.commandUsageTable.isSuccess} = false`),
      db.select({
        date: sql<string>`date(${schema.commandUsageTable.createdAt})`,
        totalCommands: sql<number>`count(*)::int`,
        successfulCommands: sql<number>`count(*) filter (where ${schema.commandUsageTable.isSuccess} = true)::int`,
        failedCommands: sql<number>`count(*) filter (where ${schema.commandUsageTable.isSuccess} = false)::int`,
        avgExecutionTime: sql<number>`avg(${schema.commandUsageTable.executionTime})::int`
      })
        .from(schema.commandUsageTable)
        .where(sql`${schema.commandUsageTable.createdAt} >= ${growthStartDate}`)
        .groupBy(sql`date(${schema.commandUsageTable.createdAt})`)
        .orderBy(sql`date(${schema.commandUsageTable.createdAt})`),
      db.select({
        date: sql<string>`date(${schema.commandUsageTable.createdAt})`,
        successRate: sql<number>`(count(*) filter (where ${schema.commandUsageTable.isSuccess} = true) * 100.0 / count(*))::numeric(5,2)`
      })
        .from(schema.commandUsageTable)
        .where(sql`${schema.commandUsageTable.createdAt} >= ${growthStartDate}`)
        .groupBy(sql`date(${schema.commandUsageTable.createdAt})`)
        .orderBy(sql`date(${schema.commandUsageTable.createdAt})`),
      db.select({
        activeSessions: sql<number>`count(*) filter (where ${schema.sessionsTable.expiresAt} > now())::int`,
        totalSessions: sql<number>`count(*)::int`,
        avgSessionDuration: sql<number>`avg(extract(epoch from (${schema.sessionsTable.expiresAt} - ${schema.sessionsTable.createdAt})) / 3600)::int`
      })
        .from(schema.sessionsTable)
        .where(sql`${schema.sessionsTable.createdAt} >= ${monthStart}`),
      db.select({
        totalAiUsers: sql<number>`count(*) filter (where ${schema.usersTable.aiEnabled} = true)::int`,
        totalAiRequests: sql<number>`sum(${schema.usersTable.aiRequests})::int`,
        totalAiCharacters: sql<number>`sum(${schema.usersTable.aiCharacters})::int`,
        avgTemperature: sql<number>`avg(${schema.usersTable.aiTemperature})::numeric(3,2)`
      })
        .from(schema.usersTable),
    ]);

    const userGrowthResult = await db.select({
      date: sql<string>`date(${schema.usersTable.createdAt})`,
      count: sql<number>`count(*)::int`,
      cumulativeCount: sql<number>`sum(count(*)) over (order by date(${schema.usersTable.createdAt}))::int`
    })
      .from(schema.usersTable)
      .where(sql`${schema.usersTable.createdAt} >= ${growthStartDate}`)
      .groupBy(sql`date(${schema.usersTable.createdAt})`)
      .orderBy(sql`date(${schema.usersTable.createdAt})`);

    const stats = {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeToday: activeTodayResult[0]?.count || 0,
      activeThisWeek: activeThisWeekResult[0]?.count || 0,
      activeThisMonth: activeThisMonthResult[0]?.count || 0,
      newUsersToday: newUsersTodayResult[0]?.count || 0,
      newUsersThisWeek: newUsersThisWeekResult[0]?.count || 0,
      topLanguages: topLanguagesResult.map(row => ({
        language: row.language || 'Not Set',
        count: row.count
      })),
      topCommands: topCommandsResult.map(row => ({
        command: row.commandName,
        count: row.count,
        successRate: parseFloat(row.successRate?.toString() || '0'),
        avgExecutionTime: row.avgExecutionTime || 0
      })),
      totalCommands: totalCommandsResult[0]?.count || 0,
      failedCommands: failedCommandsResult[0]?.count || 0,
      userGrowth: userGrowthResult.map(row => ({
        date: row.date,
        count: row.count,
        cumulativeCount: row.cumulativeCount
      })),
      commandUsageOverTime: commandUsageOverTimeResult.map(row => ({
        date: row.date,
        totalCommands: row.totalCommands,
        successfulCommands: row.successfulCommands,
        failedCommands: row.failedCommands,
        avgExecutionTime: row.avgExecutionTime
      })),
      commandSuccessOverTime: commandSuccessOverTimeResult.map(row => ({
        date: row.date,
        successRate: parseFloat(row.successRate?.toString() || '0')
      })),
      sessionStats: {
        activeSessions: sessionStatsResult[0]?.activeSessions || 0,
        totalSessions: sessionStatsResult[0]?.totalSessions || 0,
        avgSessionDuration: sessionStatsResult[0]?.avgSessionDuration || 0
      },
      aiStats: {
        totalAiUsers: aiUsageStatsResult[0]?.totalAiUsers || 0,
        totalAiRequests: aiUsageStatsResult[0]?.totalAiRequests || 0,
        totalAiCharacters: aiUsageStatsResult[0]?.totalAiCharacters || 0,
        avgTemperature: parseFloat(aiUsageStatsResult[0]?.avgTemperature?.toString() || '0')
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("[❌ ERROR] Error in admin stats API:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}