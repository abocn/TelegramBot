import { getStrings } from '../plugins/checklang';
import { isOnSpamWatch } from '../spamwatch/spamwatch';
import spamwatchMiddlewareModule from '../spamwatch/Middleware';
import { Context, Telegraf } from 'telegraf';
import { replyToMessageId } from '../utils/reply-to-message-id';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureUserInDb } from '../utils/ensure-user';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { models, getModelLabelByName } from './ai';
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
  const userId = user.telegramId;
  return {
    text: `*${Strings.settings.selectSetting}*`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: `✨ ${Strings.settings.ai.aiEnabled}: ${user.aiEnabled ? Strings.settings.enabled : Strings.settings.disabled}`, callback_data: `settings_aiEnabled_${userId}` },
          { text: `🧠 ${Strings.settings.ai.aiModel}: ${getModelLabelByName(user.customAiModel)}`, callback_data: `settings_aiModel_${userId}` }
        ],
        [
          { text: `🌡️ ${Strings.settings.ai.aiTemperature}: ${user.aiTemperature}`, callback_data: `settings_aiTemperature_${userId}` },
          { text: `🌐 ${langLabel}`, callback_data: `settings_language_${userId}` }
        ]
      ]
    }
  };
}

function extractUserIdFromCallback(data: string): string | null {
  const match = data.match(/_(\d+)$/);
  return match ? match[1] : null;
}

function getNotAllowedMessage(Strings: any) {
  return Strings.gsmarenaNotAllowed;
}

function logSettingsAccess(action: string, ctx: Context, allowed: boolean, expectedUserId: string | null) {
  if (process.env.longerLogs === 'true') {
    const actualUserId = ctx.from?.id;
    const username = ctx.from?.username || ctx.from?.first_name || 'unknown';
    console.log(`[Settings] Action: ${action}, Callback from: ${username} (${actualUserId}), Expected: ${expectedUserId}, Allowed: ${allowed}`);
  }
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
        getModelLabelByName(user.customAiModel)
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

  bot.action(/^settings_aiEnabled_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settings_aiEnabled', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    await db.update(schema.usersTable)
      .set({ aiEnabled: !user.aiEnabled })
      .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
    const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
    await updateSettingsKeyboard(ctx, updatedUser, Strings);
  });

  bot.action(/^settings_aiModel_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settings_aiModel', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    try {
      await ctx.editMessageText(
        `${Strings.settings.ai.selectSeries}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: models.map((series, idx) => [
              { text: series.label, callback_data: `selectseries_${idx}_${user.telegramId}` }
            ]).concat([[
              { text: `${Strings.varStrings.varBack}`, callback_data: `settings_back_${user.telegramId}` }
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
  });

  bot.action(/^selectseries_\d+_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('selectseries', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const match = data.match(/^selectseries_(\d+)_\d+$/);
    if (!match) return;
    const seriesIdx = parseInt(match[1], 10);
    const series = models[seriesIdx];
    if (!series) return;
    const desc = user.languageCode === 'pt' ? series.descriptionPt : series.descriptionEn;
    try {
      await ctx.editMessageText(
        `${Strings.settings.ai.seriesDescription.replace('{seriesDescription}', desc)}\n\n${Strings.settings.ai.selectParameterSize.replace('{seriesLabel}', series.label)}\n\n${Strings.settings.ai.parameterSizeExplanation}`,
        {
          reply_markup: {
            inline_keyboard: series.models.map((m, idx) => [
              { text: `${m.label} (${m.parameterSize})`, callback_data: `setmodel_${seriesIdx}_${idx}_${user.telegramId}` }
            ]).concat([[
              { text: `${Strings.varStrings.varBack}`, callback_data: `settings_aiModel_${user.telegramId}` }
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
  });

  bot.action(/^setmodel_\d+_\d+_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('setmodel', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const match = data.match(/^setmodel_(\d+)_(\d+)_\d+$/);
    if (!match) return;
    const seriesIdx = parseInt(match[1], 10);
    const modelIdx = parseInt(match[2], 10);
    const series = models[seriesIdx];
    const model = series?.models[modelIdx];
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
  });

  bot.action(/^settings_aiTemperature_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settings_aiTemperature', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const temps = [0.2, 0.5, 0.7, 0.9, 1.2];
    try {
      await ctx.editMessageText(
        `${Strings.settings.ai.temperatureExplanation}\n\n${Strings.settings.ai.selectTemperature}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: temps.map(t => [{ text: t.toString(), callback_data: `settemp_${t}_${user.telegramId}` }])
              .concat([
                [{ text: Strings.varStrings.varMore, callback_data: `show_more_temps_${user.telegramId}` }],
                [
                  { text: Strings.varStrings.varBack, callback_data: `settings_back_${user.telegramId}` }
                ]
              ])
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
  });

  bot.action(/^show_more_temps_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('show_more_temps', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const moreTemps = [1.4, 1.6, 1.8, 2.0];
    try {
      await ctx.editMessageReplyMarkup({
        inline_keyboard: moreTemps.map(t => [{ text: `🔥 ${t}`, callback_data: `settemp_${t}_${user.telegramId}` }])
          .concat([
            [{ text: Strings.varStrings.varLess, callback_data: `settings_aiTemperature_${user.telegramId}` }],
            [{ text: Strings.varStrings.varBack, callback_data: `settings_back_${user.telegramId}` }]
          ])
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
  });

  bot.action(/^settemp_.+_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settemp', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const temp = parseFloat(data.replace(/^settemp_/, '').replace(/_\d+$/, ''));
    await db.update(schema.usersTable)
      .set({ aiTemperature: temp })
      .where(eq(schema.usersTable.telegramId, String(user.telegramId)));
    const updatedUser = (await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(user.telegramId)), limit: 1 }))[0];
    await updateSettingsKeyboard(ctx, updatedUser, Strings);
  });

  bot.action(/^settings_language_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settings_language', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    try {
      await ctx.editMessageText(
        Strings.settings.selectLanguage,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: langs.map(l => [{ text: l.label, callback_data: `setlang_${l.code}_${user.telegramId}` }]).concat([[{ text: `${Strings.varStrings.varBack}`, callback_data: `settings_back_${user.telegramId}` }]])
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
  });

  bot.action(/^settings_back_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('settings_back', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user, Strings } = await getUserAndStrings(ctx, db);
    if (!user) return;
    const menu = getSettingsMenu(user, Strings);
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
  });

  bot.action(/^setlang_.+_\d+$/, async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const userId = extractUserIdFromCallback(data);
    const allowed = !!userId && String(ctx.from.id) === userId;
    logSettingsAccess('setlang', ctx, allowed, userId);
    if (!allowed) {
      const { Strings } = await getUserAndStrings(ctx, db);
      return ctx.answerCbQuery(getNotAllowedMessage(Strings), { show_alert: true });
    }
    await ctx.answerCbQuery();
    const { user } = await getUserAndStrings(ctx, db);
    if (!user) {
      console.log('[Settings] No user found');
      return;
    }
    const lang = data.replace(/^setlang_/, '').replace(/_\d+$/, '');
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
};