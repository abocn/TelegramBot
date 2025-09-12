import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../database/schema';

export async function syncAdminStatus(db: NodePgDatabase<typeof schema>) {
  const adminIds = process.env.botAdmins ?
    process.env.botAdmins.split(',').map(id => id.trim()) : [];

  if (adminIds.length === 0) {
    console.log('[INFO] No bot admins configured');
    return;
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

    console.log(`[👥 ADM] Admin status synced for ${adminIds.length} admins`);
  } catch (error) {
    console.error('[ERROR] Failed to sync admin status:', error);
  }
}