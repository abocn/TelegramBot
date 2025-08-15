import Resources from '../props/resources.json';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

function sendRandomReply(ctx: Context & { message: { text: string } }, gifUrl: string, textKey: string, db: NodePgDatabase<typeof schema>) {
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

async function handleDiceCommand(ctx: Context & { message: { text: string } }, emoji: string, delay: number, db: NodePgDatabase<typeof schema>) {
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

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command('random', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'fun-random')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const randomValue = getRandomInt(10);
      const randomVStr = Strings.randomNum.replace('{number}', randomValue);

      await ctx.reply(
        randomVStr, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });

      await trackCommand(db, ctx, 'random', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'random', false, error.message, startTime);
      throw error;
    }
  });

  // TODO: maybe send custom stickers to match result of the roll? i think there are pre-existing ones
  bot.command('dice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'games-dice')) return;

    try {
      await handleDiceCommand(ctx, '🎲', 4000, db);
      await trackCommand(db, ctx, 'dice', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'dice', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('slot', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'games-dice')) return;

    try {
      await handleDiceCommand(ctx, '🎰', 3000, db);
      await trackCommand(db, ctx, 'slot', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'slot', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('ball', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'games-dice')) return;

    try {
      await handleDiceCommand(ctx, '⚽', 3000, db);
      await trackCommand(db, ctx, 'ball', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'ball', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('dart', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'games-dice')) return;

    try {
      await handleDiceCommand(ctx, '🎯', 3000, db);
      await trackCommand(db, ctx, 'dart', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'dart', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('bowling', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'games-dice')) return;

    try {
      await handleDiceCommand(ctx, '🎳', 3000, db);
      await trackCommand(db, ctx, 'bowling', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'bowling', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('idice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'infinite-dice')) return;

    try {
      await ctx.replyWithSticker(
        Resources.infiniteDice, {
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });

      await trackCommand(db, ctx, 'idice', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'idice', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('furry', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'fun-random')) return;

    try {
      sendRandomReply(ctx, Resources.furryGif, 'furryAmount', db);
      await trackCommand(db, ctx, 'furry', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'furry', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('gay', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'fun-random')) return;

    try {
      sendRandomReply(ctx, Resources.gayFlag, 'gayAmount', db);
      await trackCommand(db, ctx, 'gay', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'gay', false, error.message, startTime);
      throw error;
    }
  });
};