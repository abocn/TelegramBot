// This is free and unencumbered software released into the public domain.
//
// Anyone is free to copy, modify, publish, use, compile, sell, or
// distribute this software, either in source code form or as a compiled
// binary, for any purpose, commercial or non-commercial, and by any
// means.
//
// In jurisdictions that recognize copyright laws, the author or authors
// of this software dedicate any and all copyright interest in the
// software to the public domain. We make this dedication for the benefit
// of the public at large and to the detriment of our heirs and
// successors. We intend this dedication to be an overt act of
// relinquishment in perpetuity of all present and future rights to this
// software under copyright law.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//
// For more information, please refer to <https://unlicense.org/>

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