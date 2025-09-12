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