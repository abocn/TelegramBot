// CHECK-COMMAND-DISABLED.TS
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

import { Context } from 'telegraf';
import { replyToMessageId } from './reply-to-message-id';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

export async function isCommandDisabled(ctx: Context, db: NodePgDatabase<typeof schema>, commandId: string): Promise<boolean> {
  if (!ctx.from) return false;

  const telegramId = String(ctx.from.id);

  try {
    const user = await db.query.usersTable.findFirst({
      where: (fields, { eq }) => eq(fields.telegramId, telegramId),
      columns: {
        disabledCommands: true,
        disabledAdminCommands: true,
        languageCode: true,
      },
    });

    if (!user) return false;

    const isAdminCommand = commandId.startsWith('admin-');
    const disabledList = isAdminCommand ? user.disabledAdminCommands : user.disabledCommands;
    const isDisabled = disabledList?.includes(commandId) || false;

    if (isDisabled) {
      const { Strings } = await getUserAndStrings(ctx, db);
      const frontUrl = process.env.frontUrl || 'https://kowalski.social';
      const reply_to_message_id = replyToMessageId(ctx);

      await ctx.reply(
        Strings.commandDisabled.replace('{frontUrl}', frontUrl),
        {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        }
      );
    }

    return isDisabled;
  } catch (error) {
    console.error('[💽 DB] Error checking disabled commands:', error);
    return false;
  }
}
