import { createHmac } from 'crypto';
import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
  response?: NextResponse;
}

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const vkBase = process.env.valkeyBaseUrl || 'localhost';
    const vkPort = Number(process.env.valkeyPort) || 6379;
    redisClient = new Redis(vkPort, vkBase, {
      retryStrategy: (times) => {
        if (times > 3) {
          return undefined;
        }
        return Math.min(times * 100, 1000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      console.error('[VALKEY ERR] Connection error:', error);
    });
  }
  return redisClient;
}

function encryptIP(ip: string, route: string): string {
  const salt = process.env.ratelimitSalt || 'plsssss-change-me';
  const hmac = createHmac('sha256', salt);
  hmac.update(`${ip}:${route}`);
  return hmac.digest('hex');
}

function getRealIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  console.log("[ERR] Could not identify user's IP")
  return '127.0.0.1'; // defaults to placeholder in case
}

export async function checkRateLimit(
  request: NextRequest,
  route: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();
    const ip = getRealIP(request);
    const encryptedKey = encryptIP(ip, route);
    const key = `ratelimit:${route}:${encryptedKey}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const pipeline1 = redis.pipeline();
    pipeline1.zremrangebyscore(key, 0, windowStart);
    pipeline1.zcard(key);
    
    const results1 = await pipeline1.exec();
    
    if (!results1) {
      throw new Error('Redis pipeline execution failed');
    }
    
    const currentCount = (results1[1][1] as number) || 0;
    const resetTime = now + config.windowMs;
    
    if (currentCount >= config.maxRequests) {      
      const response = NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((resetTime - now) / 1000),
        },
        { status: 429 }
      );
      
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
      response.headers.set('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        error: 'Ratelimit exceeded',
        response,
      };
    }
    
    // Add current request to Redis
    const pipeline2 = redis.pipeline();
    pipeline2.zadd(key, now, `${now}-${Math.random()}`);
    pipeline2.expire(key, Math.ceil(config.windowMs / 1000));
    await pipeline2.exec();
    
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining,
      resetTime,
    };
    
  } catch (error) {
    console.error('[ERR] Ratelimit check failed:', error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      resetTime: Date.now(),
      error: 'Rate limiting service unavailable',
    };
  }
}

export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  return response;
}

export async function rateLimit(
  request: NextRequest,
  routeName: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  return checkRateLimit(request, routeName, {
    maxRequests,
    windowMs,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  routeName: string,
  maxRequests: number,
  windowMs: number
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await rateLimit(request, routeName, maxRequests, windowMs);
    
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }
    
    const response = await handler(request);
    return addRateLimitHeaders(response, rateLimitResult);
  };
}

export async function resetRateLimit(ip: string, route: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const encryptedKey = encryptIP(ip, route);
    const key = `ratelimit:${route}:${encryptedKey}`;
    
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('[ERR] Failed to reset ratelimit:', error);
    return false;
  }
}

export async function getRateLimitStatus(
  ip: string,
  route: string,
  windowMs: number
): Promise<{ count: number; resetTime: number } | null> {
  try {
    const redis = getRedisClient();
    const encryptedKey = encryptIP(ip, route);
    const key = `ratelimit:${route}:${encryptedKey}`;
    
    const now = Date.now();
    const windowStart = now - windowMs;

    await redis.zremrangebyscore(key, 0, windowStart);
    const count = await redis.zcard(key);
    
    return {
      count,
      resetTime: now + windowMs,
    };
  } catch (error) {
    console.error('[ERR] Failed to get ratelimit status:', error);
    return null;
  }
}

export async function cleanupExpiredEntries(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const pattern = 'ratelimit:*';
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return true;
    
    const pipeline = redis.pipeline();
    const now = Date.now();
    const maxAge = 12 * 60 * 60 * 1000; // 12h
    const cutoff = now - maxAge;
    
    for (const key of keys) {
      pipeline.zremrangebyscore(key, 0, cutoff);
    }
    
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('[ERR] Failed to cleanup expired entries:', error);
    return false;
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}