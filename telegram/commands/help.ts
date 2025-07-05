import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import type { Context } from 'telegraf';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserAndStrings(ctx: Context, db?: any): Promise<{ Strings: any, languageCode: string }> {
  let languageCode = 'en';
  if (!ctx.from) {
    const Strings = getStrings(languageCode);
    return { Strings, languageCode };
  }
  const from = ctx.from;
  if (db && from.id) {
    const dbUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(from.id)), limit: 1 });
    if (dbUser.length > 0) {
      languageCode = dbUser[0].languageCode;
    }
  }
  const Strings = getStrings(languageCode);
  return { Strings, languageCode };
}

function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const adminArray = process.env.botAdmins ? process.env.botAdmins.split(',').map(id => parseInt(id.trim())) : [];
  return adminArray.includes(userId);
}

interface MessageOptions {
  parse_mode: string;
  disable_web_page_preview: boolean;
  reply_markup: {
    inline_keyboard: { text: string; callback_data: string; }[][];
  };
  reply_to_message_id?: number;
}

async function sendHelpMessage(ctx, isEditing, db) {
  const { Strings } = await getUserAndStrings(ctx, db);
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
          [{ text: Strings.ytDownload.helpEntry, callback_data: 'helpYouTube' }, { text: Strings.ponyApi.helpEntry, callback_data: 'helpMLP' }],
          [{ text: Strings.ai.helpEntry, callback_data: 'helpAi' }]
        ]
      }
    };
    if (includeReplyTo) {
      const messageId = getMessageId(ctx);
      if (messageId) {
        (options as any).reply_parameters = { message_id: messageId };
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

export default (bot, db) => {
  bot.help(spamwatchMiddleware, async (ctx) => {
    await sendHelpMessage(ctx, false, db);
  });

  bot.command("about", spamwatchMiddleware, async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const aboutMsg = Strings.botAbout.replace(/{sourceLink}/g, `${process.env.botSource}`);
    ctx.reply(aboutMsg, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  });

  const options = (Strings) => ({
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: Strings.varStrings.varBack, callback_data: 'helpBack' }],
      ]
    })
  });

  bot.action('helpMain', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.mainCommandsDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpUseful', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.usefulCommandsDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpInteractive', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.interactiveEmojisDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpFunny', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.funnyCommandsDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpLast', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.lastFm.helpDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpYouTube', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.ytDownload.helpDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpAnimals', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.animalCommandsDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpMLP', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.ponyApi.helpDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpAi', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const helpText = isAdmin(ctx) ? Strings.ai.helpDescAdmin : Strings.ai.helpDesc;
    await ctx.editMessageText(helpText, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpBack', async (ctx) => {
    await sendHelpMessage(ctx, true, db);
    await ctx.answerCbQuery();
  });
}
