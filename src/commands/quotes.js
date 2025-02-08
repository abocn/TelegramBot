const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');

module.exports = (bot) => {
  bot.command("quote", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);

    try {
      const response = await axios.get(Resources.quoteApi);
      const data = response.data;
      const escapedQuote = data.quote.replace(/([\\_*~`>.!-])/g, '\\$1');
      const escapedAuthor = `- ${data.author}.`.replace(/([\\_*~`>.!-])/g, '\\$1');
      const escapedData = `${Strings.quoteResult}\n>*${escapedQuote}*\n_${escapedAuthor}_`;

      ctx.reply(escapedData, {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'MarkdownV2'
      });
    } catch (error) {
      console.error(error);
      ctx.reply(Strings.quoteErr, {
        reply_to_message_id: ctx.message.id,
        parse_mode: 'MarkdownV2'
      });
    };
  });
};
