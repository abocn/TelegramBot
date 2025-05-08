import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { languageCode } from '../utils/language-code';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

interface MessageOptions {
  parse_mode: string;
  disable_web_page_preview: boolean;
  reply_markup: {
    inline_keyboard: { text: any; callback_data: string; }[][];
  };
  reply_to_message_id?: number;
}

async function sendHelpMessage(ctx, isEditing) {
  const Strings = getStrings(languageCode(ctx));
  const botInfo = await ctx.telegram.getMe();
  const helpText = Strings.botHelp
    .replace(/{botName}/g, botInfo.first_name)
    .replace(/{sourceLink}/g, process.env.botSource);
  function getMessageId(ctx) {
    return ctx.message?.message_id || ctx.callbackQuery?.message?.message_id;
  };
  const createOptions = (ctx, includeReplyTo = false): MessageOptions => {
    const options: MessageOptions = {
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

export default (bot) => {
  bot.help(spamwatchMiddleware, async (ctx) => {
    await sendHelpMessage(ctx, false);
  });

  bot.command("about", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(languageCode(ctx));
    const aboutMsg = Strings.botAbout.replace(/{sourceLink}/g, `${process.env.botSource}`);
    ctx.reply(aboutMsg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  })

  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const Strings = getStrings(languageCode(ctx));
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
