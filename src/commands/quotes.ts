/*
import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import escape from 'markdown-escape';
import axios from 'axios';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot) => {
  bot.command("quote", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);

    try {
      const response = await axios.get(Resources.quoteApi);
      const data = response.data;

      ctx.reply(escape(`${escape(Strings.quoteResult)}\n> *${escape(data.quote)}*\n_${escape(data.author)}_`), {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error(error);
      ctx.reply(Strings.quoteErr, {
        reply_to_message_id: ctx.message.id,
        parse_mode: 'MarkdownV2'
      });
    };
  });
};
*/