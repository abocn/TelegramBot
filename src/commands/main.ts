import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureUserInDb } from '../utils/ensure-user';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { models } from './ai';
import { langs } from '../locales/config';

type UserRow = typeof schema.usersTable.$inferSelect;

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch);

async function getUserAndStrings(ctx: Context, db: NodePgDatabase<typeof schema>): Promise<{ user: UserRow | null, Strings: any, languageCode: string }> {
  let user: UserRow | null = null;
  let languageCode = 'en';
  if (!ctx.from) {
    const Strings = getStrings(languageCode);
    return { user, Strings, languageCode };
  }
  const { id, language_code } = ctx.from;
  if (id) {
    const dbUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(id)), limit: 1 });
    if (dbUser.length === 0) {
      await ensureUserInDb(ctx, db);
      const newUser = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(id)), limit: 1 });
      if (newUser.length > 0) {
        user = newUser[0];
        languageCode = user.languageCode;
      }
    } else {
      user = dbUser[0];
      languageCode = user.languageCode;
    }
  }
  if (!user && language_code) {
    languageCode = language_code;
    console.warn('[WARN !] Falling back to Telegram language_code for user', id);
  }
  const Strings = getStrings(languageCode);
  return { user, Strings, languageCode };
}

type SettingsMenu = { text: string, reply_markup: any };
function getSettingsMenu(user: UserRow, Strings: any): SettingsMenu {
  const langObj = langs.find(l => l.code === user.languageCode);
  const langLabel = langObj ? langObj.label : user.languageCode;
  return {
    text: Strings.settings.selectSetting,
    reply_markup: {
      inline_keyboard: [
        [
          { text: `✨ ${Strings.settings.ai.aiEnabled}: ${user.aiEnabled ? Strings.settings.enabled : Strings.settings.disabled}`, callback_data: 'settings_aiEnabled' },
          { text: `🧠 ${Strings.settings.ai.aiModel}: ${user.customAiModel}`, callback_data: 'settings_aiModel' }
        ],
        [
          { text: `🌡️ ${Strings.settings.ai.aiTemperature}: ${user.aiTemperature}`, callback_data: 'settings_aiTemperature' },
          { text: `🌐 ${langLabel}`, callback_data: 'settings_language' }
        ]
      ]
    }
  };
}

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.start(spamwatchMiddleware, async (ctx: Context) => {
    const { user, Strings } = await getUserAndStrings(ctx, db);
    const botInfo = await ctx.telegram.getMe();
    const reply_to_message_id = replyToMessageId(ctx);
    const startMsg = Strings.botWelcome.replace(/{botName}/g, botInfo.first_name);
    if (!user) return;
    ctx.reply(
      startMsg.replace(
        /{aiEnabled}/g,
        user.aiEnabled ? Strings.settings.enabled : Strings.settings.disabled
      ).replace(
        /{aiModel}/g,
        user.customAiModel
      ).replace(
        /{aiTemperature}/g,
        user.aiTemperature.toString()
      ).replace(
        /{aiRequests}/g,
        user.aiRequests.toString()
      ).replace(
        /{aiCharacters}/g,
        user.aiCharacters.toString()
      ).replace(
        /{languageCode}/g,
        user.languageCode
      ), {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      }
    );
  });

  bot.command(["settings"], spamwatchMiddleware, async (ctx: Context) => {
    const reply_to_message_id = replyToMessageId(ctx);
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const menu = getSettingsMenu(user, Strings);
    await ctx.reply(
      menu.text,
      {
        reply_markup: menu.reply_markup,
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      }
    );
  });

  const updateSettingsKeyboard = async (ctx: Context, user: UserRow, Strings: any) => {
    const menu = getSettingsMenu(user, Strings);
    await ctx.editMessageReplyMarkup(menu.reply_markup);
  };

  bot.action('settings_aiEnabled', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      await db.update(schema.usersTable)
        .set({ aiEnabled: !user.aiEnabled })
        .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
      const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
      await updateSettingsKeyboard(ctx, updatedUser, Strings);
    } catch (err) {
      console.error('Error handling settings_aiEnabled callback:', err);
    }
  });

  bot.action('settings_aiModel', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      try {
        await ctx.editMessageText(
          `${Strings.settings.ai.selectSeries}`,
          {
            reply_markup: {
              inline_keyboard: models.map(series => [
                { text: series.label, callback_data: `selectseries_${series.name}` }
              ]).concat([[
                { text: `⬅️ ${Strings.settings.ai.back}`, callback_data: 'settings_back' }
              ]])
            }
          }
        );
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('Error handling settings_aiModel callback:', err);
    }
  });

  bot.action(/^selectseries_.+$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      const data = (ctx.callbackQuery as any).data;
      const seriesName = data.replace('selectseries_', '');
      const series = models.find(s => s.name === seriesName);
      if (!series) return;
      const desc = user.languageCode === 'pt' ? series.descriptionPt : series.descriptionEn;
      try {
        await ctx.editMessageText(
          `${Strings.settings.ai.seriesDescription.replace('{seriesDescription}', desc)}\n\n${Strings.settings.ai.selectParameterSize.replace('{seriesLabel}', series.label)}\n\n${Strings.settings.ai.parameterSizeExplanation}`,
          {
            reply_markup: {
              inline_keyboard: series.models.map(m => [
                { text: `${m.label} (${m.parameterSize})`, callback_data: `setmodel_${series.name}_${m.name}` }
              ]).concat([[
                { text: `⬅️ ${Strings.settings.ai.back}`, callback_data: 'settings_aiModel' }
              ]])
            }
          }
        );
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('Error handling selectseries callback:', err);
    }
  });

  bot.action(/^setmodel_.+$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      const data = (ctx.callbackQuery as any).data;
      const parts = data.split('_');
      const seriesName = parts[1];
      const modelName = parts.slice(2).join('_');
      const series = models.find(s => s.name === seriesName);
      const model = series?.models.find(m => m.name === modelName);
      if (!series || !model) return;
      await db.update(schema.usersTable)
        .set({ customAiModel: model.name })
        .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
      const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
      const menu = getSettingsMenu(updatedUser, Strings);
      try {
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText(
            menu.text,
            {
              reply_markup: menu.reply_markup,
              parse_mode: 'Markdown'
            }
          );
        } else {
          await ctx.reply(menu.text, {
            reply_markup: menu.reply_markup,
            parse_mode: 'Markdown'
          });
        }
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('[Settings] Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('Error handling setmodel callback:', err);
    }
  });

  bot.action('settings_aiTemperature', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      const temps = [0.2, 0.5, 0.7, 0.9, 1.2];
      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: temps.map(t => [{ text: t.toString(), callback_data: `settemp_${t}` }]).concat([[{ text: `⬅️ ${Strings.settings.ai.back}`, callback_data: 'settings_back' }]])
        });
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('Error handling settings_aiTemperature callback:', err);
    }
  });

  bot.action(/^settemp_.+$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      const data = (ctx.callbackQuery as any).data;
      const temp = parseFloat(data.replace('settemp_', ''));
      await db.update(schema.usersTable)
        .set({ aiTemperature: temp })
        .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
      const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
      await updateSettingsKeyboard(ctx, updatedUser, Strings);
    } catch (err) {
      console.error('Error handling settemp callback:', err);
    }
  });

  bot.action('settings_language', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: langs.map(l => [{ text: l.label, callback_data: `setlang_${l.code}` }]).concat([[{ text: `⬅️ ${Strings.settings.ai.back}`, callback_data: 'settings_back' }]])
        });
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('Error handling settings_language callback:', err);
    }
  });

  bot.action('settings_back', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user, Strings } = await getUserAndStrings(ctx, db);
      if (!user) return;
      await updateSettingsKeyboard(ctx, user, Strings);
    } catch (err) {
      console.error('Error handling settings_back callback:', err);
    }
  });

  bot.command('privacy', spamwatchMiddleware, async (ctx: Context) => {
    const { Strings } = await getUserAndStrings(ctx, db);
    if (!ctx.from || !ctx.message) return;
    const message = Strings.botPrivacy.replace("{botPrivacy}", process.env.botPrivacy ?? "");
    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    } as any);
  });

  bot.action(/^setlang_.+$/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const { user } = await getUserAndStrings(ctx, db);
      if (!user) {
        console.log('[Settings] No user found');
        return;
      }
      const data = (ctx.callbackQuery as any).data;
      const lang = data.replace('setlang_', '');
      await db.update(schema.usersTable)
        .set({ languageCode: lang })
        .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
      const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
      const updatedStrings = getStrings(updatedUser.languageCode);
      const menu = getSettingsMenu(updatedUser, updatedStrings);
      try {
        if (ctx.callbackQuery.message) {
          await ctx.editMessageText(
            menu.text,
            {
              reply_markup: menu.reply_markup,
              parse_mode: 'Markdown'
            }
          );
        } else {
          await ctx.reply(menu.text, {
            reply_markup: menu.reply_markup,
            parse_mode: 'Markdown'
          });
        }
      } catch (err) {
        if (
          !(
            err.response.description?.includes('query is too old') ||
            err.response.description?.includes('query ID is invalid') ||
            err.response.description?.includes('message is not modified') ||
            err.response.description?.includes('message to edit not found')
          )
        )
          console.error('[Settings] Unexpected Telegram error:', err);
      }
    } catch (err) {
      console.error('[Settings] Error handling setlang callback:', err);
    }
  });
};