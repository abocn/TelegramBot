import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { Context } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { botErrors, telegramApiErrors } from '../monitoring/metrics';

export interface ErrorInfo {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  commandName?: string;
  chatType?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface TelegramErrorInfo {
  errorCode?: number;
  errorDescription: string;
  method?: string;
  parameters?: any;
  retryCount?: number;
}

export async function trackBotError(
  db: NodePgDatabase<typeof schema>,
  errorInfo: ErrorInfo,
  ctx?: Context
) {
  try {
    const severity = errorInfo.severity || 'error';

    botErrors.inc({
      error_type: errorInfo.errorType,
      command: errorInfo.commandName || 'unknown'
    });

    const errorData = {
      id: uuidv4(),
      errorType: errorInfo.errorType,
      errorMessage: errorInfo.errorMessage.slice(0, 2000),
      errorStack: errorInfo.errorStack ? errorInfo.errorStack.slice(0, 10000) : undefined,
      commandName: errorInfo.commandName,
      chatType: errorInfo.chatType || ctx?.chat?.type,
      severity,
      resolved: false,
    };

    await db.insert(schema.botErrorsTable).values(errorData);

    console.error(`[❌ ERROR] ${errorInfo.errorType}: ${errorInfo.errorMessage}`);

    if (severity === 'critical') {
      console.error(`[❌] Critical error logged`);
    }
  } catch (error) {
    console.error('[❌] Failed to track bot error:', error);
  }
}

export async function trackTelegramError(
  db: NodePgDatabase<typeof schema>,
  errorInfo: TelegramErrorInfo,
  ctx?: Context
) {
  try {
    telegramApiErrors.inc({
      error_code: errorInfo.errorCode?.toString() || 'unknown',
      error_type: errorInfo.method || 'unknown'
    });

    const errorData = {
      id: uuidv4(),
      errorCode: errorInfo.errorCode,
      errorDescription: errorInfo.errorDescription.slice(0, 1000),
      method: errorInfo.method,
      parameters: errorInfo.parameters ? JSON.stringify(errorInfo.parameters).slice(0, 5000) : undefined,
      retryCount: errorInfo.retryCount || 0,
      resolved: false,
    };

    await db.insert(schema.telegramErrorsTable).values(errorData);

    console.error(`[TG ERROR] ${errorInfo.errorCode || 'N/A'}: ${errorInfo.errorDescription}`);
  } catch (error) {
    console.error('[❌] Failed to track Telegram error:', error);
  }
}

export async function recordSystemHealth(
  db: NodePgDatabase<typeof schema>,
  healthData: {
    botUptime: boolean;
    databaseConnected: boolean;
    valkeyConnected: boolean;
    memoryUsageBytes?: number;
    activeUsers24h?: number;
    commandsLastHour?: number;
    errorRate?: number;
    avgResponseTime?: number;
  }
) {
  try {
    const healthRecord = {
      id: uuidv4(),
      timestamp: new Date(),
      botUptime: healthData.botUptime,
      databaseConnected: healthData.databaseConnected,
      valkeyConnected: healthData.valkeyConnected,
      memoryUsageBytes: healthData.memoryUsageBytes,
      activeUsers24h: healthData.activeUsers24h,
      commandsLastHour: healthData.commandsLastHour,
      errorRate: healthData.errorRate,
      avgResponseTime: healthData.avgResponseTime,
    };

    await db.insert(schema.systemHealthTable).values(healthRecord);
  } catch (error) {
    console.error('[❌] Failed to record system health:', error);
  }
}

export async function resolveError(
  db: NodePgDatabase<typeof schema>,
  errorId: string,
  errorTable: 'bot_errors' | 'telegram_errors'
) {
  try {
    const now = new Date();

    if (errorTable === 'bot_errors') {
      await db.update(schema.botErrorsTable)
        .set({ resolved: true, resolvedAt: now })
        .where(eq(schema.botErrorsTable.id, errorId));
    } else {
      await db.update(schema.telegramErrorsTable)
        .set({ resolved: true })
        .where(eq(schema.telegramErrorsTable.id, errorId));
    }

    console.log(`[✅] Error ${errorId} marked as resolved`);
  } catch (error) {
    console.error('[❌] Failed to resolve error:', error);
  }
}