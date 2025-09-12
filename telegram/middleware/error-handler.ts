import { Context } from 'telegraf';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { trackBotError, trackTelegramError } from '../utils/error-tracker';
import { getUserAndStrings } from '../utils/get-user-strings';

export function createErrorHandler(db: NodePgDatabase<typeof schema>) {
  return async (err: any, ctx: Context) => {
    const errorMessage = err.message || 'Unknown error occurred';
    const errorStack = err.stack || '';

    let errorType = 'UnknownError';

    if (err.name) {
      errorType = err.name;
    } else if (err.response?.error_code) {
      errorType = 'TelegramAPIError';
    }

    if (err.response && err.response.error_code) {
      await trackTelegramError(db, {
        errorCode: err.response.error_code,
        errorDescription: err.response.description || errorMessage,
        method: err.method,
        parameters: err.parameters,
      }, ctx);
    } else {
      let severity: 'info' | 'warning' | 'error' | 'critical' = 'error';

      if (err.name === 'ValidationError' || err.name === 'TypeError') {
        severity = 'warning';
      } else if (err.message.includes('timeout') || err.message.includes('network')) {
        severity = 'warning';
      } else if (err.message.includes('database') || err.message.includes('connection')) {
        severity = 'critical';
      }

      await trackBotError(db, {
        errorType,
        errorMessage,
        errorStack,
        severity,
      }, ctx);
    }

    try {
      if (ctx.chat && !err.response?.error_code) {
        const { Strings } = await getUserAndStrings(ctx, db);
        const errorText = Strings.unexpectedErr.replace('{error}', 'Internal error occurred');
        await ctx.reply(errorText);
      }
    } catch (replyError) {
      console.error('[❌] Failed to send error message to user:', replyError);
    }
  };
}

export function wrapCommandWithErrorHandling(
  db: NodePgDatabase<typeof schema>,
  commandName: string,
  handler: (ctx: Context) => Promise<void>
) {
  return async (ctx: Context) => {
    try {
      await handler(ctx);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      await trackBotError(db, {
        errorType: err.name || 'CommandError',
        errorMessage: err.message || 'Unknown command error',
        errorStack: err.stack,
        commandName,
        severity: 'error',
      }, ctx);

      console.error(`[❌ COMMAND] Error in ${commandName}:`, error);

      try {
        const { Strings } = await getUserAndStrings(ctx, db);
        const errorText = Strings.unexpectedErr.replace('{error}', 'Command execution failed');
        await ctx.reply(errorText);
      } catch (replyError) {
        console.error('[❌] Failed to send command error message:', replyError);
        try {
          await ctx.reply('⚠️ An error occurred while executing this command.');
        } catch (fallbackError) {
          console.error('[❌] Failed to send fallback error message:', fallbackError);
        }
      }
    }
  };
}