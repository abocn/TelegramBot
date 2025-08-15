import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserInfo(ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) {
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

async function getChatInfo(ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) {
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

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command('chatinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'info-commands')) return;

    try {
      const chatInfo = await getChatInfo(ctx, db);
      await ctx.reply(
        chatInfo, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        }
      );
      await trackCommand(db, ctx, 'chatinfo', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'chatinfo', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('userinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'info-commands')) return;

    try {
      const userInfo = await getUserInfo(ctx, db);
      await ctx.reply(
        userInfo, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        }
      );
      await trackCommand(db, ctx, 'userinfo', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'userinfo', false, error.message, startTime);
      throw error;
    }
  });
};
