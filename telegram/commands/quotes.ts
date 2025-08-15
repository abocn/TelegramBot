import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import escape from 'markdown-escape';
import axios from 'axios';
import { Context, Telegraf } from 'telegraf';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command("quote", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'quotes')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);

      try {
        const response = await axios.get(Resources.quoteApi);
        const data: { quote: string, author: string } = response.data;

        if (!data || !data.quote || !data.author) {
          return ctx.reply(Strings.quote.error, {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
        }

        await ctx.reply(`> *${escape(data.quote)}*\n_${escape(data.author)}_`, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      } catch (error) {
        console.error(error);
        await ctx.reply(Strings.quote.error, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }

      await trackCommand(db, ctx, 'quote', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'quote', false, error.message, startTime);
      throw error;
    }
  });
};