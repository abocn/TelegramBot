const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');

module.exports = (bot) => {
  bot.command("http", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ')[1];
    const apiUrl = Resources.httpApi;

    if (!userInput || isNaN(userInput)) {
      return ctx.reply(Strings.httpCodes.invalidCode, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;
      const codesArray = Array.isArray(data) ? data : Object.values(data);
      const codeInfo = codesArray.find(item => item.code === parseInt(userInput));

      if (codeInfo) {
        const message = Strings.httpCodes.resultMsg
          .replace("{code}", codeInfo.code)
          .replace("{message}", codeInfo.message)
          .replace("{description}", codeInfo.description);
        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        await ctx.reply(Strings.httpCodes.notFound, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      const message = Strings.httpCodes.fetchErr.replace("{error}", error);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("httpcat", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(/\s+/g, '');
    
    if (!userInput || isNaN(userInput)) {
      return ctx.reply(Strings.httpCodes.invalidCode, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    }

    const apiUrl = `${Resources.httpCatApi}${userInput}`;

    try {
      await ctx.replyWithPhoto(apiUrl, {
        caption: `🐱 ${apiUrl}`,
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      ctx.reply(Strings.catImgErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
};
