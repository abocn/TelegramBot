// Ported and improved from BubbalooTeam's PyCoala bot
// Copyright (c) 2024 BubbalooTeam. (https://github.com/BubbalooTeam)
// Minor code changes by lucmsilva (https://github.com/lucmsilva651)

const axios = require('axios');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

const statusEmojis = {
  0: '⛈', 1: '⛈', 2: '⛈', 3: '⛈', 4: '⛈', 5: '🌨', 6: '🌨', 7: '🌨',
  8: '🌨', 9: '🌨', 10: '🌨', 11: '🌧', 12: '🌧', 13: '🌨', 14: '🌨',
  15: '🌨', 16: '🌨', 17: '⛈', 18: '🌧', 19: '🌫', 20: '🌫', 21: '🌫',
  22: '🌫', 23: '🌬', 24: '🌬', 25: '🌨', 26: '☁️', 27: '🌥', 28: '🌥',
  29: '⛅️', 30: '⛅️', 31: '🌙', 32: '☀️', 33: '🌤', 34: '🌤', 35: '⛈',
  36: '🔥', 37: '🌩', 38: '🌩', 39: '🌧', 40: '🌧', 41: '❄️', 42: '❄️',
  43: '❄️', 44: 'n/a', 45: '🌧', 46: '🌨', 47: '🌩'
};

const getStatusEmoji = (statusCode) => statusEmojis[statusCode] || 'n/a';

function getLocaleUnit(countryCode) {
  const fahrenheitCountries = ['US', 'BS', 'BZ', 'KY', 'LR'];

  if (fahrenheitCountries.includes(countryCode)) {
    return { temperatureUnit: 'F', speedUnit: 'mph', apiUnit: 'e' };
  } else {
    return { temperatureUnit: 'C', speedUnit: 'km/h', apiUnit: 'm' };
  }
}

module.exports = (bot) => {
  bot.command(['clima', 'weather'], spamwatchMiddleware, async (ctx) => {
    const userLang = ctx.from.language_code || "en-US";
    const Strings = getStrings(userLang);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ');

    if (!userInput) {
      return ctx.reply(Strings.weatherStatus.provideLocation, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    }

    const location = userInput;
    const apiKey = process.env.weatherKey;

    try {
      const locationResponse = await axios.get('https://api.weather.com/v3/location/search', {
        params: {
          apiKey: apiKey,
          format: 'json',
          language: userLang,
          query: location,
        },
      });

      const locationData = locationResponse.data.location;
      if (!locationData || !locationData.address) {
        return ctx.reply(Strings.weatherStatus.invalidLocation, {
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message.message_id
        });
      }

      const addressFirst = locationData.address[0];
      const latFirst = locationData.latitude[0];
      const lonFirst = locationData.longitude[0];
      const countryCode = locationData.countryCode[0];
      const { temperatureUnit, speedUnit, apiUnit } = getLocaleUnit(countryCode);

      const weatherResponse = await axios.get('https://api.weather.com/v3/aggcommon/v3-wx-observations-current', {
        params: {
          apiKey: apiKey,
          format: 'json',
          language: userLang,
          geocode: `${latFirst},${lonFirst}`,
          units: apiUnit,
        },
      });

      const weatherData = weatherResponse.data['v3-wx-observations-current'];
      const { temperature, temperatureFeelsLike, relativeHumidity, windSpeed, iconCode, wxPhraseLong } = weatherData;

      const weatherMessage = Strings.weatherStatus.resultMsg
        .replace('{addressFirst}', addressFirst)
        .replace('{getStatusEmoji(iconCode)}', getStatusEmoji(iconCode))
        .replace('{wxPhraseLong}', wxPhraseLong)
        .replace('{temperature}', temperature)
        .replace('{temperatureFeelsLike}', temperatureFeelsLike)
        .replace('{temperatureUnit}', temperatureUnit)
        .replace('{temperatureUnit2}', temperatureUnit)
        .replace('{relativeHumidity}', relativeHumidity)
        .replace('{windSpeed}', windSpeed)
        .replace('{speedUnit}', speedUnit);

      ctx.reply(weatherMessage, { 
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      const message = Strings.weatherStatus.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    }
  });
};