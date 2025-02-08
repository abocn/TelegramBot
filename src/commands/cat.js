const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');

module.exports = (bot) => {
  // bot.command("cat", spamwatchMiddleware, async (ctx) => {
  //   const Strings = getStrings(ctx.from.language_code);
  //   const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(/\s+/g, '');
  //   let request = "";

  //   if (userInput && userInput.includes("gif")) {
  //     request = `/gif${userInput.replace("gif", "")}`;
  //     const apiUrl = `https://cataas.com/cat${request}`;

  //     try {
  //       await ctx.replyWithAnimation(apiUrl, {
  //         caption: `🐱`,
  //         parse_mode: 'Markdown',
  //         reply_to_message_id: ctx.message.message_id
  //       });
  //     } catch (error) {
  //       ctx.reply(Strings.catGifErr, {
  //         parse_mode: 'Markdown',
  //         reply_to_message_id: ctx.message.message_id
  //       });
  //     };
  //   } else {
  //     request = userInput ? `/${userInput}` : '';
  //     const apiUrl = `https://cataas.com/cat${request}`;

  //     try {
  //       await ctx.replyWithPhoto(apiUrl, {
  //         caption: `🐱`,
  //         parse_mode: 'Markdown',
  //         reply_to_message_id: ctx.message.message_id
  //       });
  //     } catch (error) {
  //       ctx.reply(Strings.catImgErr, {
  //         parse_mode: 'Markdown',
  //         reply_to_message_id: ctx.message.message_id
  //       });
  //     };
  //   };
  // });

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
};
