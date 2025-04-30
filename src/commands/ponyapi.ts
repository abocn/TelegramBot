import Resources from '../props/resources.json';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import axios from 'axios';
import verifyInput from '../plugins/verifyInput';
import { Telegraf, Context } from 'telegraf';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

interface Character {
  id: string;
  name: string;
  alias: string;
  url: string;
  sex: string;
  residence: string;
  occupation: string;
  kind: string;
  image: string[];
}

interface Episode {
  id: string;
  name: string;
  image: string;
  url: string;
  season: string;
  episode: string;
  overall: string;
  airdate: string;
  storyby: string;
  writtenby: string;
  storyboard: string;
}

interface Comic {
  id: string;
  name: string;
  series: string;
  image: string;
  url: string;
  writer: string;
  artist: string;
  colorist: string;
  letterer: string;
  editor: string;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default (bot: Telegraf<Context>) => {
  bot.command("mlp", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');

    ctx.reply(Strings.ponyApi.helpDesc, {
      parse_mode: 'Markdown',
      // @ts-ignore
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command("mlpchar", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");
    const { noCharName } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noCharName)) {
      return;
    }

    const capitalizedInput = capitalizeFirstLetter(userInput);
    const apiUrl = `${Resources.ponyApi}/character/${capitalizedInput}`;

    try {
      const response = await axios(apiUrl);
      const charactersArray: Character[] = [];

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(character => {
          let aliases: string[] = [];
          if (character.alias) {
            if (typeof character.alias === 'string') {
              aliases.push(character.alias);
            } else if (Array.isArray(character.alias)) {
              aliases = aliases.concat(character.alias);
            }
          }

          charactersArray.push({
            id: character.id,
            name: character.name,
            alias: aliases.length > 0 ? aliases.join(', ') : Strings.varStrings.varNone,
            url: character.url,
            sex: character.sex,
            residence: character.residence ? character.residence.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            occupation: character.occupation ? character.occupation.replace(/\n/g, ' / ') : Strings.varStrings.varNone,
            kind: character.kind ? character.kind.join(', ') : Strings.varStrings.varNone,
            image: character.image
          });
        });
      };

      if (charactersArray.length > 0) {
        const result = Strings.ponyApi.charRes
          .replace("{id}", charactersArray[0].id)
          .replace("{name}", charactersArray[0].name)
          .replace("{alias}", charactersArray[0].alias)
          .replace("{url}", charactersArray[0].url)
          .replace("{sex}", charactersArray[0].sex)
          .replace("{residence}", charactersArray[0].residence)
          .replace("{occupation}", charactersArray[0].occupation)
          .replace("{kind}", charactersArray[0].kind);

        ctx.replyWithPhoto(charactersArray[0].image[0], {
          caption: `${result}`,
          parse_mode: 'Markdown',
          // @ts-ignore
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noCharFound, {
          parse_mode: 'Markdown',
          // @ts-ignore
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpep", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");

    const { noEpisodeNum } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noEpisodeNum, true)) {
      return;
    }

    const apiUrl = `${Resources.ponyApi}/episode/by-overall/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const episodeArray: Episode[] = [];

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(episode => {
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
          // @ts-ignore
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noEpisodeFound, {
          parse_mode: 'Markdown',
          // @ts-ignore
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpcomic", spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    const Strings = getStrings(ctx.from?.language_code || 'en');
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");

    const { noComicName } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noComicName)) {
      return;
    };

    const apiUrl = `${Resources.ponyApi}/comics-story/${userInput}`;

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
          // @ts-ignore
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noComicFound, {
          parse_mode: 'Markdown',
          // @ts-ignore
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        // @ts-ignore
        reply_to_message_id: ctx.message.message_id
      });
    };
  });
};
