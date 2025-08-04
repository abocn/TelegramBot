import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export async function GET(request: NextRequest) {
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

    const { user } = sessionData;
    const sanitizedUser = {
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
      customSystemPrompt: user.customSystemPrompt,
      disabledCommands: user.disabledCommands,
      languageCode: user.languageCode,
      timezone: user.timezone,
    };

    return NextResponse.json(sanitizedUser);

  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}
