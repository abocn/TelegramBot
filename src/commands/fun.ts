import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { languageCode } from '../utils/language-code';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

function sendRandomReply(ctx: Context & { message: { text: string } }, gifUrl: string, textKey: string) {
  const Strings = getStrings(languageCode(ctx));
  const randomNumber = Math.floor(Math.random() * 100);
  const shouldSendGif = randomNumber > 50;

  const caption = Strings[textKey].replace('{randomNum}', randomNumber)

  if (shouldSendGif) {
    ctx.replyWithAnimation(gifUrl, {
      caption,
      parse_mode: 'Markdown',
      // @ts-ignore
      reply_to_message_id: ctx.message.message_id
    }).catch(err => {
      const gifErr = Strings.gifErr.replace('{err}', err);
      ctx.reply(gifErr, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    });
  } else {
    ctx.reply(caption, {
      parse_mode: 'Markdown',
      // @ts-ignore
      reply_to_message_id: ctx.message.message_id
    });
  }
}


async function handleDiceCommand(ctx: Context & { message: { text: string } }, emoji: string, delay: number) {
  const Strings = getStrings(languageCode(ctx));

  // @ts-ignore
  const result = await ctx.sendDice({ emoji, reply_to_message_id: ctx.message.message_id });
  const botResponse = Strings.funEmojiResult
    .replace('{emoji}', result.dice.emoji)
    .replace('{value}', result.dice.value);

  setTimeout(() => {
    ctx.reply(botResponse, {
      parse_mode: 'Markdown',
      // @ts-ignore
      reply_to_message_id: ctx.message.message_id
    });
  }, delay);
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * (max + 1));
}

export default (bot: Telegraf<Context>) => {
  bot.command('random', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(languageCode(ctx));
    const randomValue = getRandomInt(10);
    const randomVStr = Strings.randomNum.replace('{number}', randomValue);

    ctx.reply(
      randomVStr, {
      parse_mode: 'Markdown',
      // @ts-ignore
      reply_to_message_id: ctx.message.message_id
    });
  });

  // TODO: maybe send custom stickers to match result of the roll? i think there are pre-existing ones
  bot.command('dice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎲', 4000);
  });

  bot.command('slot', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎰', 3000);
  });

  bot.command('ball', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '⚽', 3000);
  });

  bot.command('dart', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎯', 3000);
  });

  bot.command('bowling', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    await handleDiceCommand(ctx, '🎳', 3000);
  });

  bot.command('idice', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    ctx.replyWithSticker(
      Resources.infiniteDice, {
      // @ts-ignore
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('furry', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    sendRandomReply(ctx, Resources.furryGif, 'furryAmount');
  });

  bot.command('gay', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    sendRandomReply(ctx, Resources.gayFlag, 'gayAmount');
  });
};