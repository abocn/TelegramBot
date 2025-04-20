const { getStrings } = require('../plugins/checkLang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);

module.exports = (bot) => {
  bot.start(spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const botInfo = await ctx.telegram.getMe();
    const startMsg = Strings.botWelcome.replace(/{botName}/g, botInfo.first_name);

    ctx.reply(startMsg, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('privacy', spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const message = Strings.botPrivacy.replace("{botPrivacy}", process.env.botPrivacy);

    ctx.reply(message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });
};