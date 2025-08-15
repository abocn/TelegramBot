import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ensureUserInDb } from './ensure-user';
import { getStrings } from '../plugins/checklang';
import * as schema from '../../database/schema';
import { Context } from 'telegraf';

type UserRow = typeof schema.usersTable.$inferSelect;

export async function getUserAndStrings(
  ctx: Context,
  db: NodePgDatabase<typeof schema>
) : Promise<{user: UserRow | null, Strings: any, languageCode: string }> {
  let user: UserRow | null = null;
  let languageCode = 'en';
  if (!ctx.from) {
    const Strings = getStrings(languageCode);
    return { user, Strings, languageCode };
  }
  const { id, language_code } = ctx.from;
  if (id) {
    const dbUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(id)), limit: 1 });
    if (dbUser.length === 0) {
      await ensureUserInDb(ctx, db);
      const newUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(id)), limit: 1 });
      if (newUser.length > 0) {
        user = newUser[0];
        languageCode = user.languageCode;
      }
    } else {
      user = dbUser[0];
      languageCode = user.languageCode;
    }
  }
  if (!user && language_code) {
    languageCode = language_code;
    console.warn('[WARN !] Falling back to Telegram language_code for user', id);
  }
  const Strings = getStrings(languageCode);
  return { user, Strings, languageCode };
}

export async function getUserWithStringsAndModel(
  ctx: Context,
  db: NodePgDatabase<typeof schema>
): Promise<{ user: UserRow; Strings: ReturnType<typeof getStrings>; languageCode: string; customAiModel: string; aiTemperature: number, showThinking: boolean }> {
  const { user: dbUser, Strings, languageCode } = await getUserAndStrings(ctx, db);
  if (!dbUser) {
    throw new Error("User not found after ensuring user in db");
  }
  return {
    user: dbUser,
    Strings,
    languageCode,
    customAiModel: dbUser.customAiModel,
    aiTemperature: dbUser.aiTemperature,
    showThinking: dbUser.showThinking
  };
}