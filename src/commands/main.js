const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

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
    ctx.reply(
      Strings.botPrivacy, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });
};