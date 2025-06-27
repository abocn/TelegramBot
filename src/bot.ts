import { Telegraf } from 'telegraf';
import path from 'path';
import fs from 'fs';
import { isOnSpamWatch } from './spamwatch/spamwatch';
import '@dotenvx/dotenvx';
import './plugins/ytDlpWrapper';
import { preChecks } from './commands/ai';

// Ensures bot token is set, and not default value
if (!process.env.botToken || process.env.botToken === 'InsertYourBotTokenHere') {
  console.error('Bot token is not set. Please set the bot token in the .env file.')
  process.exit(1)
}

// Detect AI and run pre-checks
if (process.env.ollamaEnabled === "true") {
  if (!(await preChecks())) {
    process.exit(1)
  }
}

const bot = new Telegraf(
  process.env.botToken,
  { handlerTimeout: Number(process.env.handlerTimeout) || 600_000 }
);
const maxRetries = process.env.maxRetries || 5;
let restartCount = 0;

const loadCommands = () => {
  const commandsPath = path.join(__dirname, 'commands');

  try {
    const files = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    files.forEach((file) => {
      try {
        const commandPath = path.join(commandsPath, file);
        const command = require(commandPath).default || require(commandPath);
        if (typeof command === 'function') {
          command(bot, isOnSpamWatch);
        }
      } catch (error) {
        console.error(`Failed to load command file ${file}: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`Failed to read commands directory: ${error.message}`);
  }
};

const startBot = async () => {
  const botInfo = await bot.telegram.getMe();
  console.log(`${botInfo.first_name} is running...`);
  try {
    await bot.launch();
    restartCount = 0;
  } catch (error) {
    console.error('Failed to start bot:', error.message);
    if (restartCount < Number(maxRetries)) {
      restartCount++;
      console.log(`Retrying to start bot... Attempt ${restartCount}`);
      setTimeout(startBot, 5000);
    } else {
      console.error('Maximum retry attempts reached. Exiting.');
      process.exit(1);
    }
  }
};

const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Stopping bot...`);
  bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => handleShutdown('SIGINT'));
process.once('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

loadCommands();
startBot();
