import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

interface UserUpdates {
  aiEnabled?: boolean;
  showThinking?: boolean;
  customAiModel?: string;
  aiTemperature?: number;
  disabledCommands?: string[];
  languageCode?: string;
  updatedAt?: Date;
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const sessionToken = bearerToken || cookieToken;

    if (!sessionToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const sessionData = await validateSession(sessionToken);

    if (!sessionData || !sessionData.user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const updates = await request.json();
    const userId = sessionData.user.telegramId;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const allowedFields = [
      'aiEnabled',
      'showThinking',
      'customAiModel',
      'aiTemperature',
      'disabledCommands',
      'languageCode'
    ];

    const filteredUpdates: UserUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'aiEnabled' || key === 'showThinking') {
          filteredUpdates[key] = Boolean(value);
        } else if (key === 'aiTemperature') {
          const temp = Number(value);
          if (temp >= 0.1 && temp <= 2.0) {
            filteredUpdates[key] = temp;
          } else {
            return NextResponse.json({ error: "Temperature must be between 0.1 and 2.0" }, { status: 400 });
          }
        } else if (key === 'customAiModel' || key === 'languageCode') {
          if (typeof value === 'string' && value.length > 0 && value.length < 100) {
            filteredUpdates[key] = value;
          } else {
            return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
          }
        } else if (key === 'disabledCommands') {
          if (Array.isArray(value) && value.every(item => typeof item === 'string' && item.length < 50) && value.length < 100) {
            filteredUpdates[key] = value;
          } else {
            return NextResponse.json({ error: "Invalid disabled commands" }, { status: 400 });
          }
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    filteredUpdates.updatedAt = new Date();

    await db.update(schema.usersTable)
      .set(filteredUpdates)
      .where(eq(schema.usersTable.telegramId, userId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in settings API:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}
