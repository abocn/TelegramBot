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
        caption: response.data.message,
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
}