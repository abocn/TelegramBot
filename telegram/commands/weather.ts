// Ported and improved from BubbalooTeam's PyCoala bot
// Copyright (c) 2024 BubbalooTeam. (https://github.com/BubbalooTeam)
// Minor code changes by lucmsilva (https://github.com/lucmsilva651)

import Resources from '../props/resources.json';
import axios from 'axios';
import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import verifyInput from '../plugins/verifyInput';
import { Context, Telegraf } from 'telegraf';
import { isCommandDisabled } from '../utils/check-command-disabled';

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

const statusEmojis = {
  0: '⛈', 1: '⛈', 2: '⛈', 3: '⛈', 4: '⛈', 5: '🌨', 6: '🌨', 7: '🌨',
  8: '🌨', 9: '🌨', 10: '🌨', 11: '🌧', 12: '🌧', 13: '🌨', 14: '🌨',
  15: '🌨', 16: '🌨', 17: '⛈', 18: '🌧', 19: '🌫', 20: '🌫', 21: '🌫',
  22: '🌫', 23: '🌬', 24: '🌬', 25: '🌨', 26: '☁️', 27: '🌥', 28: '🌥',
  29: '⛅️', 30: '⛅️', 31: '🌙', 32: '☀️', 33: '🌤', 34: '🌤', 35: '⛈',
  36: '🔥', 37: '🌩', 38: '🌩', 39: '🌧', 40: '🌧', 41: '❄️', 42: '❄️',
  43: '❄️', 44: 'n/a', 45: '🌧', 46: '🌨', 47: '🌩'
};

const getStatusEmoji = (statusCode: number) => statusEmojis[statusCode] || 'n/a';

function getLocaleUnit(countryCode: string) {
  const fahrenheitCountries: string[] = ['US', 'BS', 'BZ', 'KY', 'LR'];

  if (fahrenheitCountries.includes(countryCode)) {
    return { temperatureUnit: 'F', speedUnit: 'mph', apiUnit: 'e' };
  } else {
    return { temperatureUnit: 'C', speedUnit: 'km/h', apiUnit: 'm' };
  }
}

export default (bot: Telegraf<Context>, db: any) => {
  bot.command(['weather', 'clima'], spamwatchMiddleware, async (ctx: Context & { message: { text: string } }) => {
    if (await isCommandDisabled(ctx, db, 'weather')) return;

    const reply_to_message_id = ctx.message.message_id;
    const userLang = ctx.from?.language_code || "en-US";
    const Strings = getStrings(userLang);
    const userInput = ctx.message.text.split(' ').slice(1).join(' ');
    const { provideLocation } = Strings.weatherStatus

    if (verifyInput(ctx, userInput, provideLocation)) {
      return;
    }

    const location: string = userInput;
    const apiKey: string = process.env.weatherKey || '';

    if (!apiKey || apiKey === "InsertYourWeatherDotComApiKeyHere") {
      return ctx.reply(Strings.weatherStatus.apiKeyErr, {
        parse_mode: "Markdown",
        ...({ reply_to_message_id })
      });
    }

    try {
      // TODO: this also needs to be sanitized and validated
      const locationResponse = await axios.get(`${Resources.weatherApi}/location/search`, {
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
          ...({ reply_to_message_id })
        });
      }

      const addressFirst = locationData.address[0];
      const latFirst = locationData.latitude[0];
      const lonFirst = locationData.longitude[0];
      const countryCode = locationData.countryCode[0];
      const { temperatureUnit, speedUnit, apiUnit } = getLocaleUnit(countryCode);

      const weatherResponse = await axios.get(`${Resources.weatherApi}/aggcommon/v3-wx-observations-current`, {
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
        ...({ reply_to_message_id })
      });
    } catch (error) {
      const message = Strings.weatherStatus.apiErr.replace('{error}', error.message);
      ctx.reply(message, {
        parse_mode: "Markdown",
        ...({ reply_to_message_id })
      });
    }
  });
};