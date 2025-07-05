import { eq, and, gt, lt } from "drizzle-orm";
import { db } from "./db";
import { sessionsTable, usersTable } from "./schema";
import { randomBytes } from "crypto";

export interface SessionData {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  user?: {
    telegramId: string;
    username: string;
    firstName: string;
    lastName: string;
    aiEnabled: boolean;
    showThinking: boolean;
    customAiModel: string;
    aiTemperature: number;
    aiRequests: number;
    aiCharacters: number;
    disabledCommands: string[];
    languageCode: string;
  };
}

import { SESSION_COOKIE_NAME, SESSION_DURATION } from "./auth-constants";

export { SESSION_COOKIE_NAME };

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

export async function createSession(userId: string): Promise<SessionData> {
  const sessionId = generateSessionId();
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.delete(sessionsTable)
    .where(
      and(
        eq(sessionsTable.userId, userId),
        lt(sessionsTable.expiresAt, new Date())
      )
    );

  const [session] = await db.insert(sessionsTable)
    .values({
      id: sessionId,
      userId,
      sessionToken,
      expiresAt,
    })
    .returning();

  return session;
}

export async function validateSession(sessionToken: string): Promise<SessionData | null> {
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length < 32) {
    return null;
  }

  try {
    const sessionWithUser = await db
      .select({
        session: sessionsTable,
        user: usersTable,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.telegramId))
      .where(
        and(
          eq(sessionsTable.sessionToken, sessionToken),
          gt(sessionsTable.expiresAt, new Date())
        )
      )
      .limit(1);

    if (sessionWithUser.length === 0) {
      await cleanupExpiredSessions();
      return null;
    }

    const { session, user } = sessionWithUser[0];

    const oneDay = 24 * 60 * 60 * 1000;
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();

    if (timeUntilExpiry < oneDay) {
      const newExpiresAt = new Date(Date.now() + SESSION_DURATION);
      await db.update(sessionsTable)
        .set({ expiresAt: newExpiresAt })
        .where(eq(sessionsTable.id, session.id));

      session.expiresAt = newExpiresAt;
    }

    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        aiEnabled: user.aiEnabled,
        showThinking: user.showThinking,
        customAiModel: user.customAiModel,
        aiTemperature: user.aiTemperature,
        aiRequests: user.aiRequests,
        aiCharacters: user.aiCharacters,
        disabledCommands: user.disabledCommands || [],
        languageCode: user.languageCode,
      },
    };
  } catch (error) {
    console.error("Error validating session:", error);
    return null;
  }
}

export async function invalidateSession(sessionToken: string): Promise<void> {
  await db.delete(sessionsTable)
    .where(eq(sessionsTable.sessionToken, sessionToken));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessionsTable)
    .where(lt(sessionsTable.expiresAt, new Date()));
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  };
}
