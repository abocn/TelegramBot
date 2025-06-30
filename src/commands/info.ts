import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import * as schema from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserAndStrings(ctx: Context, db?: NodePgDatabase<typeof schema>): Promise<{ Strings: any, languageCode: string }> {
  let languageCode = 'en';
  if (!ctx.from) {
    const Strings = getStrings(languageCode);
    return { Strings, languageCode };
  }
  const from = ctx.from;
  if (db && from.id) {
    const dbUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(from.id)), limit: 1 });
    if (dbUser.length > 0) {
      languageCode = dbUser[0].languageCode;
    }
  }
  if (from.language_code && languageCode === 'en') {
    languageCode = from.language_code;
    console.warn('[WARN !] Falling back to Telegram language_code for user', from.id);
  }
  const Strings = getStrings(languageCode);
  return { Strings, languageCode };
}

async function getUserInfo(ctx: Context & { message: { text: string } }, db: any) {
  const { Strings } = await getUserAndStrings(ctx, db);
  let lastName = ctx.from?.last_name;
  if (lastName === undefined) {
    lastName = " ";
  }
  const userInfo = Strings.userInfo
    .replace('{userName}', `${ctx.from?.first_name} ${lastName}` || Strings.varStrings.varUnknown)
    .replace('{userId}', ctx.from?.id || Strings.varStrings.varUnknown)
    .replace('{userHandle}', ctx.from?.username ? `@${ctx.from?.username}` : Strings.varStrings.varNone)
    .replace('{userPremium}', ctx.from?.is_premium ? Strings.varStrings.varYes : Strings.varStrings.varNo)
    .replace('{userLang}', ctx.from?.language_code || Strings.varStrings.varUnknown);
  return userInfo;
}

async function getChatInfo(ctx: Context & { message: { text: string } }, db: any) {
  const { Strings } = await getUserAndStrings(ctx, db);
  if ((ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup')) {
    const chat = ctx.chat as (typeof ctx.chat & { username?: string; is_forum?: boolean });
    const chatInfo = Strings.chatInfo
      .replace('{chatId}', chat?.id || Strings.varStrings.varUnknown)
      .replace('{chatName}', chat?.title || Strings.varStrings.varUnknown)
      .replace('{chatHandle}', chat?.username ? `@${chat.username}` : Strings.varStrings.varNone)
      .replace('{chatMembersCount}', await ctx.getChatMembersCount())
      .replace('{chatType}', chat?.type || Strings.varStrings.varUnknown)
      .replace('{isForum}', chat?.is_forum ? Strings.varStrings.varYes : Strings.varStrings.varNo);
    return chatInfo;
  } else {
    return Strings.groupOnly;
  }
}

export default (bot: Telegraf<Context>, db) => {
  bot.command('chatinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const chatInfo = await getChatInfo(ctx, db);
    ctx.reply(
      chatInfo, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      }
    );
  });

  bot.command('userinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const userInfo = await getUserInfo(ctx, db);
    ctx.reply(
      userInfo, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      }
    );
  });
};
