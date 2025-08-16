import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import type { Context } from 'telegraf';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

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

function parseCommandsFromString(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const commands: string[] = [];

  for (const line of lines) {
    const match = line.match(/^-\s*\/([^\s:]+(?:\s*\|\s*\/[^\s:]+)*)[^:]*:\s*(.+)/);
    if (match) {
      const [, cmdList, description] = match;
      const mainCmd = cmdList.split('|')[0].trim();
      const cleanDesc = description.replace(/`[^`]*`/g, '').replace(/\*([^*]+)\*/g, '$1').replace(/Example:.*/i, '').trim();
      commands.push(`/${mainCmd} - ${cleanDesc}`);
    }
  }

  return commands;
}

async function sendVerboseHelp(ctx, db: NodePgDatabase<typeof schema>) {
  const { Strings } = await getUserAndStrings(ctx, db);
  const isAdminUser = isAdmin(ctx);

  const allCommands: string[] = [];

  allCommands.push(...parseCommandsFromString(Strings.mainCommandsDesc));
  allCommands.push(...parseCommandsFromString(Strings.usefulCommandsDesc));
  allCommands.push(...parseCommandsFromString(Strings.funnyCommandsDesc));
  allCommands.push(...parseCommandsFromString(Strings.interactiveEmojisDesc));
  allCommands.push(...parseCommandsFromString(Strings.animalCommandsDesc));
  allCommands.push(...parseCommandsFromString(Strings.lastFm.helpDesc));
  allCommands.push(...parseCommandsFromString(Strings.ytDownload.helpDesc));
  allCommands.push(...parseCommandsFromString(Strings.ponyApi.helpDesc));
  allCommands.push(...parseCommandsFromString(Strings.wiki.helpDesc));
  allCommands.push(...parseCommandsFromString(Strings.quote.helpDesc));
  allCommands.push(...parseCommandsFromString(isAdminUser ? Strings.ai.helpDescAdmin : Strings.ai.helpDesc));

  if (isAdminUser) {
    allCommands.push(...parseCommandsFromString(Strings.adminSettingsDesc));
  }

  const verboseText = `\`\`\`\n${allCommands.join('\n')}\n\`\`\``;

  await ctx.reply(verboseText, {
    parse_mode: 'Markdown',
    ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
  });
}

async function sendHelpMessage(ctx, isEditing, db: NodePgDatabase<typeof schema>) {
  const { Strings } = await getUserAndStrings(ctx, db);
  const botInfo = await ctx.telegram.getMe();
  const helpText = Strings.botHelp
    .replace(/{botName}/g, botInfo.first_name)
    .replace(/{sourceLink}/g, process.env.botSource);
  const isAdminUser = isAdmin(ctx);
  function getMessageId(ctx) {
    return ctx.message?.message_id || ctx.callbackQuery?.message?.message_id;
  };
  const createOptions = (ctx, includeReplyTo = false): MessageOptions => {
    const keyboard = [
      [{
        text: Strings.mainCommands,
        callback_data: 'helpMain'
      }, {
        text: Strings.usefulCommands,
        callback_data: 'helpUseful'
      }],
      [{
        text: Strings.interactiveEmojis,
        callback_data: 'helpInteractive'
      }, {
        text: Strings.funnyCommands,
        callback_data: 'helpFunny' }
      ],
      [{
        text: Strings.lastFm.helpEntry,
        callback_data: 'helpLast' },
        {
          text: Strings.animalCommands,
          callback_data: 'helpAnimals'
        }
      ],
      [{
        text: Strings.ytDownload.helpEntry,
        callback_data: 'helpYouTube'
      },
      {
        text: Strings.ponyApi.helpEntry,
        callback_data: 'helpMLP'
      }],
      [{
        text: Strings.wiki.helpEntry,
        callback_data: 'helpWiki'
      },
      {
        text: Strings.quote.helpEntry,
        callback_data: 'helpQuotes'
      }],
      [{
        text: Strings.ai.helpEntry,
        callback_data: 'helpAi'
      }]
    ];

    if (isAdminUser) {
      keyboard.push([{
        text: Strings.adminSettings,
        callback_data: 'helpAdmin'
      }]);
    }

    const options: MessageOptions = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: keyboard
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

export default (bot, db: NodePgDatabase<typeof schema>) => {
  bot.help(spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    try {
      const args = ctx.message?.text?.split(' ').slice(1) || [];
      if (args[0] === 'verbose') {
        await sendVerboseHelp(ctx, db);
      } else {
        await sendHelpMessage(ctx, false, db);
      }

      await trackCommand(db, ctx, 'help', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'help', false, error.message, startTime);
      throw error;
    }
  });

  bot.command("about", spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const aboutMsg = Strings.botAbout.replace(/{sourceLink}/g, `${process.env.botSource}`);
      await ctx.reply(aboutMsg, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });

      await trackCommand(db, ctx, 'about', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'about', false, error.message, startTime);
      throw error;
    }
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
  bot.action('helpWiki', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.wiki.helpDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpQuotes', async (ctx) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.quote.helpDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpAdmin', async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCbQuery('You do not have permission to view this.');
      return;
    }
    const { Strings } = await getUserAndStrings(ctx, db);
    await ctx.editMessageText(Strings.adminSettingsDesc, options(Strings));
    await ctx.answerCbQuery();
  });
  bot.action('helpBack', async (ctx) => {
    await sendHelpMessage(ctx, true, db);
    await ctx.answerCbQuery();
  });
}
