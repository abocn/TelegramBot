import { Telegraf } from 'telegraf';
import path from 'path';
import fs from 'fs';
import { isSpamwatchConnected } from './spamwatch/spamwatch';
import '@dotenvx/dotenvx';
import 'dotenv/config';
import './plugins/ytDlpWrapper';
import { preChecks } from './commands/ai';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../database/schema';
import { ensureUserInDb } from './utils/ensure-user';
import { getSpamwatchBlockedCount } from './spamwatch/spamwatch';
import { startServer } from './api/server';

(async function main() {
  const { botToken, handlerTimeout, maxRetries, databaseUrl, ollamaEnabled } = process.env;
  if (!botToken || botToken === 'InsertYourBotTokenHere') {
    console.error('Bot token is not set. Please set the bot token in the .env file.');
    process.exit(1);
  }

  if (ollamaEnabled === "true") {
    if (!(await preChecks())) {
      process.exit(1);
    }
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const db = drizzle(client, { schema });

  const bot = new Telegraf(
    botToken,
    { handlerTimeout: Number(handlerTimeout) || 600_000 }
  );
  const maxRetriesNum = Number(maxRetries) || 5;
  let restartCount = 0;

  bot.use(async (ctx, next) => {
    await ensureUserInDb(ctx, db);
    return next();
  });

  function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    let loadedCount = 0;
    try {
      const files = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.ts'));
      files.forEach((file) => {
        try {
          const commandPath = path.join(commandsPath, file);
          const command = require(commandPath).default || require(commandPath);
          if (typeof command === 'function') {
            command(bot, db);
            loadedCount++;
          }
        } catch (error) {
          console.error(`Failed to load command file ${file}: ${error.message}`);
        }
      });
      console.log(`[🤖 BOT] Loaded ${loadedCount} commands.`);
    } catch (error) {
      console.error(`Failed to read commands directory: ${error.message}`);
    }
  }

  async function startBot() {
    try {
      const botInfo = await bot.telegram.getMe();
      console.log(`${botInfo.first_name} is running...`);
      await bot.launch();
      restartCount = 0;
    } catch (error) {
      console.error('Failed to start bot:', error.message);
      if (restartCount < maxRetriesNum) {
        restartCount++;
        console.log(`Retrying to start bot... Attempt ${restartCount}`);
        setTimeout(startBot, 5000);
      } else {
        console.error('Maximum retry attempts reached. Exiting.');
        process.exit(1);
      }
    }
  }

  function handleShutdown(signal: string) {
    console.log(`Received ${signal}. Stopping bot...`);
    bot.stop(signal);
    process.exit(0);
  }

  process.once('SIGINT', () => handleShutdown('SIGINT'));
  process.once('SIGTERM', () => handleShutdown('SIGTERM'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    console.error(error.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  async function testDbConnection() {
    try {
      await db.query.usersTable.findMany({ limit: 1 });
      const users = await db.query.usersTable.findMany({});
      const userCount = users.length;
      console.log(`[💽  DB] Connected [${userCount} users]`);
    } catch (err) {
      console.error('[💽  DB] Failed to connect:', err);
      process.exit(1);
    }
  }

  await testDbConnection();

  if (isSpamwatchConnected()) {
    const blockedCount = getSpamwatchBlockedCount();
    // the 3 spaces are intentional
    console.log(`[🛡️   SW] Connected [${blockedCount} blocked]`);
  } else {
    console.log('[🛡️   SW] Not connected or blocklist empty');
  }

  loadCommands();
  startServer();
  startBot();
})();
