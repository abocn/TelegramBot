import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import * as schema from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

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

async function getUserAndStrings(ctx: Context, db?: NodePgDatabase<typeof schema>): Promise<{ Strings: any, languageCode: string }> {
  let languageCode = 'en';
  if (!ctx.from) {
    const Strings = getStrings(languageCode);
    return { Strings, languageCode };
  }
  const from = ctx.from;
  if (db && from.id) {
    const dbUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(from.id)), limit: 1 });
    if (dbUser.length > 0) {
      languageCode = dbUser[0].languageCode;
    }
  }
  if (from.language_code && languageCode === 'en') {
    languageCode = from.language_code;
    console.warn('[WARN !] Falling back to Telegram language_code for user', from.id);
  }
  const Strings = getStrings(languageCode);
  return { Strings, languageCode };
}

export default (bot: Telegraf<Context>, db) => {
  bot.command(['codename', 'whatis'], spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
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

    return ctx.reply(message, {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
    });
  })
}