const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);
const { execFile } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const ytDlpPaths = {
  linux: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp'),
  win32: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp.exe'),
  darwin: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp_macos'),
};

const getYtDlpPath = () => {
  const platform = os.platform();
  return ytDlpPaths[platform] || ytDlpPaths.linux;
};


const ffmpegPaths = {
  linux: '/usr/bin/ffmpeg',
  win32: path.resolve(__dirname, '../plugins/ffmpeg/bin/ffmpeg.exe'),
};

const getFfmpegPath = () => {
  const platform = os.platform();
  return ffmpegPaths[platform] || ffmpegPaths.linux;
};

const downloadFromYoutube = async (command, args) => {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

const getApproxSize = async (command, videoUrl) => {
  let args = [];
  if (fs.existsSync(path.resolve(__dirname, "../props/cookies.txt"))) {
    args = [videoUrl, '--compat-opt', 'manifest-filesize-approx', '-O', 'filesize_approx', '--cookies', path.resolve(__dirname, "../props/cookies.txt")];
  } else {
    args = [videoUrl, '--compat-opt', 'manifest-filesize-approx', '-O', 'filesize_approx'];
  }
  try {
    const { stdout } = await downloadFromYoutube(command, args);
    const sizeInBytes = parseInt(stdout.trim(), 10);
    if (!isNaN(sizeInBytes)) {
      return sizeInBytes / (1024 * 1024);
    } else {
      return 0;
    }
  } catch (error) {
    throw error;
  }
};

module.exports = (bot) => {
  bot.command(['yt', 'ytdl', 'sdl', 'video', 'dl'], spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const ytDlpPath = getYtDlpPath();
    const userId = ctx.from.id;
    const videoUrl = ctx.message.text.split(' ').slice(1).join(' ');
    const mp4File = `tmp/${userId}.mp4`;
    const tempMp4File = `tmp/${userId}.f137.mp4`;
    const tempWebmFile = `tmp/${userId}.f251.webm`;
    let cmdArgs = "";
    const dlpCommand = ytDlpPath;
    const ffmpegPath = getFfmpegPath();
    const ffmpegArgs = ['-i', tempMp4File, '-i', tempWebmFile, '-c:v copy -c:a copy -strict -2', mp4File];

    if (!videoUrl) {
      return ctx.reply(Strings.ytDownload.noLink, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message.message_id
      });
    };

    if (fs.existsSync(path.resolve(__dirname, "../props/cookies.txt"))) {
      cmdArgs = "--max-filesize 2G --no-playlist --cookies src/props/cookies.txt --merge-output-format mp4 -o";
    } else {
      cmdArgs = `--max-filesize 2G --no-playlist --merge-output-format mp4 -o`;
    }

    try {
      const downloadingMessage = await ctx.reply(Strings.ytDownload.checkingSize, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id,
      });

      if (fs.existsSync(ytDlpPath)) {
        const approxSizeInMB = await Promise.race([
          getApproxSize(ytDlpPath, videoUrl),
        ]);

        if (approxSizeInMB > 50) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            downloadingMessage.message_id,
            null,
            Strings.ytDownload.uploadLimit, {
              parse_mode: 'Markdown',
              reply_to_message_id: ctx.message.message_id,
            },
          );

          return;
        }

        await ctx.telegram.editMessageText(
          ctx.chat.id,
          downloadingMessage.message_id,
          null,
          Strings.ytDownload.downloadingVid, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id,
        },
        );

        const dlpArgs = [videoUrl, ...cmdArgs.split(' '), mp4File];
        await downloadFromYoutube(dlpCommand, dlpArgs);

        await ctx.telegram.editMessageText(
          ctx.chat.id,
          downloadingMessage.message_id,
          null,
          Strings.ytDownload.uploadingVid, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id,
        },
        );

        if (fs.existsSync(tempMp4File)) {
          await downloadFromYoutube(ffmpegPath, ffmpegArgs);
        }

        if (fs.existsSync(mp4File)) {
          const message = Strings.ytDownload.msgDesc.replace("{userMention}", `[${ctx.from.first_name}](tg://user?id=${userId})`)

          try {
            await ctx.replyWithVideo({
              source: mp4File
            }, {
              caption: message,
              parse_mode: 'Markdown',
              reply_to_message_id: ctx.message.message_id,
            });

            fs.unlinkSync(mp4File);
          } catch (error) {
            if (error.response.description.includes("Request Entity Too Large")) {
              await ctx.telegram.editMessageText(
                ctx.chat.id,
                downloadingMessage.message_id,
                null,
                Strings.ytDownload.uploadLimit, {
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id,
              },
              );
            } else {
              const errMsg = Strings.ytDownload.uploadErr.replace("{error}", error)
              await ctx.telegram.editMessageText(
                ctx.chat.id,
                downloadingMessage.message_id,
                null,
                errMsg, {
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id,
              },
              );
            };

            fs.unlinkSync(mp4File);
          }
        } else {
          await ctx.reply(mp4File, {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id,
          });
        }
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          downloadingMessage.message_id,
          null,
          Strings.ytDownload.libNotFound, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id,
        },
        );
      }
    } catch (error) {
      const errMsg = Strings.ytDownload.uploadErr.replace("{error}", error)
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        downloadingMessage.message_id,
        null,
        errMsg, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id,
      },
      );
    }
  });
};