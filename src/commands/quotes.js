// const Resources = require('../props/resources.json');
// const { getStrings } = require('../plugins/checklang.js');
// const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
// const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
// const escape = require('markdown-escape');
// const axios = require('axios');

// module.exports = (bot) => {
//   bot.command("quote", spamwatchMiddleware, async (ctx) => {
//     const Strings = getStrings(ctx.from.language_code);

//     try {
//       const response = await axios.get(Resources.quoteApi);
//       const data = response.data;

//       ctx.reply(escape(`${escape(Strings.quoteResult)}\n> *${escape(data.quote)}*\n_${escape(data.author)}_`), {
//         reply_to_message_id: ctx.message.message_id,
//         parse_mode: 'Markdown'
//       });
//     } catch (error) {
//       console.error(error);
//       ctx.reply(Strings.quoteErr, {
//         reply_to_message_id: ctx.message.id,
//         parse_mode: 'MarkdownV2'
//       });
//     };
//   });
// };
