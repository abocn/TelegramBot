const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');

module.exports = (bot) => {
  bot.command("dog", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const apiUrl = Resources.dogApi;
    const response = await axios.get(apiUrl);
    const data = response.data;

    try {
      await ctx.replyWithPhoto(data.message, {
        caption: `🐶`,
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      ctx.reply(Strings.dogImgErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });
};
