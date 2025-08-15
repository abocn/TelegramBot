import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import os from 'os';
import { exec } from 'child_process';
import { Context, Telegraf } from 'telegraf';
import { trackCommand } from '../utils/track-command';
import { isCommandDisabled } from '../utils/check-command-disabled';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getGitCommitHash() {
  try {
    if (process.env.DOCKER_ENV === 'true') {
      const fs = await import('fs/promises');
      const commitHash = await fs.readFile('/usr/src/app/.git-commit', 'utf-8');
      return commitHash.trim();
    }

    return await new Promise((resolve, reject) => {
      exec('git rev-parse --short HEAD', (error, stdout, stderr) => {
        if (error) {
          reject(`Git not available: ${stderr || error.message}`);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  } catch (error) {
    return 'unknown';
  }
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

async function handleAdminCommand(ctx: Context & { message: { text: string } }, action: () => Promise<void>, successMessage: string, errorMessage: string, db: NodePgDatabase<typeof schema>) {
  const { Strings } = await getUserAndStrings(ctx, db);
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

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command('getbotstats', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'admin-stats')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      await handleAdminCommand(ctx, async () => {
        const stats = getSystemInfo();
        await ctx.reply(stats, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      }, '', Strings.errorRetrievingStats, db);

      await trackCommand(db, ctx, 'getbotstats', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'getbotstats', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('getbotcommit', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'admin-commit')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      await handleAdminCommand(ctx, async () => {
        try {
          const commitHash = await getGitCommitHash();
          await ctx.reply(Strings.gitCurrentCommit.replace(/{commitHash}/g, commitHash), {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
        } catch (error) {
          await ctx.reply(Strings.gitErrRetrievingCommit.replace(/{error}/g, error), {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
        }
      }, '', Strings.gitErrRetrievingCommit, db);

      await trackCommand(db, ctx, 'getbotcommit', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'getbotcommit', false, error.message, startTime);
      throw error;
    }
  });


  bot.command('setbotname', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'admin-config')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const botName = ctx.message.text.split(' ').slice(1).join(' ');
      await handleAdminCommand(ctx, async () => {
        await ctx.telegram.setMyName(botName);
      }, Strings.botNameChanged.replace(/{botName}/g, botName), Strings.botNameErr, db);

      await trackCommand(db, ctx, 'setbotname', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'setbotname', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('setbotdesc', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'admin-config')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const botDesc = ctx.message.text.split(' ').slice(1).join(' ');
      await handleAdminCommand(ctx, async () => {
        await ctx.telegram.setMyDescription(botDesc);
      }, Strings.botDescChanged.replace(/{botDesc}/g, botDesc), Strings.botDescErr, db);

      await trackCommand(db, ctx, 'setbotdesc', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'setbotdesc', false, error.message, startTime);
      throw error;
    }
  });

  bot.command('botkickme', spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'admin-leave')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      await handleAdminCommand(ctx, async () => {
        if (!ctx.chat) {
          await ctx.reply(Strings.chatNotFound, {
            parse_mode: 'Markdown',
            ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
          });
          return;
        }
        await ctx.reply(Strings.kickingMyself, {
          parse_mode: 'Markdown',
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
        await ctx.telegram.leaveChat(ctx.chat.id);
      }, Strings.kickedMyself, Strings.kickMyselfErr, db);

      await trackCommand(db, ctx, 'botkickme', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'botkickme', false, error.message, startTime);
      throw error;
    }
  });
};