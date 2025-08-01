import { Context, Telegraf } from 'telegraf';
import axios from 'axios';

import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';

import verifyInput from '../plugins/verifyInput';

import * as schema from '../../database/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { languageCode } from '../utils/language-code';
import { isCommandDisabled } from '../utils/check-command-disabled';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

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
  bot.command("http", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'http-status')) return;

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
      ctx.reply(message, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
    };
  });

  bot.command("httpcat", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    const Strings = getStrings(languageCode(ctx));
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
      ctx.reply(Strings.catImgErr, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
    }
  });
};
