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
import { createClient } from 'redis';
import { syncAdminStatus } from './utils/sync-admin-status';

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

  async function connectToDatabase(): Promise<{ client: Client; db: any }> {
    const maxDbRetries = Number(maxRetries) || 5;
    let retryCount = 0;

    while (retryCount < maxDbRetries) {
      try {
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();
        const db = drizzle(client, { schema });
        console.log('[💽  DB] Initial connection successful');
        return { client, db };
      } catch (error) {
        retryCount++;
        console.error(`[💽  DB] Connection attempt ${retryCount} failed:`, error.message);
        if (retryCount < maxDbRetries) {
          console.log(`[🔄  DB] Retrying in 5 seconds... (attempt ${retryCount}/${maxDbRetries})`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error('[💽  DB] Maximum retry attempts reached. Exiting.');
          process.exit(1);
        }
      }
    }

    // should not be reached
    throw new Error('Database connection failed');
  }

  const { db } = await connectToDatabase();

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

  async function testValkeyConnection() {
    const { valkeyBaseUrl, valkeyPort } = process.env;
    if (!valkeyBaseUrl || !valkeyPort) {
      let baseMsg = '[🔴  VK] Please set your Valkey ';
      if (!valkeyBaseUrl && !valkeyPort) {
        baseMsg += "base URL and port in .env";
      } else if (!valkeyBaseUrl) {
        baseMsg += "base URL in .env";
      } else {
        baseMsg += "port in .env";
      }
      console.error(baseMsg);
      process.exit(1);
    }
    const valkeyUrl = `redis://${valkeyBaseUrl}:${valkeyPort}`;
    const maxValkeyRetries = Number(maxRetries) || 5;
    let retryCount = 0;

    while (retryCount < maxValkeyRetries) {
      try {
        const client = createClient({ url: valkeyUrl });
        await client.connect();
        await client.ping();
        console.log('[🟢  VK] Connected to Valkey');
        await client.destroy();
        break;
      } catch (err) {
        retryCount++;
        console.error(`[🔴  VK] Connection attempt ${retryCount} failed:`, err.message);
        if (retryCount < maxValkeyRetries) {
          console.log(`[🔄  VK] Retrying in 5 seconds... (attempt ${retryCount}/${maxValkeyRetries})`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error('[🔴  VK] Maximum retry attempts reached. Exiting.');
          process.exit(1);
        }
      }
    }
  }

  async function testDbConnection() {
    while (true) {
      try {
        await db.query.usersTable.findMany({ limit: 1 });
        const users = await db.query.usersTable.findMany({});
        const userCount = users.length;
        console.log(`[💽  DB] Connected [${userCount} users]`);
        break;
      } catch (err) {
        console.error('[💽  DB] Failed to connect:', err.message);
        console.log('[🔄  DB] Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  await testValkeyConnection();
  await testDbConnection();
  await syncAdminStatus(db);

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
