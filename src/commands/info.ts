import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserInfo(ctx: Context & { message: { text: string } }) {
  const Strings = getStrings(ctx.from?.language_code || 'en');
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

async function getChatInfo(ctx: Context & { message: { text: string } }) {
  const Strings = getStrings(ctx.from?.language_code || 'en');
  if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
    const chatInfo = Strings.chatInfo
      .replace('{chatId}', ctx.chat?.id || Strings.varStrings.varUnknown)
      .replace('{chatName}', ctx.chat?.title || Strings.varStrings.varUnknown)
      // @ts-ignore
      .replace('{chatHandle}', ctx.chat?.username ? `@${ctx.chat?.username}` : Strings.varStrings.varNone)
      .replace('{chatMembersCount}', await ctx.getChatMembersCount())
      .replace('{chatType}', ctx.chat?.type || Strings.varStrings.varUnknown)
      // @ts-ignore
      .replace('{isForum}', ctx.chat?.is_forum ? Strings.varStrings.varYes : Strings.varStrings.varNo);
    
    return chatInfo;
  } else {
    return Strings.groupOnly
  }
}

export default (bot: Telegraf<Context>) => {
  bot.command('chatinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const chatInfo = await getChatInfo(ctx);
    ctx.reply(
      chatInfo, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      }
    );
  });

  bot.command('userinfo', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const userInfo = await getUserInfo(ctx);
    ctx.reply(
      userInfo, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      }
    );
  });
};
