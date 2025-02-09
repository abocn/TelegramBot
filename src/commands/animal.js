const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
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
    const imageUrl = `${Resources.catApi}/${data._id}`;

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
}