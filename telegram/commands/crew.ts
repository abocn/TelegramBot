import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import os from 'os';
import { exec } from 'child_process';
import { error } from 'console';
import { Context, Telegraf } from 'telegraf';
import * as schema from '../../database/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserAndStrings(ctx: Context, db?: NodePgDatabase<typeof schema>): Promise<{ Strings: any, languageCode: string }> {
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
  if (from.language_code && languageCode === 'en') {
    languageCode = from.language_code;
    console.warn('[WARN !] Falling back to Telegram language_code for user', from.id);
  }
  const Strings = getStrings(languageCode);
  return { Strings, languageCode };
}

function getGitCommitHash() {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --short HEAD', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function updateBot() {
  return new Promise((resolve, reject) => {
    exec('git pull && echo "A" >> restart.txt', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function formatUptime(uptime: number) {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getSystemInfo() {
  const { platform, release, arch, cpus, totalmem, freemem, loadavg, uptime } = os;
  const [cpu] = cpus();
  return `*Server Stats*\n\n` +
    `*OS:* \`${platform()} ${release()}\`\n` +
    `*Arch:* \`${arch()}\`\n` +
    `*Node.js Version:* \`${process.version}\`\n` +
    `*CPU:* \`${cpu.model}\`\n` +
    `*CPU Cores:* \`${cpus().length} cores\`\n` +
    `*RAM:* \`${(freemem() / (1024 ** 3)).toFixed(2)} GB / ${(totalmem() / (1024 ** 3)).toFixed(2)} GB\`\n` +
    `*Load Average:* \`${loadavg().map(avg => avg.toFixed(2)).join(', ')}\`\n` +
    `*Uptime:* \`${formatUptime(uptime())}\`\n\n`;
}

async function handleAdminCommand(ctx: Context & { message: { text: string } }, action: () => Promise<void>, successMessage: string, errorMessage: string) {
  const { Strings } = await getUserAndStrings(ctx);
  const userId = ctx.from?.id;
  const adminArray = process.env.botAdmins ? process.env.botAdmins.split(',').map(id => parseInt(id.trim())) : [];
  if (userId && adminArray.includes(userId)) {
    try {
      await action();
      if (successMessage) {
        ctx.reply(successMessage, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }
    } catch (error) {
      ctx.reply(errorMessage.replace(/{error}/g, error.message), {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    }
  } else {
    ctx.reply(Strings.noPermission, {
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  }
}

export default (bot: Telegraf<Context>, db) => {
  bot.command('getbotstats', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    handleAdminCommand(ctx, async () => {
      const stats = getSystemInfo();
      await ctx.reply(stats, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    }, '', Strings.errorRetrievingStats);
  });

  bot.command('getbotcommit', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    handleAdminCommand(ctx, async () => {
      try {
        const commitHash = await getGitCommitHash();
        await ctx.reply(Strings.gitCurrentCommit.replace(/{commitHash}/g, commitHash), {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      } catch (error) {
        ctx.reply(Strings.gitErrRetrievingCommit.replace(/{error}/g, error), {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }
    }, '', Strings.gitErrRetrievingCommit);
  });

  bot.command('updatebot', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    handleAdminCommand(ctx, async () => {
      try {
        const result = await updateBot();
        await ctx.reply(Strings.botUpdated.replace(/{result}/g, result), {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      } catch (error) {
        ctx.reply(Strings.errorUpdatingBot.replace(/{error}/g, error), {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }
    }, '', Strings.errorUpdatingBot);
  });

  bot.command('setbotname', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const botName = ctx.message.text.split(' ').slice(1).join(' ');
    handleAdminCommand(ctx, async () => {
      await ctx.telegram.setMyName(botName);
    }, Strings.botNameChanged.replace(/{botName}/g, botName), Strings.botNameErr.replace(/{error}/g, error));
  });

  bot.command('setbotdesc', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const botDesc = ctx.message.text.split(' ').slice(1).join(' ');
    handleAdminCommand(ctx, async () => {
      await ctx.telegram.setMyDescription(botDesc);
    }, Strings.botDescChanged.replace(/{botDesc}/g, botDesc), Strings.botDescErr.replace(/{error}/g, error));
  });

  bot.command('botkickme', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    handleAdminCommand(ctx, async () => {
      if (!ctx.chat) {
        ctx.reply(Strings.chatNotFound, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
        return;
      }
      ctx.reply(Strings.kickingMyself, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
      await ctx.telegram.leaveChat(ctx.chat.id);
    }, '', Strings.kickingMyselfErr);
  });

  bot.command('getfile', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    const botFile = ctx.message.text.split(' ').slice(1).join(' ');

    if (!botFile) {
      ctx.reply(Strings.noFileProvided, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
      return;
    }

    handleAdminCommand(ctx, async () => {
      try {
        await ctx.replyWithDocument({
          // @ts-ignore
          source: botFile,
          caption: botFile
        }, {
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      } catch (error) {
        ctx.reply(Strings.unexpectedErr.replace(/{error}/g, error.message), {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }
    }, '', Strings.unexpectedErr);
  });

  bot.command('run', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const command = ctx.message.text.split(' ').slice(1).join(' ');
    handleAdminCommand(ctx, async () => {
      if (!command) {
        ctx.reply('Por favor, forneça um comando para executar.');
        return;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          return ctx.reply(`\`${error.message}\``, {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
        }
        if (stderr) {
          return ctx.reply(`\`${stderr}\``, {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
        }
        ctx.reply(`\`${stdout}\``, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      });
    }, '', "Nope!");
  });

  bot.command('eval', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const code = ctx.message.text.split(' ').slice(1).join(' ');
    if (!code) {
      return ctx.reply('Por favor, forneça um código para avaliar.');
    }

    try {
      const result = eval(code);
      ctx.reply(`Result: ${result}`, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    } catch (error) {
      ctx.reply(`Error: ${error.message}`, {
        parse_mode: 'Markdown',
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    }
  });

  bot.command('crash', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    handleAdminCommand(ctx, async () => {
      ctx.reply('Crashed!');
    }, '', "Nope!");
  });
};
