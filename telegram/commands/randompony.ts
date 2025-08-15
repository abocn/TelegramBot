import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import { Telegraf, Context } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export const randomponyHandler = async (ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) => {
  const { Strings } = await getUserAndStrings(ctx, db);
  const reply_to_message_id = replyToMessageId(ctx);
  const searchingMessage = await ctx.reply(Strings.ponyApi.searching, {
    parse_mode: 'Markdown',
    ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
  });
  try {
    const response = await axios(Resources.randomPonyApi);
    let tags: string[] = [];

    if (response.data.pony.tags) {
      if (typeof response.data.pony.tags === 'string') {
        tags.push(response.data.pony.tags);
      } else if (Array.isArray(response.data.pony.tags)) {
        tags = tags.concat(response.data.pony.tags);
      }
    }

    await ctx.telegram.editMessageMedia(searchingMessage.chat.id, searchingMessage.message_id, undefined, {
      type: 'photo',
      media: response.data.pony.representations.full,
      caption: `${response.data.pony.sourceURL}\n\n${tags.length > 0 ? tags.join(', ') : ''}`,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
    await ctx.telegram.editMessageText(searchingMessage.chat.id, searchingMessage.message_id, undefined, message, {
      parse_mode: 'Markdown'
    });
    return;
  }
};

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command(["rpony", "randompony", "mlpart"], spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'random-pony')) return;

    try {
      await randomponyHandler(ctx, db);
      const commandName = ctx.message?.text?.startsWith('/rpony') ? 'rpony' : 
                         ctx.message?.text?.startsWith('/randompony') ? 'randompony' : 'mlpart';
      await trackCommand(db, ctx, commandName, true, undefined, startTime);
    } catch (error) {
      const commandName = ctx.message?.text?.startsWith('/rpony') ? 'rpony' : 
                         ctx.message?.text?.startsWith('/randompony') ? 'randompony' : 'mlpart';
      await trackCommand(db, ctx, commandName, false, error.message, startTime);
      throw error;
    }
  });
}