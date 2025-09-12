// TRACK-COMMAND.TS
// by ihatenodejs/Aidan
//
// -----------------------------------------------------------------------
//
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

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { Context } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { commandTotal, commandDuration, getValkeyCollector } from '../monitoring/metrics';

export async function trackCommand(
  db: NodePgDatabase<typeof schema>,
  ctx: Context,
  commandName: string,
  success: boolean = true,
  errorMessage?: string,
  startTime?: number
) {
  try {
    const executionTime = startTime ? Date.now() - startTime : undefined;
    const chatType = ctx.chat?.type || 'unknown';

    commandTotal.inc({
      command: commandName,
      chat_type: chatType,
      status: success ? 'success' : 'failure'
    });

    if (executionTime !== undefined) {
      const durationSeconds = executionTime / 1000;
      commandDuration.observe({
        command: commandName,
        chat_type: chatType
      }, durationSeconds);

      const valkeyCollector = getValkeyCollector();
      if (valkeyCollector) {
        await valkeyCollector.trackCommandExecution(commandName, chatType, executionTime);
      }
    }

    await db.insert(schema.commandUsageTable).values({
      id: uuidv4(),
      commandName,
      chatType,
      isSuccess: success,
      errorMessage: errorMessage ? errorMessage.slice(0, 1000) : undefined,
      executionTime,
    });
  } catch (error) {
    console.error('Failed to track command usage:', error);
  }
}