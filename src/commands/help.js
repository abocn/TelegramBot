const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

async function sendHelpMessage(ctx, isEditing) {
  const Strings = getStrings(ctx.from.language_code);
  const botInfo = await ctx.telegram.getMe();
  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_to_message_id: ctx.message.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: Strings.mainCommands, callback_data: 'helpMain' }, { text: Strings.usefulCommands, callback_data: 'helpUseful' }],
        [{ text: Strings.interactiveEmojis, callback_data: 'helpInteractive' }, { text: Strings.funnyCommands, callback_data: 'helpFunny' }],
        [{ text: Strings.lastFm, callback_data: 'helpLast' }, { text: Strings.animalCommands, callback_data: 'helpAnimals' }],
        [{ text: Strings.ytDlp, callback_data: 'helpYouTube' }, { text: Strings.myLittlePony, callback_data: 'helpMLP' }],
        [{ text: Strings.aboutBot, callback_data: 'helpAbout' }]
      ]
    }
  };
  const helpText = Strings.botHelp
    .replace('{botName}', botInfo.first_name)
    .replace("{sourceLink}", `${process.env.botSource}`);
  if (isEditing) {
    await ctx.editMessageText(helpText, options);
  } else {
    await ctx.reply(helpText, options);
  }
}

module.exports = (bot) => {
  bot.help(spamwatchMiddleware, async (ctx) => {
    await sendHelpMessage(ctx);
  });

  bot.command("about", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const aboutMsg = Strings.botAbout.replace("{sourceLink}", `${process.env.botSource}`);
    
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
          [{ text: Strings.varBack, callback_data: 'helpBack' }],
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
        await ctx.editMessageText(Strings.lastFmDesc, options);
        break;
      case 'helpYouTube':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.ytDlpDesc, options);
        break;
      case 'helpAnimals':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.animalCommandsDesc, options);
        break;
      case 'helpMLP':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.myLittlePonyDesc, options);
        break;
      case 'helpAbout':
        await ctx.answerCbQuery();
        await ctx.editMessageText(Strings.botAbout, options);
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