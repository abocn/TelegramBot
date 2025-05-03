import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';
import { languageCode } from '../utils/language-code';
import { replyToMessageId } from '../utils/reply-to-message-id';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

interface Device {
  brand: string;
  codename: string;
  model: string;
}

async function getDeviceList({ Strings, ctx }: { Strings: any, ctx: Context & { message: { text: string } } }) {
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios.get(Resources.codenameApi);
    return response.data
  } catch (error) {
    const message = Strings.codenameCheck.apiErr
      .replace('{error}', error.message);

    return ctx.reply(message, {
      parse_mode: "Markdown",
      ...({ reply_to_message_id })
    });
  }
}

export default (bot: Telegraf<Context>) => {
  bot.command(['codename', 'whatis'], spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const userInput = ctx.message.text.split(" ").slice(1).join(" ");
    const Strings = getStrings(languageCode(ctx));
    const { noCodename } = Strings.codenameCheck;
    const reply_to_message_id = replyToMessageId(ctx);

    if (verifyInput(ctx, userInput, noCodename)) {
      return;
    }

    const jsonRes = await getDeviceList({ Strings, ctx })
    const phoneSearch = Object.keys(jsonRes).find((codename) => codename === userInput);

    if (!phoneSearch) {
      return ctx.reply(Strings.codenameCheck.notFound, {
        parse_mode: "Markdown",
        ...({ reply_to_message_id })
      });
    }

    const deviceDetails = jsonRes[phoneSearch];
    const device = deviceDetails.find((item: Device) => item.brand) || deviceDetails[0];
    const message = Strings.codenameCheck.resultMsg
      .replace('{brand}', device.brand)
      .replace('{codename}', userInput)
      .replace('{model}', device.model)
      .replace('{name}', device.name);

    return ctx.reply(message, {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
    });
  })
}