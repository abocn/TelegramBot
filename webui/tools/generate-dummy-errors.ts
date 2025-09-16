import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/schema";
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.databaseUrl,
});

const db = drizzle(pool, { schema });

const errorTypes = [
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'RangeError',
  'NetworkError',
  'DatabaseError',
  'AuthenticationError',
  'ValidationError',
  'TimeoutError',
  'PermissionError'
];

const errorMessages = [
  'Cannot read property of undefined',
  'Connection timed out',
  'Invalid user credentials',
  'Database connection failed',
  'Rate limit exceeded',
  'Insufficient permissions',
  'Invalid input format',
  'Resource not found',
  'Server internal error',
  'Memory limit exceeded',
  'Invalid API response',
  'File upload failed',
  'Session expired',
  'Token validation failed',
  'Query execution failed',
  'Cache miss error',
  'Webhook delivery failed',
  'Message sending failed',
  'User not found',
  'Command execution failed'
];

const commandNames = [
  'start',
  'help',
  'settings',
  'ai',
  'wiki',
  'translate',
  'weather',
  'news',
  'stats',
  'export',
  'import',
  'search',
  'notify',
  'schedule',
  'reminder',
  'poll',
  'game',
  'music',
  'video',
  'image'
];

const chatTypes = ['private', 'group', 'supergroup', 'channel'];

const telegramMethods = [
  'sendMessage',
  'sendPhoto',
  'sendDocument',
  'sendVideo',
  'sendAudio',
  'editMessageText',
  'deleteMessage',
  'getMe',
  'getChat',
  'getChatMember',
  'setChatPermissions',
  'answerCallbackQuery',
  'sendPoll',
  'sendVoice',
  'sendLocation'
];

const telegramErrorCodes = [400, 401, 403, 404, 429, 500, 502, 503];

const telegramDescriptions = [
  'Bad Request: message text is empty',
  'Unauthorized: bot token is invalid',
  'Forbidden: bot was kicked from the group chat',
  'Not Found: chat not found',
  'Too Many Requests: retry after 30 seconds',
  'Internal Server Error',
  'Bad Gateway',
  'Service Unavailable',
  'Bad Request: message to edit not found',
  'Bad Request: message can\'t be deleted',
  'Bad Request: poll has already been closed',
  'Bad Request: file is too big',
  'Bad Request: wrong file identifier',
  'Forbidden: user is deactivated',
  'Bad Request: invalid user ID'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

function getRandomSeverity(): 'info' | 'warning' | 'error' | 'critical' {
  const rand = Math.random();
  if (rand < 0.2) return 'info';
  if (rand < 0.45) return 'warning';
  if (rand < 0.85) return 'error';
  return 'critical';
}

function generateStackTrace(errorType: string, errorMessage: string): string {
  const functions = [
    'at processTicksAndRejections (node:internal/process/task_queues:96:5)',
    'at async handleCommand (/app/telegram/bot.ts:145:13)',
    'at async MessageHandler.handle (/app/telegram/handlers/message.ts:78:9)',
    'at async Bot.processUpdate (/app/node_modules/telegraf/bot.ts:234:17)',
    'at async middleware (/app/telegram/middleware/error.ts:45:5)',
    'at async Database.query (/app/database/client.ts:112:11)',
    'at async Redis.get (/app/cache/redis.ts:34:7)',
    'at async ApiClient.request (/app/api/client.ts:89:15)'
  ];
  
  const stack = [`${errorType}: ${errorMessage}`];
  const numLines = Math.floor(Math.random() * 4) + 3;
  
  for (let i = 0; i < numLines; i++) {
    stack.push(getRandomElement(functions));
  }
  
  return stack.join('\n    ');
}

async function generateBotErrors(count: number) {
  const errors = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  for (let i = 0; i < count; i++) {
    const errorType = getRandomElement(errorTypes);
    const errorMessage = getRandomElement(errorMessages);
    const severity = getRandomSeverity();
    const isResolved = Math.random() < 0.3;
    const createdAt = getRandomDate(startDate, endDate);
    
    const error = {
      id: uuidv4(),
      errorType,
      errorMessage: `${errorMessage} in ${getRandomElement(commandNames)} command`,
      errorStack: Math.random() < 0.7 ? generateStackTrace(errorType, errorMessage) : null,
      commandName: Math.random() < 0.8 ? getRandomElement(commandNames) : null,
      chatType: Math.random() < 0.9 ? getRandomElement(chatTypes) : null,
      severity,
      resolved: isResolved,
      createdAt,
      resolvedAt: isResolved ? getRandomDate(createdAt, endDate) : null
    };
    
    errors.push(error);
  }
  
  return errors;
}

async function generateTelegramErrors(count: number) {
  const errors = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  for (let i = 0; i < count; i++) {
    const isResolved = Math.random() < 0.25;
    const createdAt = getRandomDate(startDate, endDate);
    const retryCount = Math.floor(Math.random() * 5);
    
    const error = {
      id: `tg_${uuidv4()}`,
      errorCode: Math.random() < 0.9 ? getRandomElement(telegramErrorCodes) : null,
      errorDescription: getRandomElement(telegramDescriptions),
      method: Math.random() < 0.85 ? getRandomElement(telegramMethods) : null,
      parameters: Math.random() < 0.5 ? JSON.stringify({
        chat_id: Math.floor(Math.random() * 1000000),
        text: 'Sample message',
        parse_mode: 'Markdown'
      }) : null,
      retryCount,
      resolved: isResolved,
      createdAt,
      lastRetryAt: retryCount > 0 ? getRandomDate(createdAt, endDate) : null
    };

    errors.push(error);
  }

  return errors;
}

async function generateCommandUsageEntries(count: number) {
  const entries = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  for (let i = 0; i < count; i++) {
    const isError = Math.random() < 0.3;
    const commandName = getRandomElement(commandNames);
    const createdAt = getRandomDate(startDate, endDate);
    
    const entry = {
      id: uuidv4(),
      commandName,
      chatType: getRandomElement(chatTypes),
      isSuccess: !isError,
      errorMessage: isError ? getRandomElement(errorMessages) : null,
      executionTime: Math.floor(Math.random() * 500) + 50,
      createdAt
    };
    
    entries.push(entry);
  }
  
  return entries;
}

async function insertErrors() {
  try {
    console.log('🚀 Starting dummy error generation...\n');
    
    const botErrorCount = parseInt(process.argv[2]) || 50;
    const telegramErrorCount = parseInt(process.argv[3]) || 30;
    const commandUsageCount = parseInt(process.argv[4]) || 100;
    
    console.log(`📝 Generating ${botErrorCount} bot errors...`);
    const botErrors = await generateBotErrors(botErrorCount);
    
    console.log(`📝 Generating ${telegramErrorCount} Telegram errors...`);
    const telegramErrors = await generateTelegramErrors(telegramErrorCount);
    
    console.log(`📝 Generating ${commandUsageCount} command usage entries...`);
    const commandUsageEntries = await generateCommandUsageEntries(commandUsageCount);
    
    console.log('\n💾 Inserting bot errors into database...');
    for (const error of botErrors) {
      await db.insert(schema.botErrorsTable).values(error);
    }
    console.log(`✅ Inserted ${botErrors.length} bot errors`);
    
    console.log('\n💾 Inserting Telegram errors into database...');
    for (const error of telegramErrors) {
      const { id, ...errorData } = error;
      await db.insert(schema.telegramErrorsTable).values({
        ...errorData,
        id: id.replace('tg_', '')
      });
    }
    console.log(`✅ Inserted ${telegramErrors.length} Telegram errors`);
    
    console.log('\n💾 Inserting command usage entries into database...');
    for (const entry of commandUsageEntries) {
      await db.insert(schema.commandUsageTable).values(entry);
    }
    console.log(`✅ Inserted ${commandUsageEntries.length} command usage entries`);
    
    const resolvedBotErrors = botErrors.filter(e => e.resolved).length;
    const unresolvedBotErrors = botErrors.filter(e => !e.resolved).length;
    const resolvedTelegramErrors = telegramErrors.filter(e => e.resolved).length;
    const unresolvedTelegramErrors = telegramErrors.filter(e => !e.resolved).length;
    
    const failedCommands = commandUsageEntries.filter(e => !e.isSuccess).length;
    const successfulCommands = commandUsageEntries.filter(e => e.isSuccess).length;
    
    console.log('\n📊 Summary:');
    console.log('─────────────────────────────────');
    console.log(`Bot Errors:`);
    console.log(`  • Total: ${botErrors.length}`);
    console.log(`  • Resolved: ${resolvedBotErrors}`);
    console.log(`  • Unresolved: ${unresolvedBotErrors}`);
    console.log(`  • Severities:`);
    console.log(`    - Critical: ${botErrors.filter(e => e.severity === 'critical').length}`);
    console.log(`    - Error: ${botErrors.filter(e => e.severity === 'error').length}`);
    console.log(`    - Warning: ${botErrors.filter(e => e.severity === 'warning').length}`);
    console.log(`    - Info: ${botErrors.filter(e => e.severity === 'info').length}`);
    console.log(`\nTelegram Errors:`);
    console.log(`  • Total: ${telegramErrors.length}`);
    console.log(`  • Resolved: ${resolvedTelegramErrors}`);
    console.log(`  • Unresolved: ${unresolvedTelegramErrors}`);
    console.log(`\nCommand Usage:`);
    console.log(`  • Total: ${commandUsageEntries.length}`);
    console.log(`  • Failed: ${failedCommands} (${((failedCommands/commandUsageEntries.length)*100).toFixed(1)}%)`);
    console.log(`  • Successful: ${successfulCommands}`);
    
    console.log('\n✨ Done! Check the Error Review page in the WebUI to see the generated errors.');
    
  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (import.meta.main) {
  insertErrors();
}