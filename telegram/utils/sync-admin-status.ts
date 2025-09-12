// SYNC-ADMIN-STATUS.TS
// by ihatenodejs/Aidan
//
// -----------------------------------------------------------------------
//
// This is free and unencumbered software released into the public domain.
//
// Anyone is free to copy, modify, publish, use, compile, sell, or
// distribute this software, either in source code form or as a compiled
// binary, for any purpose, commercial or non-commercial, and by any
// means.
//
// In jurisdictions that recognize copyright laws, the author or authors
// of this software dedicate any and all copyright interest in the
// software to the public domain. We make this dedication for the benefit
// of the public at large and to the detriment of our heirs and
// successors. We intend this dedication to be an overt act of
// relinquishment in perpetuity of all present and future rights to this
// software under copyright law.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//
// For more information, please refer to <https://unlicense.org/>

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