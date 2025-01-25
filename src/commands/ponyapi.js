const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require("axios");

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (bot) => {
  bot.command("mlp", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);

    ctx.reply(Strings.myLittlePonyDesc, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command("mlpchar", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");

    if (!userInput) {
      ctx.reply(Strings.ponyApi.noCharName, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    };

    const capitalizedInput = capitalizeFirstLetter(userInput);
    const apiUrl = `http://ponyapi.net/v1/character/${capitalizedInput}`;

    try {
      const response = await axios(apiUrl);
      const charactersArray = [];

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(character => {
          let aliases = [];
          if (character.alias) {
            if (typeof character.alias === 'string') {
              aliases.push(character.alias);
            } else if (Array.isArray(character.alias)) {
              aliases = aliases.concat(character.alias);
            }
          }

          charactersArray.push({
            name: character.name,
            alias: aliases.length > 0 ? aliases.join(', ') : 'N/A',
            url: character.url,
            sex: character.sex,
            residence: character.residence ? character.residence.replace(/\n/g, ' / ') : 'N/A',
            occupation: character.occupation ? character.occupation.replace(/\n/g, ' / ') : 'N/A',
            kind: character.kind ? character.kind.join(', ') : 'N/A',
            image: character.image
          });
        });
      };

      if (charactersArray.length > 0) {
        const result = Strings.ponyApi.charRes
          .replace("{input}", userInput)
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
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noCharFound, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      console.error(error);
      ctx.reply(Strings.ponyApi.apiErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpep", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ');

    if (!userInput) {
      ctx.reply(Strings.ponyApi.noEpisodeNum, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    };

    const apiUrl = `http://ponyapi.net/v1/episode/by-overall/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const episodeArray = [];

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(episode => {
          episodeArray.push({
            name: episode.name,
            image: episode.image,
            url: episode.url,
            season: episode.season,
            episode: episode.episode,
            overall: episode.overall,
            airdate: episode.airdate,
            storyby: episode.storyby ? episode.storyby.replace(/\n/g, ' / ') : 'N/A',
            writtenby: episode.writtenby ? episode.writtenby.replace(/\n/g, ' / ') : 'N/A',
            storyboard: episode.storyboard ? episode.storyboard.replace(/\n/g, ' / ') : 'N/A',
          });
        });
      };

      if (episodeArray.length > 0) {
        const result = Strings.ponyApi.epRes
          .replace("{input}", userInput)
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
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noEpisodeFound, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      console.error(error);
      ctx.reply(Strings.ponyApi.apiErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpcomic", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ');

    if (!userInput) {
      ctx.reply(Strings.ponyApi.noComicName, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
      return;
    };

    const apiUrl = `http://ponyapi.net/v1/comics-story/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const comicArray = [];
      console.log(response.data.data)
      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(comic => {
          comicArray.push({
            name: comic.name,
            series: comic.series,
            image: comic.image,
            url: comic.url,
            writer: comic.writer ? comic.writer.replace(/\n/g, ' / ') : 'N/A',
            artist: comic.artist ? comic.artist.replace(/\n/g, ' / ') : 'N/A',
            colorist: comic.colorist ? comic.colorist.replace(/\n/g, ' / ') : 'N/A',
            letterer: comic.letterer ? comic.letterer.replace(/\n/g, ' / ') : 'N/A',
            editor: comic.editor
          });
        });
      };

      if (comicArray.length > 0) {
        const result = Strings.ponyApi.comicRes
          .replace("{input}", userInput)
          .replace("{name}", comicArray[0].name)
          .replace("{series}", comicArray[0].series)
          .replace("{url}", comicArray[0].url)
          .replace("{writer}", comicArray[0].writer)
          .replace("{artist}", comicArray[0].artist)
          .replace("{colorist}", comicArray[0].colorist)
          .replace("{letterer}", comicArray[0].writtenby)
          .replace("{editor}", comicArray[0].editor);

        ctx.replyWithPhoto(comicArray[0].image, {
          caption: `${result}`,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message.message_id
        });
      } else {
        ctx.reply(Strings.ponyApi.noComicFound, {
          parse_mode: 'Markdown',
          reply_to_message_id: ctx.message.message_id
        });
      };
    } catch (error) {
      console.error(error);
      ctx.reply(Strings.ponyApi.apiErr, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });
};
