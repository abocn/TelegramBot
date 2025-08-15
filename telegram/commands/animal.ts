import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export const duckHandler = async (ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) => {
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios(Resources.duckApi);
    ctx.replyWithPhoto(response.data.url, {
      caption: "🦆",
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  } catch (error) {
    const { Strings } = await getUserAndStrings(ctx, db);
    const message = Strings.duckApiErr.replace('{error}', error.message);
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  }
};

export const foxHandler = async (ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) => {
  const { Strings } = await getUserAndStrings(ctx, db);
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios(Resources.foxApi);
    ctx.replyWithPhoto(response.data.image, {
      caption: "🦊",
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  } catch (error) {
    const message = Strings.foxApiErr.replace('{error}', error.message);
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  }
};

export const dogHandler = async (ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) => {
  const { Strings } = await getUserAndStrings(ctx, db);
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios(Resources.dogApi);
    ctx.replyWithPhoto(response.data.message, {
      caption: "🐶",
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  } catch (error) {
    const message = Strings.dogApiErr.replace('{error}', error.message);
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  }
};

export const catHandler = async (ctx: Context & { message: { text: string } }, db: NodePgDatabase<typeof schema>) => {
  const { Strings } = await getUserAndStrings(ctx, db);
  const apiUrl = `${Resources.catApi}?json=true`;
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    const imageUrl = `${data.url}`;
    await ctx.replyWithPhoto(imageUrl, {
      caption: `🐱`,
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  } catch (error) {
    const message = Strings.catImgErr.replace('{error}', error.message);
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  }
};

export const soggyHandler = async (ctx: Context & { message: { text: string } }) => {
  const userInput = ctx.message.text.split(' ')[1];
  const reply_to_message_id = replyToMessageId(ctx);

  switch (true) {
    case (userInput === "2" || userInput === "thumb"):
      ctx.replyWithPhoto(
        Resources.soggyCat2, {
        caption: Resources.soggyCat2,
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
      break;

    case (userInput === "3" || userInput === "sticker"):
      ctx.replyWithSticker(
        Resources.soggyCatSticker,
        reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : undefined
      );
      break;

    case (userInput === "4" || userInput === "alt"):
      ctx.replyWithPhoto(
        Resources.soggyCatAlt, {
        caption: Resources.soggyCatAlt,
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
      break;

    default:
      ctx.replyWithPhoto(
        Resources.soggyCat, {
        caption: Resources.soggyCat,
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
      break;
  };
};

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command("duck", spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    try {
      await duckHandler(ctx, db);
      await trackCommand(db, ctx, 'duck', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'duck', false, error.message, startTime);
    }
  });

  bot.command("fox", spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    try {
      await foxHandler(ctx, db);
      await trackCommand(db, ctx, 'fox', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'fox', false, error.message, startTime);
    }
  });

  bot.command("dog", spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    try {
      await dogHandler(ctx, db);
      await trackCommand(db, ctx, 'dog', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'dog', false, error.message, startTime);
    }
  });

  bot.command("cat", spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;

    try {
      await catHandler(ctx, db);
      await trackCommand(db, ctx, 'cat', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'cat', false, error.message, startTime);
    }
  });

  bot.command(['soggy', 'soggycat'], spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'soggy-cat')) return;

    try {
      await soggyHandler(ctx);
      const commandName = ctx.message?.text?.startsWith('/soggy') ? 'soggy' : 'soggycat';
      await trackCommand(db, ctx, commandName, true, undefined, startTime);
    } catch (error) {
      const commandName = ctx.message?.text?.startsWith('/soggy') ? 'soggy' : 'soggycat';
      await trackCommand(db, ctx, commandName, false, error.message, startTime);
    }
  });
}
