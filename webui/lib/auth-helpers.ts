import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from './auth';
import { SESSION_COOKIE_NAME } from './auth-constants';

export async function requireAuth(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const sessionData = await validateSession(sessionToken);

  if (!sessionData || !sessionData.user) {
    throw NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  return sessionData;
}

export async function validateJsonRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      throw NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    return body;
  } catch {
    throw NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export function validateString(value: unknown, fieldName: string, minLength = 1, maxLength = 1000): string {
  if (typeof value !== 'string') {
    throw NextResponse.json({ error: `${fieldName} must be a string` }, { status: 400 });
  }

  if (value.length < minLength || value.length > maxLength) {
    throw NextResponse.json({
      error: `${fieldName} must be between ${minLength} and ${maxLength} characters`
    }, { status: 400 });
  }

  return value;
}

export function validateArray(value: unknown, fieldName: string, maxLength = 100): unknown[] {
  if (!Array.isArray(value)) {
    throw NextResponse.json({ error: `${fieldName} must be an array` }, { status: 400 });
  }

  if (value.length > maxLength) {
    throw NextResponse.json({
      error: `${fieldName} cannot have more than ${maxLength} items`
    }, { status: 400 });
  }

  return value;
}

export function validateNumber(value: unknown, fieldName: string, min?: number, max?: number): number {
  const num = Number(value);

  if (isNaN(num)) {
    throw NextResponse.json({ error: `${fieldName} must be a valid number` }, { status: 400 });
  }

  if (min !== undefined && num < min) {
    throw NextResponse.json({ error: `${fieldName} must be at least ${min}` }, { status: 400 });
  }

  if (max !== undefined && num > max) {
    throw NextResponse.json({ error: `${fieldName} must be at most ${max}` }, { status: 400 });
  }

  return num;
}

export function handleApiError(error: unknown, operation: string) {
  console.error(`Error in ${operation}:`, error);

  if (error instanceof NextResponse) {
    return error;
  }

  return NextResponse.json({
    error: "Internal server error"
  }, { status: 500 });
}

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (now - record.timestamp > windowMs) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  record.count++;

  if (record.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxAttempts - record.count };
}

export function cleanupRateLimit() {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15m

  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.timestamp > windowMs) {
      rateLimitMap.delete(key);
    }
  }
}

setInterval(cleanupRateLimit, 10 * 60 * 1000);
