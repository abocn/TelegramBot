import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { db } from "@/lib/db";
import { createSession, getSessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({
        success: false,
        error: "Invalid content type"
      }, { status: 400 });
    }

    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json({
        success: false,
        error: "User ID and code are required"
      }, { status: 400 });
    }

    if (typeof userId !== 'string' || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        error: "Invalid input format"
      }, { status: 400 });
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: "Invalid code format"
      }, { status: 400 });
    }

    const twoFactorRecord = await db.query.twoFactorTable.findFirst({
      where: and(
        eq(schema.twoFactorTable.userId, userId),
        gt(schema.twoFactorTable.codeExpiresAt, new Date())
      ),
    });

    if (!twoFactorRecord) {
      return NextResponse.json({
        success: false,
        error: "No valid 2FA code found or code has expired"
      }, { status: 404 });
    }

    if (twoFactorRecord.codeAttempts >= 5) {
      await db.delete(schema.twoFactorTable)
        .where(eq(schema.twoFactorTable.userId, userId));

      return NextResponse.json({
        success: false,
        error: "Too many failed attempts. Please request a new code."
      }, { status: 429 });
    }

    if (twoFactorRecord.currentCode !== code) {
      await db.update(schema.twoFactorTable)
        .set({
          codeAttempts: twoFactorRecord.codeAttempts + 1,
          updatedAt: new Date()
        })
        .where(eq(schema.twoFactorTable.userId, userId));

      console.log(`2FA verification failed for user: ${userId}, attempts: ${twoFactorRecord.codeAttempts + 1}`);
      return NextResponse.json({
        success: false,
        error: "Invalid 2FA code"
      }, { status: 401 });
    }

    const session = await createSession(userId);

    await db.delete(schema.twoFactorTable)
      .where(eq(schema.twoFactorTable.userId, userId));

    console.log("2FA verification successful for user:", userId);

    const response = NextResponse.json({
      success: true,
      message: "2FA verification successful",
      redirectTo: "/account",
      sessionToken: session.sessionToken
    });

    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, cookieOptions);

    return response;

  } catch (error) {
    console.error("Error in verify API:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
