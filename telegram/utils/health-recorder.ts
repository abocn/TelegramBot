import { eq, and, gte, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { systemHealthTable, commandUsageTable } from '../../database/schema';
import { activeUsersGauge } from '../monitoring/metrics';

/**
 * Records system health metrics periodically to the database
 */
export class HealthRecorder {
  private intervalId: NodeJS.Timeout | null = null;
  private db: NodePgDatabase<typeof schema>;
  private intervalMs: number;

  constructor(db: NodePgDatabase<typeof schema>, intervalMinutes: number = 5) {
    this.db = db;
    this.intervalMs = intervalMinutes * 60 * 1000;
  }

  /**
   * Start recording health metrics periodically
   */
  start(delayFirstRecord: boolean = false) {
    if (!delayFirstRecord) {
      this.recordHealth().catch(console.error);
    }

    this.intervalId = setInterval(() => {
      this.recordHealth().catch(console.error);
    }, this.intervalMs);

    console.log(`[🔴  HR] Health recorder started, recording every ${this.intervalMs / 60000} minutes`);
  }

  /**
   * Stop recording health metrics
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[i] Health recorder stopped');
    }
  }

  /**
   * Perform real-time health checks and update metrics
   */
  async performRealTimeHealthChecks() {
    const { performLiveHealthCheck } = require('./real-time-health');
    return await performLiveHealthCheck();
  }

  /**
   * Record current system health to database
   */
  async recordHealth() {
    try {
      const healthStatus = await this.performRealTimeHealthChecks();
      const { botUptime, databaseConnected, valkeyConnected } = healthStatus;
      const memUsage = process.memoryUsage();
      const memoryUsageBytes = memUsage.heapUsed;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { usersTable } = await import('../../database/schema');
      const totalUsersResult = await this.db
        .select({ count: count() })
        .from(usersTable);
      const totalUsers = totalUsersResult[0]?.count || 0;
      const activeUsersResult = await this.db
        .select({ count: count() })
        .from(usersTable)
        .where(gte(usersTable.updatedAt, twentyFourHoursAgo));
      const activeUsers24h = activeUsersResult[0]?.count || 0;

      activeUsersGauge.set(activeUsers24h);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const totalCommandsResult = await this.db
        .select({ count: count() })
        .from(commandUsageTable);
      const totalCommands = totalCommandsResult[0]?.count || 0;

      const commandsResult = await this.db
        .select({ count: count() })
        .from(commandUsageTable)
        .where(gte(commandUsageTable.createdAt, oneHourAgo));
      const commandsLastHour = commandsResult[0]?.count || 0;
      const successfulCommands = await this.db
        .select({ count: count() })
        .from(commandUsageTable)
        .where(and(
          gte(commandUsageTable.createdAt, oneHourAgo),
          eq(commandUsageTable.isSuccess, true)
        ));
      const successCount = successfulCommands[0]?.count || 0;
      const errorRate = commandsLastHour > 0 ? ((commandsLastHour - successCount) / commandsLastHour) : 0;
      const recentCommands = await this.db
        .select({ executionTime: commandUsageTable.executionTime })
        .from(commandUsageTable)
        .where(gte(commandUsageTable.createdAt, oneHourAgo))
        .limit(100);

      let avgResponseTime = 0;
      if (recentCommands.length > 0) {
        const validTimes = recentCommands
          .map(cmd => cmd.executionTime)
          .filter(time => time !== null && time !== undefined) as number[];

        if (validTimes.length > 0) {
          avgResponseTime = Math.round(
            validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
          );
        }
      }

      await this.db.insert(systemHealthTable).values({
        id: nanoid(),
        timestamp: new Date(),
        botUptime,
        databaseConnected,
        valkeyConnected,
        memoryUsageBytes,
        activeUsers24h,
        commandsLastHour,
        errorRate,
        avgResponseTime
      });

      if (process.env.longerLogs === 'true') { console.log(`[i] Health recorded: Bot=${botUptime}, DB=${databaseConnected}, Valkey=${valkeyConnected}, TotalUsers=${totalUsers}, ActiveUsers24h=${activeUsers24h}, TotalCommands=${totalCommands}, CommandsLastHour=${commandsLastHour}`); };

    } catch (error) {
      console.error('[!] Failed to record health metrics:', error);
    }
  }
}

let healthRecorder: HealthRecorder | null = null;

export function initHealthRecorder(db: NodePgDatabase<typeof schema>, intervalMinutes?: number): HealthRecorder {
  if (!healthRecorder) {
    healthRecorder = new HealthRecorder(db, intervalMinutes);
  }
  return healthRecorder;
}

export function getHealthRecorder(): HealthRecorder | null {
  return healthRecorder;
}