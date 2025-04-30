import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: Telegraf<Context>) => {
  bot.command("http", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');
    const userInput = ctx.message.text.split(' ')[1];
    const apiUrl = Resources.httpApi;
    const { invalidCode } = Strings.httpCodes

    if (verifyInput(ctx, userInput, invalidCode, true)) {
      return;
    }

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      const codesArray = Array.isArray(data) ? data : Object.values(data);
      const codeInfo = codesArray.find(item => item.code === parseInt(userInput));

      if (codeInfo) {
        const message = Strings.httpCodes.resultMsg
          .replace("{code}", codeInfo.code)
          .replace("{message}", codeInfo.message)
          .replace("{description}", codeInfo.description);
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          // @ts-ignore
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        await ctx.reply(Strings.httpCodes.notFound, {
          parse_mode: 'Markdown',
          // @ts-ignore
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      const message = Strings.httpCodes.fetchErr.replace("{error}", error);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("httpcat", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(/\s+/g, '');
    const { invalidCode } = Strings.httpCodes

    if (verifyInput(ctx, userInput, invalidCode, true)) {
      return;
    }

    const apiUrl = `${Resources.httpCatApi}${userInput}`;

    try {
      await ctx.replyWithPhoto(apiUrl, {
        caption: `🐱 ${apiUrl}`,
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      ctx.reply(Strings.catImgErr, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
};
