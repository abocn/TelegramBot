import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserInfo(ctx) {
  const Strings = getStrings(ctx.from.language_code);
  let lastName = ctx.from.last_name;
  if (lastName === undefined) {
    lastName = " ";
  }

  const userInfo = Strings.userInfo
    .replace('{userName}', `${ctx.from.first_name} ${lastName}` || Strings.varStrings.varUnknown)
    .replace('{userId}', ctx.from.id || Strings.varStrings.varUnknown)
    .replace('{userHandle}', ctx.from.username ? `@${ctx.from.username}` : Strings.varStrings.varNone)
    .replace('{userPremium}', ctx.from.is_premium ? Strings.varStrings.varYes : Strings.varStrings.varNo)
    .replace('{userLang}', ctx.from.language_code || Strings.varStrings.varUnknown);

  return userInfo;
}

async function getChatInfo(ctx) {
  const Strings = getStrings(ctx.from.language_code);
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    const chatInfo = Strings.chatInfo
      .replace('{chatId}', ctx.chat.id || Strings.varStrings.varUnknown)
      .replace('{chatName}', ctx.chat.title || Strings.varStrings.varUnknown)
      .replace('{chatHandle}', ctx.chat.username ? `@${ctx.chat.username}` : Strings.varStrings.varNone)
      .replace('{chatMembersCount}', await ctx.getChatMembersCount(ctx.chat.id || Strings.varStrings.varUnknown))
      .replace('{chatType}', ctx.chat.type || Strings.varStrings.varUnknown)
      .replace('{isForum}', ctx.chat.is_forum ? Strings.varStrings.varYes : Strings.varStrings.varNo);
    
    return chatInfo;
  } else {
    return ctx.reply(
      Strings.groupOnly, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  }
}

export default (bot) => {
  bot.command('chatinfo', spamwatchMiddleware, async (ctx) => {
    const chatInfo = await getChatInfo(ctx);
    ctx.reply(
      chatInfo, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      }
    );
  });

  bot.command('userinfo', spamwatchMiddleware, async (ctx) => {
    const userInfo = await getUserInfo(ctx);
    ctx.reply(
      userInfo, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id,
      }
    );
  });
};
