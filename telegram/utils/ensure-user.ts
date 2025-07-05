// ENSURE-USER.TS
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

import { usersTable } from '../../database/schema';

export async function ensureUserInDb(ctx, db) {
  if (!ctx.from) return;
  const telegramId = String(ctx.from.id);
  const username = ctx.from.username || '';
  const firstName = ctx.from.first_name || ' ';
  const lastName = ctx.from.last_name || ' ';
  const languageCode = ctx.from.language_code || 'en';

  const existing = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, telegramId), limit: 1 });
  if (existing.length === 0) {
    const userToInsert = {
      telegramId,
      username,
      firstName,
      lastName,
      languageCode,
      aiEnabled: false,
      showThinking: false,
      customAiModel: "deepseek-r1:1.5b",
      aiTemperature: 0.9,
      aiRequests: 0,
      aiCharacters: 0,
      disabledCommands: [],
      aiTimeoutUntil: null,
      aiMaxExecutionTime: 0,
    };
    try {
      await db.insert(usersTable).values(userToInsert);
      console.log(`[💽 DB] Added new user: ${username || firstName} (${telegramId})`);
    } catch (err) {
      console.error('[💽 DB] Error inserting user:', err);
      throw err;
    }
  }
}
