const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
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

const timeoutPromise = (timeout) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout: Check took too long'));
    }, timeout);
  });
};

const getApproxSize = async (command, videoUrl) => {
  const args = [videoUrl, '--compat-opt', 'manifest-filesize-approx', '-O', 'filesize_approx'];
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
    const tempMp4File = path.resolve(`tmp/${userId}.f137.mp4`);
    const tempWebmFile = path.resolve(`tmp/${userId}.f251.webm`);
    const mp4File = path.resolve(`tmp/${userId}.mp4`);
    let cmdArgs = "";
    const dlpCommand = ytDlpPath;
    const ffmpegPath = getFfmpegPath();
    const ffmpegArgs = [
      '-i', tempMp4File,
      '-i', tempWebmFile,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-strict', '-2',
      mp4File
    ];

    if (!videoUrl) {
      return ctx.reply(Strings.ytDownload.noLink, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message.message_id
      });
    };

    const downloadingMessage = await ctx.reply(Strings.ytDownload.checkingSize, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id,
    });
    
    try {
      if (fs.existsSync(ytDlpPath)) {
        let videoFormat = '-f bestvideo+bestaudio';
        
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          downloadingMessage.message_id,
          null,
          Strings.ytDownload.downloadingVid, {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id,
          },
        );
        if (fs.existsSync(path.resolve(__dirname, "../props/cookies.txt"))) {
          cmdArgs = "--max-filesize 2G --no-playlist --cookies src/props/cookies.txt --merge-output-format mp4 -o";
        } else {
          cmdArgs = `--max-filesize 2G --no-playlist --merge-output-format mp4 -o`;
        }
        let dlpArgs = [videoUrl, videoFormat, ...cmdArgs.split(' '), mp4File];

        await ctx.telegram.editMessageText(
          ctx.chat.id,
          downloadingMessage.message_id,
          null,
          Strings.ytDownload.uploadingVid, {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id,
          },
        );

        await downloadFromYoutube(dlpCommand, dlpArgs);

        if(fs.existsSync(tempMp4File)){
            await downloadFromYoutube(ffmpegPath, ffmpegArgs);
        }

        if (fs.existsSync(mp4File)) {
          const videoStats = fs.statSync(mp4File);
          const videoSize = videoStats.size;
          const videoSizeInMb = videoSize/(1024*1024);
          if(videoSizeInMb >= 50){
            fs.unlinkSync(mp4File);
            videoFormat = '-f best';
            dlpArgs = [videoUrl, videoFormat, ...cmdArgs.split(' '), mp4File];
            await downloadFromYoutube(dlpCommand, dlpArgs);
          }
          const message = Strings.ytDownload.msgDesc.replace("{userMention}", `[${ctx.from.first_name}](tg://user?id=${userId})`)

          try {
            await ctx.replyWithVideo({
              source: mp4File }, {
              caption: message,
              parse_mode: 'Markdown',
              reply_to_message_id: ctx.message.message_id,
            });
            
            fs.unlinkSync(mp4File);
            fs.unlinkSync(tempMp4File);
            fs.unlinkSync(tempWebmFile);
          } catch (error) {
            if (toString(error).includes("Request Entity Too Large")) {
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
      console.error(error);
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