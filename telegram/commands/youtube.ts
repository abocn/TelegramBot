import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { execFile } from 'child_process';
import { isCommandDisabled } from '../utils/check-command-disabled';
import os from 'os';
import fs from 'fs';
import path from 'path';
import * as ytUrl from 'youtube-url';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

const ytDlpPaths = {
  linux: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp'),
  win32: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp.exe'),
  darwin: path.resolve(__dirname, '../plugins/yt-dlp/yt-dlp_macos'),
};

const getYtDlpPath = () => {
  const { execSync } = require('child_process');
  try {
    const systemYtDlp = execSync('which yt-dlp', { encoding: 'utf8' }).trim();
    if (systemYtDlp) {
      console.log('[i] Using system yt-dlp:', systemYtDlp);
      return systemYtDlp;
    }
  } catch (error) {
    console.error('[!] System yt-dlp not found:', error.message);
  }

  const platform = os.platform();
  const bundledPath = ytDlpPaths[platform] || ytDlpPaths.linux;
  console.log('[i] Using bundled yt-dlp:', bundledPath);
  return bundledPath;
};


const ffmpegPaths = {
  linux: '/usr/bin/ffmpeg',
  win32: path.resolve(__dirname, '../plugins/ffmpeg/bin/ffmpeg.exe'),
};

const getFfmpegPath = () => {
  const platform = os.platform();
  return ffmpegPaths[platform] || ffmpegPaths.linux;
};

const downloadFromYoutube = async (command: string, args: string[]): Promise<{ stdout: string; stderr: string }> => {
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

const getApproxSize = async (command: string, videoUrl: string): Promise<number> => {
  let args: string[] = [];
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

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default (bot, db: NodePgDatabase<typeof schema>) => {
  bot.command(['yt', 'ytdl', 'sdl', 'video', 'dl'], spamwatchMiddleware, async (ctx) => {
    const startTime = Date.now();

    if (await isCommandDisabled(ctx, db, 'youtube-download')) return;

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      const ytDlpPath = getYtDlpPath();
      const userId: number = ctx.from.id;
      const videoUrl: string = ctx.message.text.split(' ').slice(1).join(' ');
      const videoIsYoutube: boolean = ytUrl.valid(videoUrl);
      const randId: string = Math.random().toString(36).substring(2, 15);
      const mp4File: string = `tmp/${userId}-${randId}.mp4`;
      const tempMp4File: string = `tmp/${userId}-${randId}.f137.mp4`;
      const tempWebmFile: string = `tmp/${userId}-${randId}.f251.webm`;
      let cmdArgs: string = "";
      const dlpCommand: string = ytDlpPath;
      const ffmpegPath: string = getFfmpegPath();
      const ffmpegArgs: string[] = ['-i', tempMp4File, '-i', tempWebmFile, '-c:v copy -c:a copy -strict -2', mp4File];

      /*
      for now, no checking is done for the video url
      yt-dlp should handle the validation, though it supports too many sites to hard-code
      */
      if (!videoUrl) {
        return ctx.reply(Strings.ytDownload.noLink, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      }

      // make sure its a valid url
      if (!isValidUrl(videoUrl)) {
        console.log("[!] Invalid URL:", videoUrl)
        return ctx.reply(Strings.ytDownload.noLink, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      }

      console.log(`\nDownload Request:\nURL: ${videoUrl}\nYOUTUBE: ${videoIsYoutube}\n`)

      if (fs.existsSync(path.resolve(__dirname, "../props/cookies.txt"))) {
        cmdArgs = "--max-filesize 2G --no-playlist --cookies telegram/props/cookies.txt --merge-output-format mp4 -o";
      } else {
        cmdArgs = `--max-filesize 2G --no-playlist --merge-output-format mp4 -o`;
      }

      try {
        const downloadingMessage = await ctx.reply(Strings.ytDownload.checkingSize, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id,
        });

        if (ytDlpPath.startsWith('/') || fs.existsSync(ytDlpPath)) {
          const approxSizeInMB = await Promise.race([
            getApproxSize(ytDlpPath, videoUrl),
          ]);

          if (approxSizeInMB > 50) {
            console.log("[!] Video size exceeds 50MB:", approxSizeInMB)
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

          console.log("[i] Downloading video...")
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

          console.log("[i] Uploading video...")
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
        console.log("[i] Request completed\n")
      } catch (error) {
        let errMsg = Strings.ytDownload.uploadErr

        if (error.stderr && error.stderr.includes("--cookies-from-browser")) {
          console.log("[!] Ratelimited by video provider:", error.stderr)
          errMsg = Strings.ytDownload.botDetection
          if (error.stderr.includes("youtube")) {
            errMsg = Strings.ytDownload.botDetection.replace("video provider", "YouTube")
          }
        } else {
          console.log("[!]", error.stderr || error.message)
        }

        // will no longer edit the message as the message context is not outside the try block
        await ctx.reply(errMsg, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id,
        });

        throw error;
      }

      const commandName = ctx.message?.text?.startsWith('/yt') ? 'yt' :
                          ctx.message?.text?.startsWith('/ytdl') ? 'ytdl' :
                          ctx.message?.text?.startsWith('/sdl') ? 'sdl' :
                          ctx.message?.text?.startsWith('/video') ? 'video' : 'dl';
      await trackCommand(db, ctx, commandName, true, undefined, startTime);
    } catch (error) {
      const commandName = ctx.message?.text?.startsWith('/yt') ? 'yt' :
                          ctx.message?.text?.startsWith('/ytdl') ? 'ytdl' :
                          ctx.message?.text?.startsWith('/sdl') ? 'sdl' :
                          ctx.message?.text?.startsWith('/video') ? 'video' : 'dl';
      await trackCommand(db, ctx, commandName, false, error.message, startTime);
      throw error;
    }
  });
};