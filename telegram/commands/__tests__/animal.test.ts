import { describe, test, expect, beforeEach, mock, jest, Mock } from 'bun:test';
import axios from 'axios';
import { Context } from 'telegraf';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../database/schema';
import { duckHandler, foxHandler, dogHandler, catHandler, soggyHandler } from '../animal';
import Resources from '../../props/resources.json';


type MockContext = Context & {
  message: {
    text: string;
    message_id: number;
    from: { id: number };
  };
  chat: { id: number };
  reply: Mock<(...args: unknown[]) => unknown>;
  replyWithPhoto: Mock<(...args: unknown[]) => unknown>;
  replyWithSticker: Mock<(...args: unknown[]) => unknown>;
}

mock.module('axios', () => {
  const axiosMock = jest.fn();
  const getMethod = jest.fn();
  return {
    default: Object.assign(axiosMock, { get: getMethod }),
    get: getMethod
  };
});

mock.module('../../utils/get-user-strings', () => ({
  getUserAndStrings: jest.fn().mockResolvedValue({
    User: { id: 1, username: 'testuser' },
    Strings: {
      duckApiErr: 'Duck API error: {error}',
      foxApiErr: 'Fox API error: {error}',
      dogApiErr: 'Dog API error: {error}',
      catImgErr: 'Cat API error: {error}'
    }
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

describe('Animal Commands', () => {
  let ctx: MockContext;
  let db: NodePgDatabase<typeof schema>;
  const mockedAxios = axios as unknown as jest.Mock & { get: jest.Mock };
  const mockedAxiosGet = (axios as unknown as { get: jest.Mock }).get;

  beforeEach(() => {
    jest.clearAllMocks();

    ctx = {
      message: {
        text: '',
        message_id: 1,
        from: { id: 123456 }
      },
      chat: { id: 789 },
      reply: jest.fn(),
      replyWithPhoto: jest.fn(),
      replyWithSticker: jest.fn()
    } as unknown as MockContext;

    // Database mock
    db = {} as NodePgDatabase<typeof schema>;
  });

  describe('duckHandler', () => {
    test('should send duck photo on successful API response', async () => {
      const mockDuckUrl = 'https://example.com/duck.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { url: mockDuckUrl }
      });

      await duckHandler(ctx as Context & { message: { text: string } }, db);

      expect(mockedAxios).toHaveBeenCalledWith(Resources.duckApi);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockDuckUrl, {
        caption: "🦆",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle API error gracefully', async () => {
      const errorMessage = 'Network error';
      mockedAxios.mockRejectedValueOnce(new Error(errorMessage));

      await duckHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        `Duck API error: ${errorMessage}`,
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should work without reply_to_message_id', async () => {
      const { replyToMessageId } = await import('../../utils/reply-to-message-id');
      (replyToMessageId as Mock<typeof replyToMessageId>).mockReturnValueOnce(undefined);

      const mockDuckUrl = 'https://example.com/duck.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { url: mockDuckUrl }
      });

      await duckHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockDuckUrl, {
        caption: "🦆"
      });
    });
  });

  describe('foxHandler', () => {
    test('should send fox photo on successful API response', async () => {
      const mockFoxUrl = 'https://example.com/fox.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { image: mockFoxUrl }
      });

      await foxHandler(ctx as Context & { message: { text: string } }, db);

      expect(mockedAxios).toHaveBeenCalledWith(Resources.foxApi);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockFoxUrl, {
        caption: "🦊",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle API error gracefully', async () => {
      const errorMessage = 'API timeout';
      mockedAxios.mockRejectedValueOnce(new Error(errorMessage));

      await foxHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        `Fox API error: ${errorMessage}`,
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });
  });

  describe('dogHandler', () => {
    test('should send dog photo on successful API response', async () => {
      const mockDogUrl = 'https://example.com/dog.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { message: mockDogUrl }
      });

      await dogHandler(ctx as Context & { message: { text: string } }, db);

      expect(mockedAxios).toHaveBeenCalledWith(Resources.dogApi);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockDogUrl, {
        caption: "🐶",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle API error gracefully', async () => {
      const errorMessage = 'Service unavailable';
      mockedAxios.mockRejectedValueOnce(new Error(errorMessage));

      await dogHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        `Dog API error: ${errorMessage}`,
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });
  });

  describe('catHandler', () => {
    test('should send cat photo on successful API response', async () => {
      const mockCatId = 'cat123';
      mockedAxiosGet.mockResolvedValueOnce({
        data: { url: mockCatId }
      });

      await catHandler(ctx as Context & { message: { text: string } }, db);

      expect(mockedAxiosGet).toHaveBeenCalledWith(`${Resources.catApi}?json=true`);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockCatId, {
        caption: `🐱`,
        parse_mode: 'Markdown',
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle API error gracefully', async () => {
      const errorMessage = 'Cat not found';
      mockedAxiosGet.mockRejectedValueOnce(new Error(errorMessage));

      await catHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        `Cat API error: ${errorMessage}`,
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });
  });

  describe('soggyHandler', () => {
    test('should send default soggy cat photo when no argument provided', async () => {
      ctx.message.text = '/soggy';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        Resources.soggyCat,
        {
          caption: Resources.soggyCat,
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should send thumb photo when argument is "2"', async () => {
      ctx.message.text = '/soggy 2';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        Resources.soggyCat2,
        {
          caption: Resources.soggyCat2,
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should send thumb photo when argument is "thumb"', async () => {
      ctx.message.text = '/soggy thumb';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        Resources.soggyCat2,
        {
          caption: Resources.soggyCat2,
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should send sticker when argument is "3"', async () => {
      ctx.message.text = '/soggy 3';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithSticker).toHaveBeenCalledWith(
        Resources.soggyCatSticker,
        { reply_parameters: { message_id: 123 } }
      );
    });

    test('should send sticker when argument is "sticker"', async () => {
      ctx.message.text = '/soggy sticker';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithSticker).toHaveBeenCalledWith(
        Resources.soggyCatSticker,
        { reply_parameters: { message_id: 123 } }
      );
    });

    test('should send alt photo when argument is "4"', async () => {
      ctx.message.text = '/soggy 4';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        Resources.soggyCatAlt,
        {
          caption: Resources.soggyCatAlt,
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should send alt photo when argument is "alt"', async () => {
      ctx.message.text = '/soggy alt';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        Resources.soggyCatAlt,
        {
          caption: Resources.soggyCatAlt,
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should handle without reply_to_message_id for sticker', async () => {
      const { replyToMessageId } = await import('../../utils/reply-to-message-id');
      (replyToMessageId as Mock<typeof replyToMessageId>).mockReturnValueOnce(undefined);

      ctx.message.text = '/soggy sticker';

      await soggyHandler(ctx as Context & { message: { text: string } });

      expect(ctx.replyWithSticker).toHaveBeenCalledWith(
        Resources.soggyCatSticker,
        undefined
      );
    });
  });

  describe('API Response Validation', () => {
    test('should handle valid duck API response structure', async () => {
      const mockDuckUrl = 'https://example.com/duck.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { url: mockDuckUrl }
      });

      await duckHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockDuckUrl, {
        caption: "🦆",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle valid fox API response structure', async () => {
      const mockFoxUrl = 'https://example.com/fox.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { image: mockFoxUrl }
      });

      await foxHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockFoxUrl, {
        caption: "🦊",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle valid dog API response structure', async () => {
      const mockDogUrl = 'https://example.com/dog.jpg';
      mockedAxios.mockResolvedValueOnce({
        data: { message: mockDogUrl }
      });

      await dogHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockDogUrl, {
        caption: "🐶",
        reply_parameters: { message_id: 123 }
      });
    });

    test('should handle valid cat API response structure', async () => {
      const mockCatId = 'cat123';
      mockedAxiosGet.mockResolvedValueOnce({
        data: { url: mockCatId }
      });

      await catHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(mockCatId, {
        caption: "🐱",
        parse_mode: "Markdown",
        reply_parameters: { message_id: 123 }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeout errors gracefully', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.name = 'AxiosError';
      mockedAxios.mockRejectedValueOnce(timeoutError);

      await duckHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Duck API error: timeout of 5000ms exceeded',
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should handle HTTP status errors for cat API', async () => {
      const httpError = new Error('Request failed with status code 500');
      httpError.name = 'AxiosError';
      mockedAxiosGet.mockRejectedValueOnce(httpError);

      await catHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Cat API error: Request failed with status code 500',
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should handle fox API connection failures', async () => {
      const connectionError = new Error('Connection refused');
      mockedAxios.mockRejectedValueOnce(connectionError);

      await foxHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Fox API error: Connection refused',
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });

    test('should handle dog API rate limiting', async () => {
      const rateLimitError = new Error('Too Many Requests');
      mockedAxios.mockRejectedValueOnce(rateLimitError);

      await dogHandler(ctx as Context & { message: { text: string } }, db);

      expect(ctx.reply).toHaveBeenCalledWith(
        'Dog API error: Too Many Requests',
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: 123 }
        }
      );
    });
  });
});