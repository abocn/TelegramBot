import { NextRequest, NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const sessionToken = bearerToken || cookieToken;

    if (sessionToken) {
      await invalidateSession(sessionToken);
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error in logout API:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}
