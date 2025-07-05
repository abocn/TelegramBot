import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { db } from "@/lib/db";
import { usersTable, sessionsTable, twoFactorTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
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

    const userId = sessionData.user.telegramId;

    await db.transaction(async (tx) => {
      await tx.delete(sessionsTable)
        .where(eq(sessionsTable.userId, userId));

      await tx.delete(twoFactorTable)
        .where(eq(twoFactorTable.userId, userId));

      await tx.delete(usersTable)
        .where(eq(usersTable.telegramId, userId));
    });

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({
      error: "Failed to delete account"
    }, { status: 500 });
  }
}
