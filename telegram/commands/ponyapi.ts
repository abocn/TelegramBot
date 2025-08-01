import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Telegraf, Context } from 'telegraf';
import { languageCode } from '../utils/language-code';
import { replyToMessageId } from '../utils/reply-to-message-id';
import { isCommandDisabled } from '../utils/check-command-disabled';
import { Character, Episode, Comic } from '../types/mlp';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

function capitalizeFirstLetter(letter: string) {
  return letter.charAt(0).toUpperCase() + letter.slice(1);
}

function sendReply(ctx: Context, text: string, reply_to_message_id?: number) {
  return ctx.reply(text, {
    parse_mode: 'Markdown',
    ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
  });
}

function sendPhoto(ctx: Context, photo: string, caption: string, reply_to_message_id?: number) {
  return ctx.replyWithPhoto(photo, {
    caption,
    parse_mode: 'Markdown',
    ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
  });
}

export default (bot: Telegraf<Context>, db) => {
  bot.command("mlp", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'mlp-content')) return;

    const Strings = getStrings(languageCode(ctx));
    const reply_to_message_id = replyToMessageId(ctx);
    sendReply(ctx, Strings.ponyApi.helpDesc, reply_to_message_id);
  });

  bot.command("mlpchar", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'mlp-content')) return;

    const { message } = ctx;
    const reply_to_message_id = replyToMessageId(ctx);
    const Strings = getStrings(languageCode(ctx) || 'en');
    const userInput = message.text.split(' ').slice(1).join(' ').trim();
    const { noCharName } = Strings.ponyApi;

    if (verifyInput(ctx, userInput, noCharName)) return;
    if (!userInput || /[^a-zA-Z0-9\s]/.test(userInput) || userInput.length > 30) {
      return sendReply(ctx, Strings.mlpInvalidCharacter, reply_to_message_id);
    }

    const capitalizedInput = capitalizeFirstLetter(userInput);
    const apiUrl = `${Resources.ponyApi}/character/${capitalizedInput.replace(/ /g, "+")}`;

    try {
      const response = await axios(apiUrl);
      const data = response.data.data;
      if (Array.isArray(data) && data.length > 0) {
        const character: Character = data[0];
        const aliases = Array.isArray(character.alias)
          ? character.alias.join(', ')
          : character.alias || Strings.varStrings.varNone;
        const result = Strings.ponyApi.charRes
          .replace("{id}", character.id)
          .replace("{name}", character.name)
          .replace("{alias}", aliases)
          .replace("{url}", character.url)
          .replace("{sex}", character.sex)
          .replace("{residence}", character.residence ? character.residence.replace(/\n/g, ' / ') : Strings.varStrings.varNone)
          .replace("{occupation}", character.occupation ? character.occupation.replace(/\n/g, ' / ') : Strings.varStrings.varNone)
          .replace("{kind}", Array.isArray(character.kind) ? character.kind.join(', ') : Strings.varStrings.varNone);
        sendPhoto(ctx, character.image[0], result, reply_to_message_id);
      } else {
        sendReply(ctx, Strings.ponyApi.noCharFound, reply_to_message_id);
      }
    } catch (error: any) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message || 'Unknown error');
      sendReply(ctx, message, reply_to_message_id);
    }
  });

  bot.command("mlpep", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'mlp-content')) return;

    const Strings = getStrings(languageCode(ctx) || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");
    const reply_to_message_id = replyToMessageId(ctx);

    const { noEpisodeNum } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noEpisodeNum, true)) {
      return;
    }

    if (Number(userInput) > 10000) {
      ctx.reply(Strings.mlpInvalidEpisode, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
      return;
    }

    const apiUrl = `${Resources.ponyApi}/episode/by-overall/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const episodeArray: Episode[] = [];

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach((episode: Episode) => {
          episodeArray.push({
            id: episode.id,
            name: episode.name,
            image: episode.image,
            url: episode.url,
            season: episode.season,
            episode: episode.episode,
            overall: episode.overall,
            airdate: episode.airdate,
            storyby: episode.storyby ? episode.storyby.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            writtenby: episode.writtenby ? episode.writtenby.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            storyboard: episode.storyboard ? episode.storyboard.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
          });
        });
      };

      if (episodeArray.length > 0) {
        const result = Strings.ponyApi.epRes
          .replace("{id}", episodeArray[0].id)
          .replace("{name}", episodeArray[0].name)
          .replace("{url}", episodeArray[0].url)
          .replace("{season}", episodeArray[0].season)
          .replace("{episode}", episodeArray[0].episode)
          .replace("{overall}", episodeArray[0].overall)
          .replace("{airdate}", episodeArray[0].airdate)
          .replace("{storyby}", episodeArray[0].storyby)
          .replace("{writtenby}", episodeArray[0].writtenby)
          .replace("{storyboard}", episodeArray[0].storyboard);

        ctx.replyWithPhoto(episodeArray[0].image, {
          caption: `${result}`,
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      } else {
        ctx.reply(Strings.ponyApi.noEpisodeFound, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      };
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
    };
  });

  bot.command("mlpcomic", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'mlp-content')) return;

    const Strings = getStrings(languageCode(ctx) || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ');
    const reply_to_message_id = replyToMessageId(ctx);

    const { noComicName } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noComicName)) {
      return;
    };

    // if special characters (max 30 characters)
    if (/[^a-zA-Z0-9\s]/.test(userInput) || userInput.length > 30) {
      ctx.reply(Strings.ponyApi.noComicName, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
      return;
    }

    const apiUrl = `${Resources.ponyApi}/comics-story/${userInput.replace(/ /g, "+")}`;

    try {
      const response = await axios(apiUrl);
      const comicArray: Comic[] = [];
      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(comic => {
          let letterers: string[] = [];
          if (comic.letterer) {
            if (typeof comic.letterer === 'string') {
              letterers.push(comic.letterer);
            } else if (Array.isArray(comic.letterer)) {
              letterers = letterers.concat(comic.letterer);
            }
          }
          comicArray.push({
            id: comic.id,
            name: comic.name,
            series: comic.series,
            image: comic.image,
            url: comic.url,
            writer: comic.writer ? comic.writer.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            artist: comic.artist ? comic.artist.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            colorist: comic.colorist ? comic.colorist.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            letterer: letterers.length > 0 ? letterers.join(', ') : Strings.varStrings.varNone,
            editor: comic.editor
          });
        });
      };

      if (comicArray.length > 0) {
        const result = Strings.ponyApi.comicRes
          .replace("{id}", comicArray[0].id)
          .replace("{name}", comicArray[0].name)
          .replace("{series}", comicArray[0].series)
          .replace("{url}", comicArray[0].url)
          .replace("{writer}", comicArray[0].writer)
          .replace("{artist}", comicArray[0].artist)
          .replace("{colorist}", comicArray[0].colorist)
          .replace("{letterer}", comicArray[0].letterer)
          .replace("{editor}", comicArray[0].editor);

        ctx.replyWithPhoto(comicArray[0].image, {
          caption: `${result}`,
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      } else {
        ctx.reply(Strings.ponyApi.noComicFound, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
        });
      };
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id ? { reply_parameters: { message_id: reply_to_message_id } } : {})
      });
    };
  });
};
