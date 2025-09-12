import { NextRequest, NextResponse } from "next/server";
import { eq, lt } from "drizzle-orm";
import { requireAdmin, createAuthResponse } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

async function syncAdminStatus() {
  const adminIds = process.env.botAdmins ?
    process.env.botAdmins.split(',').map(id => id.trim()) : [];

  if (adminIds.length === 0) {
    return { success: false, message: "No bot admins configured in environment" };
  }

  try {
    for (const adminId of adminIds) {
      await db.update(schema.usersTable)
        .set({ isAdmin: true })
        .where(eq(schema.usersTable.telegramId, adminId));
    }

    const allUsers = await db.select({ telegramId: schema.usersTable.telegramId })
      .from(schema.usersTable);
    const nonAdminUsers = allUsers
      .filter(user => !adminIds.includes(user.telegramId))
      .map(user => user.telegramId);

    for (const userId of nonAdminUsers) {
      await db.update(schema.usersTable)
        .set({ isAdmin: false })
        .where(eq(schema.usersTable.telegramId, userId));
    }

    return {
      success: true,
      message: `Admin status synced for ${adminIds.length} admins`
    };
  } catch (error) {
    console.error('[❌ ERROR] Failed to sync admin status:', error);
    return {
      success: false,
      message: `Failed to sync admin status: ${error}`
    };
  }
}

async function cleanupSessions() {
  try {
    await db.delete(schema.sessionsTable)
      .where(lt(schema.sessionsTable.expiresAt, new Date()));

    return {
      success: true,
      message: `Cleaned up expired sessions`
    };
  } catch (error) {
    console.error('[❌ ERROR] Failed to cleanup sessions:', error);
    return {
      success: false,
      message: `Failed to cleanup sessions: ${error}`
    };
  }
}

async function clearWikiCache() {
  try {
    await db.delete(schema.wikiCacheTable);

    return {
      success: true,
      message: "Wiki cache cleared successfully"
    };
  } catch (error) {
    console.error('Failed to clear wiki cache:', error);
    return {
      success: false,
      message: `Failed to clear wiki cache: ${error}`
    };
  }
}

async function clearWikiPagination() {
  try {
    await db.delete(schema.wikiPaginationTable);

    return {
      success: true,
      message: "Wiki pagination cache cleared successfully"
    };
  } catch (error) {
    console.error('Failed to clear wiki pagination:', error);
    return {
      success: false,
      message: `Failed to clear wiki pagination: ${error}`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    const authResponse = createAuthResponse(authResult);

    if (authResponse) {
      return authResponse;
    }

    if (!authResult.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const { jobId } = await request.json();

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    let result;

    switch (jobId) {
      case 'sync-admins':
        result = await syncAdminStatus();
        break;
      case 'cleanup-sessions':
        result = await cleanupSessions();
        break;
      case 'clear-cache':
        result = await clearWikiCache();
        break;
      case 'clear-wiki-pagination':
        result = await clearWikiPagination();
        break;
      default:
        return NextResponse.json({ error: "Unknown job ID" }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

  } catch (error) {
    console.error("[❌ ERROR] Error in admin jobs API:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}