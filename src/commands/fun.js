const resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

function sendRandomReply(ctx, gifUrl, textKey, notTextKey) {
  const Strings = getStrings(ctx.from.language_code);
  const shouldSendGif = Math.random() < 0.5;

  if (shouldSendGif) {
    ctx.replyWithAnimation(gifUrl, {
      caption: Strings[textKey],
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    }).catch(err => {
      gifErr = gifErr.replace('{err}', err);

      ctx.reply(Strings.gifErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    });
  } else {
    ctx.reply(Strings[notTextKey], {
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
  return Math.floor(Math.random() * max);
}

module.exports = (bot) => {
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
      resources.infiniteDice, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('furry', spamwatchMiddleware, async (ctx) => {
    sendRandomReply(ctx, resources.furryGif, 'isFurry', 'isNtFurry');
  });

  bot.command('gay', spamwatchMiddleware, async (ctx) => {
    sendRandomReply(ctx, resources.gayFlag, 'isGay', 'isNtGay');
  });

  bot.command('soggy', 'soggycat', spamwatchMiddleware, async (ctx) => {
    const userInput = ctx.message.text.split(' ')[1];
    
    switch (true) {
      case (userInput === "2" || userInput === "thumb"):
        ctx.replyWithPhoto(
          resources.soggyCat2, {
          caption: resources.soggyCat2,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;

      case (userInput === "3" || userInput === "sticker"):
        ctx.replyWithSticker(
          resources.soggyCatSticker, {
          reply_to_message_id: ctx.message.message_id
        });
        break;

      case (userInput === "4" || userInput === "alt"):
        ctx.replyWithPhoto(
          resources.soggyCatAlt, {
          caption: resources.soggyCatAlt,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;

      default:
        ctx.replyWithPhoto(
          resources.soggyCat, {
          caption: resources.soggyCat,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;
    };
  });
};