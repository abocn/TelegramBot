import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "./auth";
import { SESSION_COOKIE_NAME } from "./auth-constants";

export interface AuthResult {
  user?: {
    telegramId: string;
    username: string;
    firstName: string;
    lastName: string;
    aiEnabled: boolean;
    showThinking: boolean;
    customAiModel: string;
    customSystemPrompt: string;
    aiTemperature: number;
    aiRequests: number;
    aiCharacters: number;
    disabledCommands: string[];
    disabledAdminCommands: string[];
    isAdmin: boolean;
    languageCode: string;
    timezone: string;
  };
  error?: string;
  status?: number;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionToken = bearerToken || cookieToken;

  if (!sessionToken) {
    return { error: "Authentication required", status: 401 };
  }

  const sessionData = await validateSession(sessionToken);

  if (!sessionData || !sessionData.user) {
    return { error: "Invalid or expired session", status: 401 };
  }

  return { user: sessionData.user };
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateRequest(request);

  if (authResult.error) {
    return authResult;
  }

  if (!authResult.user?.isAdmin) {
    return { error: "Admin access required", status: 403 };
  }

  return { user: authResult.user };
}

export function createAuthResponse(authResult: AuthResult): NextResponse | null {
  if (authResult.error && authResult.status) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  return null;
}