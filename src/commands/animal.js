const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require("axios");

module.exports = (bot) => {
  bot.command("duck", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    try {
      const response = await axios(Resources.duckApi);
      ctx.replyWithPhoto(response.data.url, {
        caption: "🦆",
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      const message = Strings.duckApiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  });

  bot.command("fox", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    try {
      const response = await axios(Resources.foxApi);
      ctx.replyWithPhoto(response.data.image, {
        caption: "🦊",
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      const message = Strings.foxApiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  });

  bot.command("dog", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    try {
      const response = await axios(Resources.dogApi);
      ctx.replyWithPhoto(response.data.message, {
        caption: "🐶",
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      const message = Strings.foxApiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  });

  bot.command("cat", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const apiUrl = `${Resources.catApi}?json=true`;
    const response = await axios.get(apiUrl);
    const data = response.data;
    const imageUrl = `${data.url}`;

    try {
      await ctx.replyWithPhoto(imageUrl, {
        caption: `🐱`,
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      ctx.reply(Strings.catImgErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
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
}