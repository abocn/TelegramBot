import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { db } from "@/lib/db";
import { rateLimit, addRateLimitHeaders } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, '2fa-username', 3, 15 * 60 * 1000); // 3 req per 15m    
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const requestContentType = request.headers.get('content-type');
    if (!requestContentType || !requestContentType.includes('application/json')) {
      return NextResponse.json({ success: false, error: "Invalid content type" }, { status: 400 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 });
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 32) {
      return NextResponse.json({ success: false, error: "Invalid username format" }, { status: 400 });
    }

    const cleanUsername = username.replace('@', '');

    const user = await db.query.usersTable.findFirst({
      where: eq(schema.usersTable.username, cleanUsername),
      columns: {
        telegramId: true,
        username: true,
      },
    });

    if (!user) {
      const botUsername = process.env.botUsername || "kowalski4tgbot";
      return NextResponse.json({ success: false, error: `Please DM @${botUsername} before signing in.` }, { status: 404 });
    }

    const botApiUrl = process.env.botApiUrl || "http://kowalski:3030";
    const fullUrl = `${botApiUrl}/2fa/get`;

    const botApiResponse = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.telegramId }),
    });

    if (!botApiResponse.ok) {
      const errorText = await botApiResponse.text();
      console.error("Bot API error response:", errorText);
      return NextResponse.json({
        success: false,
        error: `Bot API error: ${botApiResponse.status} - ${errorText.slice(0, 200)}`
      }, { status: 500 });
    }

    const contentType = botApiResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await botApiResponse.text();
      console.error("Bot API returned non-JSON:", errorText.slice(0, 200));
      return NextResponse.json({
        success: false,
        error: "Bot API returned invalid response format"
      }, { status: 500 });
    }

    const botApiResult = await botApiResponse.json();

    if (!botApiResult.generated) {
      return NextResponse.json({
        success: false,
        error: botApiResult.error || "Failed to send 2FA code"
      }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      message: "2FA code sent successfully",
      userId: user.telegramId
    });
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("Error in username API:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}