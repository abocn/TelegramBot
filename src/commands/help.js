const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);

async function sendHelpMessage(ctx, isEditing) {
  const Strings = getStrings(ctx.from.language_code);
  const botInfo = await ctx.telegram.getMe();
  const helpText = Strings.botHelp
    .replace(/{botName}/g, botInfo.first_name)
    .replace(/{sourceLink}/g, process.env.botSource);
  function getMessageId(ctx) {
    return ctx.message?.message_id || ctx.callbackQuery?.message?.message_id;
  };
  const createOptions = (ctx, includeReplyTo = false) => {
    const options = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: Strings.mainCommands, callback_data: 'helpMain' }, { text: Strings.usefulCommands, callback_data: 'helpUseful' }],
          [{ text: Strings.interactiveEmojis, callback_data: 'helpInteractive' }, { text: Strings.funnyCommands, callback_data: 'helpFunny' }],
          [{ text: Strings.lastFm.helpEntry, callback_data: 'helpLast' }, { text: Strings.animalCommands, callback_data: 'helpAnimals' }],
          [{ text: Strings.ytDownload.helpEntry, callback_data: 'helpYouTube' }, { text: Strings.ponyApi.helpEntry, callback_data: 'helpMLP' }]
        ]
      }
    };
    if (includeReplyTo) {
      const messageId = getMessageId(ctx);
      if (messageId) {
        options.reply_to_message_id = messageId;
      };
    };
    return options;
  };
  if (isEditing) {
    await ctx.editMessageText(helpText, createOptions(ctx));
  } else {
    await ctx.reply(helpText, createOptions(ctx, true));
  };
}

module.exports = (bot) => {
  bot.help(spamwatchMiddleware, async (ctx) => {
    await sendHelpMessage(ctx);
  });

  bot.command("about", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const aboutMsg = Strings.botAbout.replace(/{sourceLink}/g, `${process.env.botSource}`);
    ctx.reply(aboutMsg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  })

  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const Strings = getStrings(ctx.from.language_code);
    const options = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: Strings.varStrings.varBack, callback_data: 'helpBack' }],
        ]
      })
    };

    switch (callbackData) {
      case 'helpMain':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.mainCommandsDesc, options);
        break;
      case 'helpUseful':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.usefulCommandsDesc, options);
        break;
      case 'helpInteractive':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.interactiveEmojisDesc, options);
        break;
      case 'helpFunny':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.funnyCommandsDesc, options);
        break;
      case 'helpLast':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.lastFm.helpDesc, options);
        break;
      case 'helpYouTube':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.ytDownload.helpDesc, options);
        break;
      case 'helpAnimals':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.animalCommandsDesc, options);
        break;
      case 'helpMLP':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.ponyApi.helpDesc, options);
        break;
      case 'helpBack':
        await ctx.answerCbQuery();
        await sendHelpMessage(ctx, true);
        break;
      default:
        await ctx.answerCbQuery(Strings.errInvalidOption);
        break;
    }
  });
}
