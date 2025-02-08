const Resources = require('../props/resources.json');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

async function downloadModule(moduleId) {
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

module.exports = (bot) => {
  bot.command(['modarchive', 'tma'], spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const moduleId = ctx.message.text.split(' ')[1];

    if (moduleId == NaN || null) {
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
