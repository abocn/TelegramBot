import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command("http", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'http-status')) return;

    try {
      const reply_to_message_id = ctx.message.message_id;
      const { Strings } = await getUserAndStrings(ctx, db);
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
            ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
          });
        } else {
          await ctx.reply(Strings.httpCodes.notFound, {
            parse_mode: 'Markdown',
            ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
          });
        };
      } catch (error) {
        const message = Strings.httpCodes.fetchErr.replace('{error}', error);
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      }

      await trackCommand(db, ctx, 'http', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'http', false, error.message, startTime);
      throw error;
    }
  });

  bot.command("httpcat", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const reply_to_message_id = ctx.message.message_id;
      const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(/\s+/g, '');
      const { invalidCode } = Strings.httpCodes

      if (verifyInput(ctx, userInput, invalidCode, true)) {
        return;
      }
      if (userInput.length !== 3) {
        ctx.reply(Strings.httpCodes.invalidCode, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        })
        return
      }

      const apiUrl = `${Resources.httpCatApi}${userInput}`;

      try {
        await ctx.replyWithPhoto(apiUrl, {
          caption: `🐱 ${apiUrl}`,
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      } catch (error) {
        await ctx.reply(Strings.catImgErr, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      }

      await trackCommand(db, ctx, 'httpcat', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'httpcat', false, error.message, startTime);
      throw error;
    }
  });
};
