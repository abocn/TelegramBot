import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

function sendRandomReply(ctx, gifUrl, textKey) {
  const Strings = getStrings(ctx.from.language_code);
  const randomNumber = Math.floor(Math.random() * 100);
  const shouldSendGif = randomNumber > 50;

  const caption = Strings[textKey].replace('{randomNum}', randomNumber)

  if (shouldSendGif) {
    ctx.replyWithAnimation(gifUrl, {
      caption,
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    }).catch(err => {
      const gifErr = Strings.gifErr.replace('{err}', err);
      ctx.reply(gifErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    });
  } else {
    ctx.reply(caption, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  }
}


async function handleDiceCommand(ctx, emoji, delay) {
  const Strings = getStrings(ctx.from.language_code);

  const result = await ctx.sendDice({ emoji, reply_to_message_id: ctx.message.message_id });
  const botResponse = Strings.funEmojiResult
    .replace('{emoji}', result.dice.emoji)
    .replace('{value}', result.dice.value);

  setTimeout(() => {
    ctx.reply(botResponse, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  }, delay);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * (max + 1));
}

export default (bot) => {
  bot.command('random', spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const randomValue = getRandomInt(11);
    const randomVStr = Strings.randomNum.replace('{number}', randomValue);

    ctx.reply(
      randomVStr, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('dice', spamwatchMiddleware, async (ctx) => {
    await handleDiceCommand(ctx, undefined, 4000);
  });

  bot.command('slot', spamwatchMiddleware, async (ctx) => {
    await handleDiceCommand(ctx, '🎰', 3000);
  });

  bot.command('ball', spamwatchMiddleware, async (ctx) => {
    await handleDiceCommand(ctx, '⚽', 3000);
  });

  bot.command('dart', spamwatchMiddleware, async (ctx) => {
    await handleDiceCommand(ctx, '🎯', 3000);
  });

  bot.command('bowling', spamwatchMiddleware, async (ctx) => {
    await handleDiceCommand(ctx, '🎳', 3000);
  });

  bot.command('idice', spamwatchMiddleware, async (ctx) => {
    ctx.replyWithSticker(
      Resources.infiniteDice, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('furry', spamwatchMiddleware, async (ctx) => {
    sendRandomReply(ctx, Resources.furryGif, 'furryAmount');
  });

  bot.command('gay', spamwatchMiddleware, async (ctx) => {
    sendRandomReply(ctx, Resources.gayFlag, 'gayAmount');
  });
};