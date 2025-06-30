import Resources from '../props/resources.json';
import fs from 'fs';
import axios from 'axios';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

const scrobbler_url = Resources.lastFmApi;
const api_key = process.env.lastKey;

const dbFile = 'src/props/lastfm.json';
let users = {};

function loadUsers() {
  if (!fs.existsSync(dbFile)) {
    console.log(`WARN: Last.fm user database ${dbFile} not found. Creating a new one.`);
    saveUsers();
    return;
  }

  try {
    const data = fs.readFileSync(dbFile, 'utf-8');
    users = JSON.parse(data);
  } catch (err) {
    console.log("WARN: Error loading the Last.fm user database:", err);
    users = {};
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error("WARN: Error saving Last.fm users:", err);
  }
}

async function getFromMusicBrainz(mbid: string) {
  try {
    const response = await axios.get(`${Resources.musicBrainzApi}${mbid}`);
    const imgObjLarge = response.data.images[0]?.thumbnails?.['1200'];
    const imgObjMid = response.data.images[0]?.thumbnails?.large;
    const imageUrl = imgObjLarge || imgObjMid || '';
    return imageUrl;
  } catch (error) {
    return undefined;
  }
}


function getFromLast(track) {
  if (!track || !track.image) return '';

  const imageExtralarge = track.image.find(img => img.size === 'extralarge');
  const imageMega = track.image.find(img => img.size === 'mega');
  const imageUrl = (imageExtralarge?.['#text']) || (imageMega?.['#text']) || '';

  return imageUrl;
}

export default (bot) => {
  loadUsers();

  bot.command('setuser', (ctx) => {
    const userId = ctx.from.id;
    const Strings = getStrings(ctx.from.language_code);
    const lastUser = ctx.message.text.split(' ')[1];

    if (!lastUser) {
      return ctx.reply(Strings.lastFm.noUser, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    };

    users[userId] = lastUser;
    saveUsers();

    const message = Strings.lastFm.userHasBeenSet.replace('{lastUser}', lastUser);

    ctx.reply(message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
    });
  });

  bot.command(['lt', 'lmu', 'last', 'lfm'], spamwatchMiddleware, async (ctx) => {
    const userId = ctx.from.id;
    const Strings = getStrings(ctx.from.language_code);
    const lastfmUser = users[userId];
    const genericImg = Resources.lastFmGenericImg;
    const botInfo = await ctx.telegram.getMe();

    if (!lastfmUser) {
      return ctx.reply(Strings.lastFm.noUserSet, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    };

    try {
      const response = await axios.get(scrobbler_url, {
        params: {
          method: 'user.getRecentTracks',
          user: lastfmUser,
          api_key,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': `@${botInfo.username}-node-telegram-bot`
        }
      });

      const track = response.data.recenttracks.track[0];

      if (!track) {
        const noRecent = Strings.lastFm.noRecentTracks.replace('{lastfmUser}', lastfmUser);
        return ctx.reply(noRecent, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      };

      const trackName = track.name;
      const artistName = track.artist['#text'];
      const nowPlaying = track['@attr'] && track['@attr'].nowplaying ? Strings.varStrings.varIs : Strings.varStrings.varWas;
      const albumMbid = track.album.mbid;

      let imageUrl = "";

      if (albumMbid) {
        imageUrl = await getFromMusicBrainz(albumMbid);
      }

      if (!imageUrl) {
        imageUrl = getFromLast(track);
      }

      if (imageUrl == genericImg) {
        imageUrl = "";
      }

      const trackUrl = `https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`;
      const artistUrl = `https://www.last.fm/music/${encodeURIComponent(artistName)}`;
      const userUrl = `https://www.last.fm/user/${encodeURIComponent(lastfmUser)}`;

      let num_plays = 0;
      try {
        const response_plays = await axios.get(scrobbler_url, {
          params: {
            method: 'track.getInfo',
            api_key,
            track: trackName,
            artist: artistName,
            username: lastfmUser,
            format: 'json',
          },
          headers: {
            'User-Agent': `@${botInfo.username}-node-telegram-bot`
          }
        });

        num_plays = response_plays.data.track.userplaycount;
      } catch (err) {
        console.log(err)
        const message = Strings.lastFm.apiErr
          .replace("{lastfmUser}", `[${lastfmUser}](${userUrl})`)
          .replace("{err}", err);
        ctx.reply(message, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      };

      let message = Strings.lastFm.listeningTo
        .replace("{lastfmUser}", `[${lastfmUser}](${userUrl})`)
        .replace("{nowPlaying}", nowPlaying)
        .replace("{trackName}", `[${trackName}](${trackUrl})`)
        .replace("{artistName}", `[${artistName}](${artistUrl})`)

      if (`${num_plays}` !== "0" && `${num_plays}` !== "1" && `${num_plays}` !== "2" && `${num_plays}` !== "3") {
        message = message
          .replace("{playCount}", Strings.lastFm.playCount)
          .replace("{plays}", `${num_plays}`);
      } else {
        message = message
          .replace("{playCount}", Strings.varStrings.varTo);
      };

      if (imageUrl) {
        ctx.replyWithPhoto(imageUrl, {
          caption: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      } else {
        ctx.reply(message, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
        });
      };
    } catch (err) {
      const userUrl = `https://www.last.fm/user/${encodeURIComponent(lastfmUser)}`;
      const message = Strings.lastFm.apiErr
        .replace("{lastfmUser}", `[${lastfmUser}](${userUrl})`)
        .replace("{err}", err);
      ctx.reply(message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...(ctx.message?.message_id ? { reply_parameters: { message_id: ctx.message.message_id } } : {})
      });
    };
  });
};
