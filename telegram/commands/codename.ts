import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

interface Device {
  brand: string;
  codename: string;
  model: string;
  name: string;
}

export async function getDeviceByCodename(codename: string): Promise<Device | null> {
  try {
    const response = await axios.get(Resources.codenameApi);
    const jsonRes = response.data;
    const deviceDetails = jsonRes[codename];
    if (!deviceDetails) return null;
    return deviceDetails.find((item: Device) => item.brand) || deviceDetails[0];
  } catch (error) {
    return null;
  }
}

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command(['codename', 'whatis'], spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'codename-lookup')) return;

    try {
      const userInput = ctx.message.text.split(" ").slice(1).join(" ");
      const { Strings } = await getUserAndStrings(ctx, db);
      const { noCodename } = Strings.codenameCheck;
      const reply_to_message_id = replyToMessageId(ctx);

      if (verifyInput(ctx, userInput, noCodename)) {
        return;
      }

      const device = await getDeviceByCodename(userInput);

      if (!device) {
        return ctx.reply(Strings.codenameCheck.notFound, {
          parse_mode: "Markdown",
          ...({ reply_to_message_id })
        });
      }

      const message = Strings.codenameCheck.resultMsg
        .replace('{brand}', device.brand)
        .replace('{codename}', userInput)
        .replace('{model}', device.model)
        .replace('{name}', device.name);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      });

      const commandName = ctx.message?.text?.startsWith('/codename') ? 'codename' : 'whatis';
      await trackCommand(db, ctx, commandName, true, undefined, startTime);
    } catch (error) {
      const commandName = ctx.message?.text?.startsWith('/codename') ? 'codename' : 'whatis';
      await trackCommand(db, ctx, commandName, false, error.message, startTime);
      throw error;
    }
  })
}