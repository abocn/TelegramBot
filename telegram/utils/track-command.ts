import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { Context } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';

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