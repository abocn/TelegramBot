import Resources from '../props/resources.json';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { languageCode } from '../utils/language-code';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

interface ModuleResult {
  filePath: string;
  fileName: string;
}

async function downloadModule(moduleId: string): Promise<ModuleResult | null> {
  try {
    const downloadUrl = `${Resources.modArchiveApi}${moduleId}`;
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
    });
    const disposition = response.headers['content-disposition'];
    let fileName = moduleId;
    if (disposition && disposition.includes('filename=')) {
      fileName = disposition
        .split('filename=')[1]
        .split(';')[0]
        .replace(/['"]/g, '');
    }
    const filePath = path.join(__dirname, fileName);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ filePath, fileName }));
      writer.on('error', reject);
    });
  } catch (error) {
    return null;
  }
}

export const modarchiveHandler = async (ctx: Context) => {
  const Strings = getStrings(languageCode(ctx));
  const reply_to_message_id = replyToMessageId(ctx);
  const moduleId = ctx.message && 'text' in ctx.message && typeof ctx.message.text === 'string'
    ? ctx.message.text.split(' ')[1]?.trim()
    : undefined;
  if (!moduleId || !/^\d+$/.test(moduleId)) {
    return ctx.reply(Strings.maInvalidModule, {
      parse_mode: "Markdown",
      ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
    });
  }
  const result = await downloadModule(moduleId);
  if (result) {
    const { filePath, fileName } = result;
    const regexExtension = /\.\w+$/i;
    const hasExtension = regexExtension.test(fileName);
    if (hasExtension) {
      try {
        await ctx.replyWithDocument({ source: filePath }, {
          caption: fileName,
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      } finally {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
      return;
    }
  }
  return ctx.reply(Strings.maInvalidModule, {
    parse_mode: "Markdown",
    ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
  });
};

export default (bot: Telegraf<Context>) => {
  bot.command(['modarchive', 'tma'], spamwatchMiddleware, modarchiveHandler);
};
