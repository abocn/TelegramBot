const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { isOnSpamWatch } = require('./plugins/lib-spamwatch/spamwatch.js');
require('@dotenvx/dotenvx').config({ path: "config.env" });
require('./plugins/ytdlp-wrapper.js');
// require('./plugins/termlogger.js');

// Ensures bot token is set, and not default value
if (!process.env.botToken || process.env.botToken === 'InsertYourBotTokenHere') {
  console.error('Bot token is not set. Please set the bot token in the config.env file.')
  process.exit(1)
}

const bot = new Telegraf(process.env.botToken);
const maxRetries = process.env.maxRetries || 5;
let restartCount = 0;

const loadCommands = () => {
  const commandsPath = path.join(__dirname, 'commands');

  try {
    const files = fs.readdirSync(commandsPath);
    files.forEach((file) => {
      try {
        const command = require(path.join(commandsPath, file));
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
    if (restartCount < maxRetries) {
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
