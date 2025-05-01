import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { languageCode } from '../utils/language-code';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: Telegraf<Context>) => {
  bot.start(spamwatchMiddleware, async (ctx: Context) => {
    const Strings = getStrings(languageCode(ctx));
    const botInfo = await ctx.telegram.getMe();
    const reply_to_message_id = replyToMessageId(ctx)
    const startMsg = Strings.botWelcome.replace(/{botName}/g, botInfo.first_name);

    ctx.reply(startMsg, {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
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