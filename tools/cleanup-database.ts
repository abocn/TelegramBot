import { drizzle } from 'drizzle-orm/node-postgres';
import { lt } from 'drizzle-orm';
import pg from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';

const { Pool } = pg;

async function cleanupExpiredWikiPagination(db: NodePgDatabase<typeof schema>): Promise<number> {
  try {
    const result = await db
      .delete(schema.wikiPaginationTable)
      .where(lt(schema.wikiPaginationTable.expiresAt, new Date()))
      .returning({ id: schema.wikiPaginationTable.id });

    return result.length;
  } catch (error) {
    console.error('[DB CLEAN] Error cleaning wiki pagination:', error);
    return 0;
  }
}

async function cleanupExpiredSessions(db: NodePgDatabase<typeof schema>): Promise<number> {
  try {
    const result = await db
      .delete(schema.sessionsTable)
      .where(lt(schema.sessionsTable.expiresAt, new Date()))
      .returning({ id: schema.sessionsTable.id });

    return result.length;
  } catch (error) {
    console.error('[DB CLEAN] Error cleaning sessions:', error);
    return 0;
  }
}

export async function runDatabaseCleanup() {
  let pool: pg.Pool | null = null;

  try {
    console.log('[DB CLEAN] Starting database cleanup...');

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const db = drizzle(pool, { schema });

    const wikiCount = await cleanupExpiredWikiPagination(db);
    if (wikiCount > 0) {
      console.log(`[DB CLEAN] Removed ${wikiCount} expired wiki pagination entries`);
    }

    const sessionCount = await cleanupExpiredSessions(db);
    if (sessionCount > 0) {
      console.log(`[DB CLEAN] Removed ${sessionCount} expired sessions`);
    }

    const totalRemoved = wikiCount + sessionCount;
    console.log(`[DB CLEAN] Cleanup complete. Total removed: ${totalRemoved} entries`);
  } catch (error) {
    console.error('[DB CLEAN] Cleanup failed:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runDatabaseCleanup().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('[DB CLEAN] Fatal error:', error);
    process.exit(1);
  });
}