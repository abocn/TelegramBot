import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createAuthResponse } from "@/lib/auth-middleware";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { db } from "@/lib/db";
import { usersTable, sessionsTable, twoFactorTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const authResponse = createAuthResponse(authResult);

    if (authResponse) {
      return authResponse;
    }

    if (!authResult.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = authResult.user.telegramId;

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
