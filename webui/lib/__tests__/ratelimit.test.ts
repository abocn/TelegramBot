import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis-mock';
import {
  checkRateLimit,
  addRateLimitHeaders,
  rateLimit,
  withRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  closeRedisConnection
} from '../ratelimit';

const mockRedis = new Redis();

mock.module('ioredis', () => {
  return {
    Redis: function() {
      return mockRedis;
    }
  };
});

process.env.ratelimitSalt = 'test-salt';
process.env.valkeyBaseUrl = 'localhost';
process.env.valkeyPort = '6379';

function createMockRequest(ip: string = '192.168.1.1'): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const request = new NextRequest(url);
  
  Object.defineProperty(request, 'headers', {
    value: new Map([
      ['x-forwarded-for', ip],
    ]),
    writable: false
  });
  
  return request;
}

describe('Rate Limiting', () => {
  let originalPipeline: typeof mockRedis.pipeline;
  let originalDel: typeof mockRedis.del;
  let originalZremrangebyscore: typeof mockRedis.zremrangebyscore;
  let originalKeys: typeof mockRedis.keys;

  beforeEach(async () => {
    await mockRedis.flushall();
    originalPipeline = mockRedis.pipeline;
    originalDel = mockRedis.del;
    originalZremrangebyscore = mockRedis.zremrangebyscore;
    originalKeys = mockRedis.keys;
  });

  afterEach(async () => {
    await mockRedis.flushall();
    mockRedis.pipeline = originalPipeline;
    mockRedis.del = originalDel;
    mockRedis.zremrangebyscore = originalZremrangebyscore;
    mockRedis.keys = originalKeys;
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const request = createMockRequest();
      const config = { maxRequests: 5, windowMs: 60000 };
      
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should block requests when limit exceeded', async () => {
      const request = createMockRequest();
      const config = { maxRequests: 2, windowMs: 60000 };
      
      await checkRateLimit(request, 'test-route', config);
      await checkRateLimit(request, 'test-route', config);
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toBe('Ratelimit exceeded');
      expect(result.response).toBeDefined();
    });

    it('should handle different IPs separately', async () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      const config = { maxRequests: 1, windowMs: 60000 };
      
      const result1 = await checkRateLimit(request1, 'test-route', config);
      const result2 = await checkRateLimit(request2, 'test-route', config);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle different routes separately', async () => {
      const request = createMockRequest();
      const config = { maxRequests: 1, windowMs: 60000 };
      
      const result1 = await checkRateLimit(request, 'route1', config);
      const result2 = await checkRateLimit(request, 'route2', config);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle missing x-forwarded-for header', async () => {
      const url = 'http://localhost:3000/api/test';
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'headers', {
        value: new Map([
          ['x-real-ip', '10.0.0.1'],
        ]),
        writable: false
      });
      
      const config = { maxRequests: 5, windowMs: 60000 };
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(true);
    });

    it('should fallback to 127.0.0.1 when no IP headers present', async () => {
      const url = 'http://localhost:3000/api/test';
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'headers', {
        value: new Map(),
        writable: false
      });
      
      const config = { maxRequests: 5, windowMs: 60000 };
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(true);
    });

    it('should handle redis errors gracefully', async () => {
      const request = createMockRequest();
      const config = { maxRequests: 5, windowMs: 60000 };
      
      const tempPipeline = mockRedis.pipeline;
      mockRedis.pipeline = () => {
        throw new Error('Redis connection failed');
      };
      
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(true);
      expect(result.error).toBe('Rate limiting service unavailable');
      
      mockRedis.pipeline = tempPipeline;
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add correct headers to response', () => {
      const response = NextResponse.json({ success: true });
      const rateLimitResult = {
        success: true,
        limit: 100,
        remaining: 99,
        resetTime: 1234567890
      };
      
      const updatedResponse = addRateLimitHeaders(response, rateLimitResult);
      
      expect(updatedResponse.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(updatedResponse.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(updatedResponse.headers.get('X-RateLimit-Reset')).toBe('1234567890');
    });
  });

  describe('rateLimit', () => {
    it('should call checkRateLimit with correct parameters', async () => {
      const request = createMockRequest();
      
      const result = await rateLimit(request, 'test-route', 10, 30000);
      
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });
  });

  describe('withRateLimit', () => {
    it('should return rate limit response when limit exceeded', async () => {
      const request = createMockRequest();
      const handler = mock(() => Promise.resolve(NextResponse.json({ data: 'success' })));
      const wrappedHandler = withRateLimit(handler, 'test-route', 1, 60000);
      
      await wrappedHandler(request);
      const response = await wrappedHandler(request);
      
      expect(response.status).toBe(429);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call handler and add headers when within limit', async () => {
      const request = createMockRequest();
      const handler = mock(() => Promise.resolve(NextResponse.json({ data: 'success' })));
      const wrappedHandler = withRateLimit(handler, 'test-route', 10, 60000);
      
      const response = await wrappedHandler(request);
      
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific IP and route', async () => {
      const request = createMockRequest('192.168.1.1');
      const config = { maxRequests: 1, windowMs: 60000 };
      
      await checkRateLimit(request, 'test-route', config);
      const beforeReset = await checkRateLimit(request, 'test-route', config);
      expect(beforeReset.success).toBe(false);
      
      const resetResult = await resetRateLimit('192.168.1.1', 'test-route');
      expect(resetResult).toBe(true);
      
      const afterReset = await checkRateLimit(request, 'test-route', config);
      expect(afterReset.success).toBe(true);
    });

    it('should handle redis errors during reset', async () => {
      const tempDel = mockRedis.del;
      mockRedis.del = () => {
        throw new Error('Redis error');
      };
      
      const result = await resetRateLimit('192.168.1.1', 'test-route');
      expect(result).toBe(false);
      
      mockRedis.del = tempDel;
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current count and reset time', async () => {
      const request = createMockRequest('192.168.1.1');
      const config = { maxRequests: 5, windowMs: 60000 };
      
      await checkRateLimit(request, 'test-route', config);
      await checkRateLimit(request, 'test-route', config);
      
      const status = await getRateLimitStatus('192.168.1.1', 'test-route', 60000);
      
      expect(status).toBeDefined();
      expect(status!.count).toBe(2);
      expect(status!.resetTime).toBeGreaterThan(Date.now());
    });

    it('should return null on redis error', async () => {
      const tempZremrangebyscore = mockRedis.zremrangebyscore;
      mockRedis.zremrangebyscore = () => {
        throw new Error('Redis error');
      };
      
      const status = await getRateLimitStatus('192.168.1.1', 'test-route', 60000);
      expect(status).toBeNull();
      
      mockRedis.zremrangebyscore = tempZremrangebyscore;
    });
  });

  describe('closeRedisConnection', () => {
    it('should close redis connection', async () => {
      await expect(closeRedisConnection()).resolves.toBeUndefined();
    });
  });

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for with multiple IPs', async () => {
      const url = 'http://localhost:3000/api/test';
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'headers', {
        value: new Map([
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1, 172.16.0.1'],
        ]),
        writable: false
      });
      
      const config = { maxRequests: 5, windowMs: 60000 };
      const result = await checkRateLimit(request, 'test-route', config);
      
      expect(result.success).toBe(true);
    });
  });

  describe('window expiration', () => {
    it('should allow requests after window expires', async () => {
      const request = createMockRequest();
      const config = { maxRequests: 1, windowMs: 100 };
      
      const result1 = await checkRateLimit(request, 'test-route', config);
      expect(result1.success).toBe(true);
      
      const result2 = await checkRateLimit(request, 'test-route', config);
      expect(result2.success).toBe(false);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result3 = await checkRateLimit(request, 'test-route', config);
      expect(result3.success).toBe(true);
    });
  });
});