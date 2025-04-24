import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: any) => {
  bot.start(spamwatchMiddleware, async (ctx: any) => {
    const Strings = getStrings(ctx.from.language_code);
    const botInfo = await ctx.telegram.getMe();
    const startMsg = Strings.botWelcome.replace(/{botName}/g, botInfo.first_name);

    ctx.reply(startMsg, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('privacy', spamwatchMiddleware, async (ctx: any) => {
    const Strings = getStrings(ctx.from.language_code);
    const message = Strings.botPrivacy.replace("{botPrivacy}", process.env.botPrivacy);

    ctx.reply(message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });
};