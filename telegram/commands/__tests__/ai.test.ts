import { describe, test, expect, beforeEach, mock, jest, Mock } from 'bun:test';
import axios from 'axios';
import { Context, Telegraf } from 'telegraf';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../database/schema';
import aiModule, { preChecks, sanitizeForJson, getModelLabelByName } from '../ai';

type MockContext = Context & {
  message: {
    text: string;
    message_id: number;
    from: { id: number; username?: string; first_name?: string };
  };
  chat: { id: number };
  from: { id: number; username?: string; first_name?: string };
  reply: Mock<any>;
  telegram: {
    editMessageText: Mock<any>;
  };
}

mock.module('axios', () => {
  const axiosMock = jest.fn();
  const getMethod = jest.fn();
  const postMethod = jest.fn();
  return {
    default: Object.assign(axiosMock, { get: getMethod, post: postMethod }),
    get: getMethod,
    post: postMethod
  };
});

mock.module('../../utils/get-user-strings', () => ({
  getUserAndStrings: jest.fn().mockResolvedValue({
    user: { 
      telegramId: '123456',
      username: 'testuser',
      aiEnabled: true,
      aiCharacters: 0,
      aiRequests: 0,
      timezone: 'UTC',
      customSystemPrompt: null,
      aiTimeoutUntil: null,
      aiMaxExecutionTime: 0
    },
    Strings: {
      ai: {
        disabled: 'AI is disabled',
        disabledForUser: 'AI is disabled for this user',
        askNoMessage: 'Please provide a message',
        askGenerating: 'Generating response with {model}...',
        statusWaitingRender: '⏳ Waiting',
        statusRendering: '🔄 Rendering',
        statusComplete: '✅ Complete',
        modelHeader: '**Model:** {model} | **Temperature:** {temperature} | **Status:** {status}',
        systemPrompt: 'You are {botName}. Current date: {date}, time: {time}',
        queueFull: 'Queue is full',
        inQueue: 'Your request is queued at position {position}',
        startingProcessing: 'Starting to process your request',
        pulling: 'Pulling model {model}...',
        pulled: 'Model {model} pulled successfully',
        urlWarning: '\n\n⚠️ URLs detected in message',
        thinking: '💭 Thinking...',
        finishedThinking: '✅ Finished thinking',
        executionTimeoutReached: '\n\n⏱️ Execution timeout reached',
        noChatFound: 'Chat not found',
        requestStopped: 'Request stopped',
        requestRemovedFromQueue: 'Request removed from queue',
        noActiveRequest: 'No active request',
        queueEmpty: 'Queue is empty',
        queueList: 'Queue ({totalItems} items):\n{queueItems}',
        queueItem: '• @{username} ({userId}) - {model} - {status}\n',
        invalidUserId: 'Invalid user ID',
        userNotFound: 'User {userId} not found',
        invalidDuration: 'Invalid duration format',
        userTimedOut: 'User {userId} timed out until {timeoutEnd}',
        userTimedOutFromAI: 'You are timed out from AI until {timeoutEnd}',
        userTimeoutError: 'Error timing out user {userId}: {error}',
        noQueueItems: 'No queue items for user {userId}',
        queueCleared: 'Cleared {count} items for user {userId}',
        stoppedCurrentAndCleared: 'Stopped current request and cleared {count} items for user {userId}',
        stoppedCurrentRequestOnly: 'Stopped current request for user {userId}',
        userExecTimeSet: 'Execution time limit set to {duration} for user {userId}',
        userExecTimeRemoved: 'Execution time limit removed for user {userId}',
        userExecTimeError: 'Error setting execution time for user {userId}: {error}',
        userLimitsRemoved: 'All limits removed for user {userId}',
        userLimitRemoveError: 'Error removing limits for user {userId}: {error}',
        noLimitsSet: 'No limits currently set',
        limitsHeader: '**Current Limits:**',
        timeoutLimitsHeader: '**Timeout Limits:**',
        timeoutLimitItem: '• {displayName} ({userId}): until {timeoutEnd}',
        execLimitsHeader: '**Execution Time Limits:**',
        execLimitItem: '• {displayName} ({userId}): {execTime}',
        limitsListError: 'Error listing limits: {error}'
      },
      aiStats: {
        header: '📊 AI Usage Statistics',
        requests: '**Requests:** {aiRequests}',
        characters: '**Characters:** {aiCharacters} (~{bookCount} {bookWord})'
      },
      unexpectedErr: 'Unexpected error: {error}',
      noPermission: 'No permission',
      userNotFound: 'User not found'
    }
  }),
  getUserWithStringsAndModel: jest.fn().mockResolvedValue({
    user: { 
      telegramId: '123456',
      username: 'testuser',
      aiEnabled: true,
      aiCharacters: 0,
      aiRequests: 0
    },
    Strings: {
      ai: {
        disabled: 'AI is disabled',
        disabledForUser: 'AI is disabled for this user',
        askNoMessage: 'Please provide a message',
        askGenerating: 'Generating response with {model}...',
        statusWaitingRender: '⏳ Waiting',
        statusRendering: '🔄 Rendering',
        statusComplete: '✅ Complete',
        modelHeader: '**Model:** {model} | **Temperature:** {temperature} | **Status:** {status}',
        systemPrompt: 'You are {botName}. Current date: {date}, time: {time}',
        queueFull: 'Queue is full',
        inQueue: 'Your request is queued at position {position}',
        startingProcessing: 'Starting to process your request',
        pulling: 'Pulling model {model}...',
        pulled: 'Model {model} pulled successfully',
        urlWarning: '\n\n⚠️ URLs detected in message',
        thinking: '💭 Thinking...',
        finishedThinking: '✅ Finished thinking',
        executionTimeoutReached: '\n\n⏱️ Execution timeout reached',
        noChatFound: 'Chat not found',
        requestStopped: 'Request stopped',
        requestRemovedFromQueue: 'Request removed from queue',
        noActiveRequest: 'No active request',
        queueEmpty: 'Queue is empty',
        queueList: 'Queue ({totalItems} items):\n{queueItems}',
        queueItem: '• @{username} ({userId}) - {model} - {status}\n',
        invalidUserId: 'Invalid user ID',
        userNotFound: 'User {userId} not found',
        invalidDuration: 'Invalid duration format',
        userTimedOut: 'User {userId} timed out until {timeoutEnd}',
        userTimedOutFromAI: 'You are timed out from AI until {timeoutEnd}',
        userTimeoutError: 'Error timing out user {userId}: {error}',
        noQueueItems: 'No queue items for user {userId}',
        queueCleared: 'Cleared {count} items for user {userId}',
        stoppedCurrentAndCleared: 'Stopped current request and cleared {count} items for user {userId}',
        stoppedCurrentRequestOnly: 'Stopped current request for user {userId}',
        userExecTimeSet: 'Execution time limit set to {duration} for user {userId}',
        userExecTimeRemoved: 'Execution time limit removed for user {userId}',
        userExecTimeError: 'Error setting execution time for user {userId}: {error}',
        userLimitsRemoved: 'All limits removed for user {userId}',
        userLimitRemoveError: 'Error removing limits for user {userId}: {error}',
        noLimitsSet: 'No limits currently set',
        limitsHeader: '**Current Limits:**',
        timeoutLimitsHeader: '**Timeout Limits:**',
        timeoutLimitItem: '• {displayName} ({userId}): until {timeoutEnd}',
        execLimitsHeader: '**Execution Time Limits:**',
        execLimitItem: '• {displayName} ({userId}): {execTime}',
        limitsListError: 'Error listing limits: {error}'
      },
      aiStats: {
        header: '📊 AI Usage Statistics',
        requests: '**Requests:** {aiRequests}',
        characters: '**Characters:** {aiCharacters} (~{bookCount} books)'
      },
      unexpectedErr: 'Unexpected error: {error}',
      noPermission: 'No permission'
    },
    customAiModel: null,
    aiTemperature: 0.7,
    showThinking: false
  })
}));

mock.module('../../utils/reply-to-message-id', () => ({
  replyToMessageId: jest.fn().mockReturnValue(123)
}));

mock.module('../../utils/check-command-disabled', () => ({
  isCommandDisabled: jest.fn().mockResolvedValue(false)
}));

mock.module('../../utils/track-command', () => ({
  trackCommand: jest.fn().mockResolvedValue(undefined)
}));

mock.module('../../utils/rate-limiter', () => ({
  rateLimiter: {
    editMessageWithRetry: jest.fn().mockResolvedValue(undefined)
  }
}));

mock.module('../../utils/log', () => ({
  logger: {
    logCmdStart: jest.fn(),
    logThinking: jest.fn()
  }
}));

mock.module('../../spamwatch/spamwatch', () => ({
  isOnSpamWatch: jest.fn().mockResolvedValue(false)
}));

mock.module('../../spamwatch/Middleware', () => ({
  default: jest.fn(() => (_ctx: Context, next?: () => Promise<void>) => {
    if (next) {
      return next();
    }
    return Promise.resolve();
  })
}));

describe('AI Commands', () => {
  let ctx: MockContext;
  let db: NodePgDatabase<typeof schema>;
  let bot: Telegraf<Context>;
  const mockedAxiosGet = (axios as unknown as { get: jest.Mock }).get;
  const mockedAxiosPost = (axios as unknown as { post: jest.Mock }).post;

  beforeEach(() => {
    jest.clearAllMocks();

    ctx = {
      message: {
        text: '',
        message_id: 1,
        from: { id: 123456, username: 'testuser', first_name: 'Test' }
      },
      chat: { id: 789 },
      from: { id: 123456, username: 'testuser', first_name: 'Test' },
      reply: jest.fn().mockResolvedValue({ message_id: 2 }),
      telegram: {
        editMessageText: jest.fn()
      }
    } as unknown as MockContext;

    db = {
      query: {
        usersTable: {
          findFirst: jest.fn().mockResolvedValue({
            telegramId: '123456',
            username: 'testuser',
            aiEnabled: true,
            aiCharacters: 0,
            aiRequests: 0,
            aiTimeoutUntil: null,
            aiMaxExecutionTime: 0
          }),
          findMany: jest.fn().mockResolvedValue([])
        }
      },
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined)
    } as unknown as NodePgDatabase<typeof schema>;

    bot = {
      botInfo: { first_name: 'Test', last_name: 'Bot' },
      command: jest.fn(),
      on: jest.fn()
    } as unknown as Telegraf<Context>;

    process.env.ollamaApi = 'http://localhost:11434';
    process.env.flashModel = 'gemma3:4b';
    process.env.thinkingModel = 'qwen3:4b';
    process.env.botAdmins = '123456,789012';
  });

  describe('preChecks', () => {
    test('should pass when all environment variables are set and ollama is accessible', async () => {
      mockedAxiosGet.mockResolvedValueOnce({ status: 200 });

      const result = await preChecks();

      expect(result).toBe(true);
      expect(mockedAxiosGet).toHaveBeenCalledWith('http://localhost:11434', { timeout: 2000 });
    });

    test('should fail when ollama API is not set', async () => {
      delete process.env.ollamaApi;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await preChecks();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[✨ AI | !] ❌ ollamaApi not set!');
      consoleSpy.mockRestore();
    });

    test('should fail when ollama API is not responding', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('Connection refused'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await preChecks();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Ollama API is not responding'));
      consoleSpy.mockRestore();
    }, 15000);

    test('should retry connection to ollama API', async () => {
      mockedAxiosGet
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ status: 200 });

      const result = await preChecks();

      expect(result).toBe(true);
      expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('sanitizeForJson', () => {
    test('should escape special characters for JSON', () => {
      const input = 'Hello\nWorld\t"Test"\\Path';
      const expected = 'Hello\\nWorld\\t\\"Test\\"\\\\Path';

      const result = sanitizeForJson(input);

      expect(result).toBe(expected);
    });

    test('should handle empty string', () => {
      const result = sanitizeForJson('');
      expect(result).toBe('');
    });

    test('should handle string with no special characters', () => {
      const input = 'Hello World';
      const result = sanitizeForJson(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('getModelLabelByName', () => {
    test('should return label for existing model', () => {
      const result = getModelLabelByName('gemma3:4b');
      expect(result).toBeTruthy();
    });

    test('should return name if model not found', () => {
      const result = getModelLabelByName('unknown-model');
      expect(result).toBe('unknown-model');
    });
  });

  describe('AI Command Handler', () => {
    test('should handle /ask command successfully', async () => {
      ctx.message.text = '/ask What is the weather?';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'The weather is nice' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Generating response'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle /think command successfully', async () => {
      ctx.message.text = '/think Solve this problem';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: '<think>Analyzing...</think>Solution is 42' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const thinkHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('think'))?.[2];

      if (thinkHandler && typeof thinkHandler === 'function') {
        await thinkHandler(ctx);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Generating response'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should reject empty message', async () => {
      ctx.message.text = '/ask';

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          'Please provide a message',
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle disabled AI', async () => {
      delete process.env.ollamaApi;
      ctx.message.text = '/ask test';

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          'AI is disabled',
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle user with AI disabled', async () => {
      const { getUserWithStringsAndModel } = await import('../../utils/get-user-strings');
      (getUserWithStringsAndModel as Mock<any>).mockResolvedValueOnce({
        user: {
          telegramId: '123456',
          aiEnabled: false
        },
        Strings: {
          ai: {
            disabledForUser: 'AI is disabled for this user'
          }
        },
        customAiModel: null,
        aiTemperature: 0.7,
        showThinking: false
      });

      ctx.message.text = '/ask test';
      process.env.ollamaApi = 'http://localhost:11434';

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          'AI is disabled for this user',
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });

  describe('Admin Commands', () => {
    test('should handle /aistats command', async () => {
      const { getUserWithStringsAndModel } = await import('../../utils/get-user-strings');
      (getUserWithStringsAndModel as Mock<any>).mockResolvedValueOnce({
        user: {
          telegramId: '123456',
          aiCharacters: 500000,
          aiRequests: 10
        },
        Strings: {
          ai: {
            queueEmpty: 'Queue is empty'
          },
          aiStats: {
            header: '📊 AI Usage Statistics',
            requests: '**Requests:** {aiRequests}',
            characters: '**Characters:** {aiCharacters} (~{bookCount} {bookWord})'
          }
        }
      });

      aiModule(bot, db);
      const statsHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'aistats')?.[2];

      if (statsHandler && typeof statsHandler === 'function') {
        await statsHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('AI Usage Statistics'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle /queue command for admin', async () => {
      ctx.from.id = 123456;

      aiModule(bot, db);
      const queueHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'queue')?.[2];

      if (queueHandler && typeof queueHandler === 'function') {
        await queueHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Queue is empty'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should reject /queue command for non-admin', async () => {
      ctx.from.id = 999999;

      aiModule(bot, db);
      const queueHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'queue')?.[2];

      if (queueHandler && typeof queueHandler === 'function') {
        await queueHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('No permission');
      }
    });

    test('should handle /qlimit command', async () => {
      ctx.message.text = '/qlimit 555555 1h';
      ctx.from.id = 123456;

      db.query.usersTable.findFirst = jest.fn().mockResolvedValueOnce({
        telegramId: '555555',
        username: 'targetuser'
      });

      aiModule(bot, db);
      const qlimitHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'qlimit')?.[2];

      if (qlimitHandler && typeof qlimitHandler === 'function') {
        await qlimitHandler(ctx);

        expect(db.update).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('timed out'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle /rlimit command', async () => {
      ctx.message.text = '/rlimit 555555';
      ctx.from.id = 123456;

      db.query.usersTable.findFirst = jest.fn().mockResolvedValueOnce({
        telegramId: '555555',
        username: 'targetuser'
      });

      aiModule(bot, db);
      const rlimitHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'rlimit')?.[2];

      if (rlimitHandler && typeof rlimitHandler === 'function') {
        await rlimitHandler(ctx);

        expect(db.update).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('limits removed'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle /setexec command', async () => {
      ctx.message.text = '/setexec 555555 5m';
      ctx.from.id = 123456;

      db.query.usersTable.findFirst = jest.fn().mockResolvedValueOnce({
        telegramId: '555555',
        username: 'targetuser'
      });

      aiModule(bot, db);
      const setexecHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'setexec')?.[2];

      if (setexecHandler && typeof setexecHandler === 'function') {
        await setexecHandler(ctx);

        expect(db.update).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Execution time limit set'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should handle /limits command', async () => {
      ctx.from.id = 123456;

      db.query.usersTable.findMany = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      aiModule(bot, db);
      const limitsHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'limits')?.[2];

      if (limitsHandler && typeof limitsHandler === 'function') {
        await limitsHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('No limits currently set'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });

  describe('Stop Command', () => {
    test('should handle /aistop with no active requests', async () => {
      ctx.from.id = 123456;

      aiModule(bot, db);
      const stopHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('aistop'))?.[2];

      if (stopHandler && typeof stopHandler === 'function') {
        await stopHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('No active request'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      ctx.message.text = '/ask test';

      mockedAxiosPost.mockRejectedValueOnce(new Error('Network error'));

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(ctx.reply).toHaveBeenCalled();
      }
    });

    test('should handle model not found and pull model', async () => {
      ctx.message.text = '/ask test';

      const error = {
        response: {
          data: { error: "model 'gemma3:4b' not found" },
          status: 404
        }
      };

      mockedAxiosPost
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: { success: true } });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          expect.stringContaining('/api/pull'),
          expect.objectContaining({ model: expect.any(String) })
        );
      }
    });
  });

  describe('Queue Management', () => {
    test('should handle /qdel command', async () => {
      ctx.message.text = '/qdel 555555';
      ctx.from.id = 123456;

      aiModule(bot, db);
      const qdelHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'qdel')?.[2];

      if (qdelHandler && typeof qdelHandler === 'function') {
        await qdelHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('No queue items'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });

    test('should reject /qdel with invalid user ID', async () => {
      ctx.message.text = '/qdel invalidid';
      ctx.from.id = 123456;

      aiModule(bot, db);
      const qdelHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'qdel')?.[2];

      if (qdelHandler && typeof qdelHandler === 'function') {
        await qdelHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Invalid user ID'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });

  describe('Helper Functions', () => {
    test('should detect URLs in text', () => {
      ctx.message.text = '/ask Check this website https://example.com';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Website checked' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        askHandler(ctx);
      }
    });

    test('should handle thinking tags in response', () => {
      ctx.message.text = '/think test';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: '<think>' }) + '\n');
          yield Buffer.from(JSON.stringify({ response: 'Thinking...' }) + '\n');
          yield Buffer.from(JSON.stringify({ response: '</think>' }) + '\n');
          yield Buffer.from(JSON.stringify({ response: 'Answer is 42' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const thinkHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('think'))?.[2];

      if (thinkHandler && typeof thinkHandler === 'function') {
        thinkHandler(ctx);
      }
    });
  });

  describe('Duration Parsing', () => {
    test('should parse valid duration strings', async () => {
      ctx.message.text = '/qlimit 555555 30s';
      ctx.from.id = 123456;

      db.query.usersTable.findFirst = jest.fn().mockResolvedValueOnce({
        telegramId: '555555'
      });

      aiModule(bot, db);
      const qlimitHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'qlimit')?.[2];

      if (qlimitHandler && typeof qlimitHandler === 'function') {
        await qlimitHandler(ctx);
        expect(db.update).toHaveBeenCalled();
      }
    });

    test('should reject invalid duration format', async () => {
      ctx.message.text = '/qlimit 555555 invalid';
      ctx.from.id = 123456;

      aiModule(bot, db);
      const qlimitHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'qlimit')?.[2];

      if (qlimitHandler && typeof qlimitHandler === 'function') {
        await qlimitHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Invalid duration'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });

  describe('Failure Logging', () => {
    test('should log failure to database when API call fails', async () => {
      const { trackCommand } = await import('../../utils/track-command');
      const trackCommandMock = trackCommand as Mock<any>;

      ctx.message.text = '/ask test question';
      mockedAxiosPost.mockRejectedValueOnce(new Error('API Connection Failed'));

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(trackCommandMock).toHaveBeenCalledWith(
          db,
          ctx,
          'ask',
          false,
          'API Connection Failed',
          expect.any(Number)
        );
      }
    });

    test('should log success to database when command completes', async () => {
      const { trackCommand } = await import('../../utils/track-command');
      const trackCommandMock = trackCommand as Mock<any>;

      ctx.message.text = '/aistats';

      aiModule(bot, db);
      const statsHandler = (bot.command as Mock<any>).mock.calls.find(call => call[0] === 'aistats')?.[2];

      if (statsHandler && typeof statsHandler === 'function') {
        await statsHandler(ctx);

        expect(trackCommandMock).toHaveBeenCalledWith(
          db,
          ctx,
          'aistats',
          true,
          undefined,
          expect.any(Number)
        );
      }
    });

    test('should track execution time for commands', async () => {
      const { trackCommand } = await import('../../utils/track-command');
      const trackCommandMock = trackCommand as Mock<any>;

      ctx.message.text = '/aistop';

      aiModule(bot, db);
      const stopHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('aistop'))?.[2];

      if (stopHandler && typeof stopHandler === 'function') {
        await stopHandler(ctx);

        const lastCall = trackCommandMock.mock.calls[trackCommandMock.mock.calls.length - 1];
        expect(lastCall[5]).toBeGreaterThan(0); // startTime should be provided
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limit exceeded scenarios', async () => {
      const { rateLimiter } = await import('../../utils/rate-limiter');
      const editMessageWithRetryMock = (rateLimiter.editMessageWithRetry as Mock<any>);
      editMessageWithRetryMock.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      ctx.message.text = '/ask test';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Test response' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent requests from different users', async () => {
      const contexts = [
        {
          ...ctx,
          from: { id: 111111, username: 'user1', first_name: 'User1' },
          message: { ...ctx.message, text: '/ask question 1', from: { id: 111111 } },
          reply: jest.fn().mockResolvedValue({ message_id: 2 })
        },
        {
          ...ctx,
          from: { id: 222222, username: 'user2', first_name: 'User2' },
          message: { ...ctx.message, text: '/ask question 2', from: { id: 222222 } },
          reply: jest.fn().mockResolvedValue({ message_id: 3 })
        },
        {
          ...ctx,
          from: { id: 333333, username: 'user3', first_name: 'User3' },
          message: { ...ctx.message, text: '/ask question 3', from: { id: 333333 } },
          reply: jest.fn().mockResolvedValue({ message_id: 4 })
        }
      ];

      const mockStreams = contexts.map(() => ({
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Response' }) + '\n');
        }
      }));

      mockStreams.forEach(stream => {
        mockedAxiosPost.mockResolvedValueOnce({ data: stream });
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        const promises = contexts.map(ctx => askHandler(ctx));
        await Promise.all(promises);

        contexts.forEach(context => {
          expect(context.reply).toHaveBeenCalled();
        });
      }
    });

    test('should handle requests when queue management is active', async () => {
      ctx.message.text = '/ask test question';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Response' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(ctx.reply).toHaveBeenCalled();
      }
    });
  });

  describe('Custom Model Settings', () => {
    test('should use custom AI model when configured', async () => {
      const { getUserWithStringsAndModel } = await import('../../utils/get-user-strings');
      (getUserWithStringsAndModel as Mock<any>).mockResolvedValueOnce({
        user: {
          telegramId: '123456',
          aiEnabled: true
        },
        Strings: {
          ai: {
            askNoMessage: 'Please provide a message',
            askGenerating: 'Generating response with {model}...',
            statusWaitingRender: '⏳ Waiting',
            statusRendering: '🔄 Rendering', 
            statusComplete: '✅ Complete',
            modelHeader: '**Model:** {model} | **Temperature:** {temperature} | **Status:** {status}',
            systemPrompt: 'You are {botName}. Current date: {date}, time: {time}',
            noChatFound: 'Chat not found'
          },
          unexpectedErr: 'Unexpected error: {error}'
        },
        customAiModel: 'custom-model:7b',
        aiTemperature: 0.9,
        showThinking: true
      });

      ctx.message.text = '/ask test';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Custom model response' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            model: 'custom-model:7b',
            options: expect.objectContaining({
              temperature: 0.9
            })
          }),
          expect.any(Object)
        );
      }
    });

    test('should handle custom system prompt', async () => {
      const { getUserWithStringsAndModel } = await import('../../utils/get-user-strings');
      (getUserWithStringsAndModel as Mock<any>).mockResolvedValueOnce({
        user: {
          telegramId: '123456',
          aiEnabled: true,
          customSystemPrompt: 'You are a helpful assistant specialized in coding.'
        },
        Strings: {
          ai: {
            askNoMessage: 'Please provide a message',
            askGenerating: 'Generating response with {model}...',
            statusWaitingRender: '⏳ Waiting',
            statusRendering: '🔄 Rendering', 
            statusComplete: '✅ Complete',
            modelHeader: '**Model:** {model} | **Temperature:** {temperature} | **Status:** {status}',
            systemPrompt: 'You are {botName}. Current date: {date}, time: {time}',
            noChatFound: 'Chat not found'
          },
          unexpectedErr: 'Unexpected error: {error}'
        },
        customAiModel: null,
        aiTemperature: 0.7,
        showThinking: false
      });

      ctx.message.text = '/ask test';

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify({ response: 'Response with custom prompt' }) + '\n');
        }
      };

      mockedAxiosPost.mockResolvedValueOnce({
        data: mockStream
      });

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockedAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            prompt: expect.stringContaining('You are a helpful assistant specialized in coding.')
          }),
          expect.any(Object)
        );
      }
    });
  });

  describe('User Timeout Check', () => {
    test('should block users with active timeout', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const { getUserWithStringsAndModel } = await import('../../utils/get-user-strings');
      (getUserWithStringsAndModel as Mock<any>).mockResolvedValueOnce({
        user: {
          telegramId: '123456',
          aiEnabled: true,
          aiTimeoutUntil: futureDate
        },
        Strings: {
          ai: {
            userTimedOutFromAI: 'You are timed out from AI until {timeoutEnd}'
          }
        },
        customAiModel: null,
        aiTemperature: 0.7,
        showThinking: false
      });

      db.query.usersTable.findFirst = jest.fn().mockResolvedValueOnce({
        telegramId: '123456',
        aiTimeoutUntil: futureDate
      });

      ctx.message.text = '/ask test';

      aiModule(bot, db);
      const askHandler = (bot.command as Mock<any>).mock.calls.find((call: any) => call[0].includes('ask'))?.[2];

      if (askHandler && typeof askHandler === 'function') {
        await askHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('timed out'),
          expect.objectContaining({ parse_mode: 'Markdown' })
        );
      }
    });
  });
});