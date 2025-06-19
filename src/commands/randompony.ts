import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import { Telegraf, Context } from 'telegraf';
import { languageCode } from '../utils/language-code';
import { replyToMessageId } from '../utils/reply-to-message-id';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export default (bot: Telegraf<Context>) => {
  // TODO: this would greatly benefit from a loading message
  bot.command(["rpony", "randompony", "mlpart"], spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(languageCode(ctx));
    const reply_to_message_id = replyToMessageId(ctx);
    ctx.reply(Strings.ponyApi.searching, {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
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

      ctx.replyWithPhoto(response.data.pony.representations.full, {
        caption: `${response.data.pony.sourceURL}\n\n${tags.length > 0 ? tags.join(', ') : ''}`,
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      });
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      });
      return;
    }
  });
}