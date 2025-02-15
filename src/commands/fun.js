const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

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
      gifErr = gifErr.replace('{err}', err);
      ctx.reply(Strings.gifErr, {
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

  bot.command(['soggy', 'soggycat'], spamwatchMiddleware, async (ctx) => {
    const userInput = ctx.message.text.split(' ')[1];
    
    switch (true) {
      case (userInput === "2" || userInput === "thumb"):
        ctx.replyWithPhoto(
          Resources.soggyCat2, {
          caption: Resources.soggyCat2,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;

      case (userInput === "3" || userInput === "sticker"):
        ctx.replyWithSticker(
          Resources.soggyCatSticker, {
          reply_to_message_id: ctx.message.message_id
        });
        break;

      case (userInput === "4" || userInput === "alt"):
        ctx.replyWithPhoto(
          Resources.soggyCatAlt, {
          caption: Resources.soggyCatAlt,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;

      default:
        ctx.replyWithPhoto(
          Resources.soggyCat, {
          caption: Resources.soggyCat,
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
        break;
    };
  });
};