import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { languageCode } from '../utils/language-code';
import { isCommandDisabled } from '../utils/check-command-disabled';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

export const duckHandler = async (ctx: Context & { message: { text: string } }) => {
  const reply_to_message_id = replyToMessageId(ctx);
  try {
    const response = await axios(Resources.duckApi);
    ctx.replyWithPhoto(response.data.url, {
      caption: "🦆",
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  } catch (error) {
    const Strings = getStrings(languageCode(ctx));
    const message = Strings.duckApiErr.replace('{error}', error.message);
    ctx.reply(message, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
    return;
  }
};

export const foxHandler = async (ctx: Context & { message: { text: string } }) => {
  const Strings = getStrings(languageCode(ctx));
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
    return;
  }
};

export const dogHandler = async (ctx: Context & { message: { text: string } }) => {
  const Strings = getStrings(languageCode(ctx));
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
    return;
  }
};

export const catHandler = async (ctx: Context & { message: { text: string } }) => {
  const Strings = getStrings(languageCode(ctx));
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
    return;
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

export default (bot: Telegraf<Context>, db: any) => {
  bot.command("duck", spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;
    await duckHandler(ctx);
  });

  bot.command("fox", spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;
    await foxHandler(ctx);
  });

  bot.command("dog", spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;
    await dogHandler(ctx);
  });

  bot.command("cat", spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'animals-basic')) return;
    await catHandler(ctx);
  });

  bot.command(['soggy', 'soggycat'], spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'soggy-cat')) return;
    await soggyHandler(ctx);
  });
}
