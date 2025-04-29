import Resources from '../props/resources.json';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

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

    const filePath = path.resolve(__dirname, fileName);

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

export default (bot) => {
  bot.command(['modarchive', 'tma'], spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const moduleId = ctx.message.text.split(' ')[1];

    if (Number.isNaN(moduleId) || null) {
      return ctx.reply(Strings.maInvalidModule, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    }

    const result = await downloadModule(moduleId);

    if (result) {
      const { filePath, fileName } = result;

      await ctx.replyWithDocument({ source: filePath }, {
        caption: fileName,
        reply_to_message_id: ctx.message.message_id
      });

      fs.unlinkSync(filePath);
    } else {
      ctx.reply(Strings.maDownloadError, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
};
