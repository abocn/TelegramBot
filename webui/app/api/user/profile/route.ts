import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createAuthResponse } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const authResponse = createAuthResponse(authResult);

    if (authResponse) {
      return authResponse;
    }

    if (!authResult.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = authResult.user;
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
      disabledAdminCommands: user.disabledAdminCommands,
      isAdmin: user.isAdmin,
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
