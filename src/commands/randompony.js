const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require("axios");

module.exports = (bot) => {
  bot.command(["rpony", "randompony"], spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    try {
      const response = await axios(Resources.randomPonyApi);
      let tags = [];

      if (response.data.pony.tags) {
        if (typeof response.data.pony.tags === 'string') {
          tags.push(response.data.pony.tags);
        } else if (Array.isArray(response.data.pony.tags)) {
          tags = tags.concat(response.data.pony.tags);
        }
      }

      ctx.replyWithPhoto(response.data.pony.representations.full, {
        caption: `${response.data.pony.sourceURL}\n\n${tags.length > 0 ? tags.join(', ') : 'N/A'}`,
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  });
}