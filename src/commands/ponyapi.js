const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require("axios");
const { verifyInput } = require('../plugins/verifyInput.js');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (bot) => {
  bot.command("mlp", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);

    ctx.reply(Strings.ponyApi.helpDesc, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command("mlpchar", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");
    const { noCharName } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noCharName)) {
      return;
    };

    const capitalizedInput = capitalizeFirstLetter(userInput);
    const apiUrl = `${Resources.ponyApi}/character/${capitalizedInput}`;

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
            id: character.id,
            name: character.name,
            alias: aliases.length > 0 ? aliases.join(', ') : 'None',
            url: character.url,
            sex: character.sex,
            residence: character.residence ? character.residence.replace(/\n/g, ' / ') : 'None',
            occupation: character.occupation ? character.occupation.replace(/\n/g, ' / ') : 'None',
            kind: character.kind ? character.kind.join(', ') : 'None',
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
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpep", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");

    const { noEpisodeNum } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noEpisodeNum, true)) {
      return;
    };

    const apiUrl = `${Resources.ponyApi}/episode/by-overall/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const episodeArray = [];

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
            storyby: episode.storyby ? episode.storyby.replace(/\n/g, ' / ') : 'None',
            writtenby: episode.writtenby ? episode.writtenby.replace(/\n/g, ' / ') : 'None',
            storyboard: episode.storyboard ? episode.storyboard.replace(/\n/g, ' / ') : 'None',
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
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });

  bot.command("mlpcomic", spamwatchMiddleware, async (ctx) => {
    const Strings = getStrings(ctx.from.language_code);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ').replace(" ", "+");

    const { noComicName } = Strings.ponyApi

    if (verifyInput(ctx, userInput, noComicName)) {
      return;
    };

    const apiUrl = `${Resources.ponyApi}/comics-story/${userInput}`;

    try {
      const response = await axios(apiUrl);
      const comicArray = [];
      console.log(response.data.data)
      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(comic => {
          comicArray.push({
            id: comic.id,
            name: comic.name,
            series: comic.series,
            image: comic.image,
            url: comic.url,
            writer: comic.writer ? comic.writer.replace(/\n/g, ' / ') : 'None',
            artist: comic.artist ? comic.artist.replace(/\n/g, ' / ') : 'None',
            colorist: comic.colorist ? comic.colorist.replace(/\n/g, ' / ') : 'None',
            letterer: comic.letterer ? comic.letterer.replace(/\n/g, ' / ') : 'None',
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
      const message = Strings.ponyApi.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_to_message_id: ctx.message.message_id
      });
    };
  });
};
