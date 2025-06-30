import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import * as schema from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

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

function sendRandomReply(ctx: Context & { message: { text: string } }, gifUrl: string, textKey: string, db: any) {
  getUserAndStrings(ctx, db).then(({ Strings }) => {
    const randomNumber = Math.floor(Math.random() * 100);
    const shouldSendGif = randomNumber > 50;
    const caption = Strings[textKey].replace('{randomNum}', randomNumber);
    if (shouldSendGif) {
      ctx.replyWithAnimation(gifUrl, {
        caption,
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      }).catch(err => {
        const gifErr = Strings.gifErr.replace('{err}', err);
        ctx.reply(gifErr, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      });
    } else {
      ctx.reply(caption, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    }
  });
}

async function handleDiceCommand(ctx: Context & { message: { text: string } }, emoji: string, delay: number, db: any) {
  const { Strings } = await getUserAndStrings(ctx, db);

  // @ts-ignore
  const result = await ctx.sendDice({ emoji, ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {}) });
  const botResponse = Strings.funEmojiResult
    .replace('{emoji}', result.dice.emoji)
    .replace('{value}', result.dice.value);

  setTimeout(() => {
    ctx.reply(botResponse, {
      parse_mode: 'Markdown',
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  }, delay);
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * (max + 1));
}

export default (bot: Telegraf<Context>, db) => {
  bot.command('random', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const randomValue = getRandomInt(10);
    const randomVStr = Strings.randomNum.replace('{number}', randomValue);

    ctx.reply(
      randomVStr, {
      parse_mode: 'Markdown',
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  });

  // TODO: maybe send custom stickers to match result of the roll? i think there are pre-existing ones
  bot.command('dice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎲', 4000, db);
  });

  bot.command('slot', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '��', 3000, db);
  });

  bot.command('ball', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '⚽', 3000, db);
  });

  bot.command('dart', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎯', 3000, db);
  });

  bot.command('bowling', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎳', 3000, db);
  });

  bot.command('idice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    ctx.replyWithSticker(
      Resources.infiniteDice, {
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  });

  bot.command('furry', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    sendRandomReply(ctx, Resources.furryGif, 'furryAmount', db);
  });

  bot.command('gay', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    sendRandomReply(ctx, Resources.gayFlag, 'gayAmount', db);
  });
};