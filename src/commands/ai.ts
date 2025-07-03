// AI.TS
// by ihatenodejs/Aidan
//
// -----------------------------------------------------------------------
//
// This is free and unencumbered software released into the public domain.
//
// Anyone is free to copy, modify, publish, use, compile, sell, or
// distribute this software, either in source code form or as a compiled
// binary, for any purpose, commercial or non-commercial, and by any
// means.
//
// In jurisdictions that recognize copyright laws, the author or authors
// of this software dedicate any and all copyright interest in the
// software to the public domain. We make this dedication for the benefit
// of the public at large and to the detriment of our heirs and
// successors. We intend this dedication to be an overt act of
// relinquishment in perpetuity of all present and future rights to this
// software under copyright law.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//
// For more information, please refer to <https://unlicense.org/>

import { isOnSpamWatch } from "../spamwatch/spamwatch"
import spamwatchMiddlewareModule from "../spamwatch/Middleware"
import { Telegraf, Context } from "telegraf"
import type { Message } from "telegraf/types"
import { replyToMessageId } from "../utils/reply-to-message-id"
import { getStrings } from "../plugins/checklang"
import axios from "axios"
import { rateLimiter } from "../utils/rate-limiter"
import { logger } from "../utils/log"
import { ensureUserInDb } from "../utils/ensure-user"
import * as schema from '../db/schema'
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { eq, sql } from 'drizzle-orm'
import { models, unloadModelAfterB } from "../../config/ai"

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch)
export const flash_model = process.env.flashModel || "gemma3:4b"
export const thinking_model = process.env.thinkingModel || "qwen3:4b"

type TextContext = Context & { message: Message.TextMessage }

type User = typeof schema.usersTable.$inferSelect

export interface ModelInfo {
  name: string;
  label: string;
  descriptionEn: string;
  descriptionPt: string;
  models: Array<{
    name: string;
    label: string;
    parameterSize: string;
  }>;
}

interface OllamaResponse {
  response: string;
}

async function usingSystemPrompt(ctx: TextContext, db: NodePgDatabase<typeof schema>, botName: string, message: string): Promise<string> {
  const user = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
  if (user.length === 0) await ensureUserInDb(ctx, db);
  const userData = user[0];
  const lang = userData?.languageCode || "en";
  const Strings = getStrings(lang);
  const utcDate = new Date().toISOString();
  const prompt = Strings.ai.systemPrompt
    .replace("{botName}", botName)
    .replace("{date}", utcDate)
    .replace("{message}", message);
  return prompt;
}

export function sanitizeForJson(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function sanitizeMarkdownForTelegram(text: string): string {
  let sanitizedText = text;

  const replacements: string[] = [];
  const addReplacement = (match: string): string => {
    replacements.push(match);
    return `___PLACEHOLDER_${replacements.length - 1}___`;
  };

  sanitizedText = sanitizedText.replace(/```([\s\S]*?)```/g, addReplacement);
  sanitizedText = sanitizedText.replace(/`([^`]+)`/g, addReplacement);
  sanitizedText = sanitizedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, addReplacement);

  const parts = sanitizedText.split(/(___PLACEHOLDER_\d+___)/g);
  const processedParts = parts.map(part => {
    if (part.match(/___PLACEHOLDER_\d+___/)) {
      return part;
    } else {
      let processedPart = part;
      processedPart = processedPart.replace(/^(#{1,6})\s+(.+)/gm, '*$2*');
      processedPart = processedPart.replace(/^(\s*)[-*]\s+/gm, '$1- ');
      processedPart = processedPart.replace(/\*\*(.*?)\*\*/g, '*$1*');
      processedPart = processedPart.replace(/__(.*?)__/g, '*$1*');
      processedPart = processedPart.replace(/(^|\s)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1_$2_');
      processedPart = processedPart.replace(/(^|\s)_(?!_)([^_]+?)_(?!_)/g, '$1_$2_');
      processedPart = processedPart.replace(/~~(.*?)~~/g, '~$1~');
      processedPart = processedPart.replace(/^\s*┃/gm, '>');
      processedPart = processedPart.replace(/^>\s?/gm, '> ');

      return processedPart;
    }
  });

  sanitizedText = processedParts.join('');

  sanitizedText = sanitizedText.replace(/___PLACEHOLDER_(\d+)___/g, (_, idx) => replacements[Number(idx)]);

  const codeBlockCount = (sanitizedText.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    sanitizedText += '\n```';
  }

  return sanitizedText;
}

function processThinkingTags(text: string): string {
  let processedText = text;

  const firstThinkIndex = processedText.indexOf('<think>');
  if (firstThinkIndex === -1) {
      return processedText.replace(/<\/think>/g, '___THINK_END___');
  }

  processedText = processedText.substring(0, firstThinkIndex) + '___THINK_START___' + processedText.substring(firstThinkIndex + '<think>'.length);
  const lastThinkEndIndex = processedText.lastIndexOf('</think>');
  if (lastThinkEndIndex !== -1) {
      processedText = processedText.substring(0, lastThinkEndIndex) + '___THEND___' + processedText.substring(lastThinkEndIndex + '</think>'.length);
  }
  processedText = processedText.replace(/<think>/g, '');
  processedText = processedText.replace(/<\/think>/g, '');
  processedText = processedText.replace('___THEND___', '___THINK_END___');

  return processedText;
}

export async function preChecks() {
  const envs = [
    "ollamaApi",
    "flashModel",
    "thinkingModel",
  ];

  for (const env of envs) {
    if (!process.env[env]) {
      console.error(`[✨ AI | !] ❌ ${env} not set!`);
      return false;
    }
  }

  const ollamaApi = process.env.ollamaApi!;
  let ollamaOk = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await axios.get(ollamaApi, { timeout: 2000 });
      if (res.status === 200) {
        ollamaOk = true;
        break;
      }
    } catch (err) {
      if (i < 9) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (!ollamaOk) {
    console.error(`[✨ AI | !] ❌ Ollama API is not responding at ${ollamaApi}`);
    return false;
  }

  console.log(`[✨  AI] Pre-checks passed.`);
  const modelCount = models.reduce((acc, model) => acc + model.models.length, 0);
  console.log(`[✨  AI] Found ${modelCount} models.`);
  return true;
}

function isAxiosError(error: unknown): error is { response?: { data?: { error?: string }, status?: number, statusText?: string }, request?: unknown, message?: string } {
  return typeof error === 'object' && error !== null && (
    'response' in error || 'request' in error || 'message' in error
  );
}

function extractAxiosErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const err = error as { response?: { data?: { error?: string }, status?: number, statusText?: string }, request?: unknown, message?: string };
    if (err.response && typeof err.response === 'object') {
      const resp = err.response;
      if (resp.data && typeof resp.data === 'object' && 'error' in resp.data) {
        return String(resp.data.error);
      }
      if ('status' in resp && 'statusText' in resp) {
        return `HTTP ${resp.status}: ${resp.statusText}`;
      }
      return JSON.stringify(resp.data ?? resp);
    }
    if (err.request) {
      return 'No response received from server.';
    }
    if (typeof err.message === 'string') {
      return err.message;
    }
  }
  return 'An unexpected error occurred.';
}

function containsUrls(text: string): boolean {
  return text.includes('http://') || text.includes('https://') || text.includes('.com') || text.includes('.net') || text.includes('.org') || text.includes('.io') || text.includes('.ai') || text.includes('.dev')
}

async function getResponse(prompt: string, ctx: TextContext, replyGenerating: Message, model: string, aiTemperature: number, originalMessage: string, db: NodePgDatabase<typeof schema>, userId: string, Strings: ReturnType<typeof getStrings>, showThinking: boolean): Promise<{ success: boolean; response?: string; error?: string, messageType?: 'generation' | 'system' }> {
  if (!ctx.chat) {
    return {
      success: false,
      error: Strings.unexpectedErr.replace("{error}", Strings.ai.noChatFound),
    };
  }
  const cleanedModelName = model.includes('/') ? model.split('/').pop()! : model;
  let status = Strings.ai.statusWaitingRender;
  let modelHeader = Strings.ai.modelHeader
    .replace("{model}", `\`${cleanedModelName}\``)
    .replace("{temperature}", String(aiTemperature))
    .replace("{status}", status) + "\n\n";

  const promptCharCount = originalMessage.length;
  await db.update(schema.usersTable)
    .set({ aiCharacters: sql`${schema.usersTable.aiCharacters} + ${promptCharCount}` })
    .where(eq(schema.usersTable.telegramId, userId));
  const paramSizeStr = models.find(m => m.name === model)?.models.find(m => m.name === model)?.parameterSize?.replace('B', '');
  const shouldKeepAlive = paramSizeStr ? Number(paramSizeStr) > unloadModelAfterB : false;

  try {
    const aiResponse = await axios.post<unknown>(
      `${process.env.ollamaApi}/api/generate`,
      {
        model,
        prompt,
        stream: true,
        keep_alive: shouldKeepAlive ? '1' : '0',
        options: {
          temperature: aiTemperature
        }
      },
      {
        responseType: "stream",
      }
    );
    let fullResponse = "";
    let lastUpdateCharCount = 0;
    let sentHeader = false;
    let firstChunk = true;
    const stream: NodeJS.ReadableStream = aiResponse.data as any;

    const formatThinkingMessage = (text: string) => {
        const withPlaceholders = text
            .replace(/___THINK_START___/g, `${Strings.ai.thinking}`)
            .replace(/___THINK_END___/g, `${Strings.ai.finishedThinking}`);
        return sanitizeMarkdownForTelegram(withPlaceholders);
    };

    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        let ln: OllamaResponse;
        try {
          ln = JSON.parse(line);
        } catch (e) {
          console.error("[✨ AI | !] Error parsing chunk");
          continue;
        }

        if (ln.response) {
          if (ln.response.includes('<think>')) {
            const thinkMatch = ln.response.match(/<think>([\s\S]*?)<\/think>/);
            if (thinkMatch && thinkMatch[1].trim().length > 0) {
              logger.logThinking(ctx.chat.id, replyGenerating.message_id, true);
            } else if (!thinkMatch) {
              logger.logThinking(ctx.chat.id, replyGenerating.message_id, true);
            }
          } else if (ln.response.includes('</think>')) {
            logger.logThinking(ctx.chat.id, replyGenerating.message_id, false);
          }
          fullResponse += ln.response;
          if (showThinking) {
            let displayResponse = processThinkingTags(fullResponse);

            if (firstChunk) {
              status = Strings.ai.statusWaitingRender;
              modelHeader = Strings.ai.modelHeader
                .replace("{model}", `\`${cleanedModelName}\``)
                .replace("{temperature}", aiTemperature)
                .replace("{status}", status) + "\n\n";
              await rateLimiter.editMessageWithRetry(
                ctx,
                ctx.chat.id,
                replyGenerating.message_id,
                modelHeader + formatThinkingMessage(displayResponse),
                { parse_mode: 'Markdown' }
              );
              lastUpdateCharCount = displayResponse.length;
              sentHeader = true;
              firstChunk = false;
              continue;
            }
            const updateEveryChars = Number(process.env.updateEveryChars) || 100;
            if (displayResponse.length - lastUpdateCharCount >= updateEveryChars || !sentHeader) {
              await rateLimiter.editMessageWithRetry(
                ctx,
                ctx.chat.id,
                replyGenerating.message_id,
                modelHeader + formatThinkingMessage(displayResponse),
                { parse_mode: 'Markdown' }
              );
              lastUpdateCharCount = displayResponse.length;
              sentHeader = true;
            }
          }
        }
      }
    }

    status = Strings.ai.statusRendering;
    modelHeader = Strings.ai.modelHeader
      .replace("{model}", `\`${cleanedModelName}\``)
      .replace("{temperature}", aiTemperature)
      .replace("{status}", status) + "\n\n";

    if (showThinking) {
        let displayResponse = processThinkingTags(fullResponse);

        await rateLimiter.editMessageWithRetry(
            ctx,
            ctx.chat.id,
            replyGenerating.message_id,
            modelHeader + formatThinkingMessage(displayResponse),
            { parse_mode: 'Markdown' }
        );
    }

    const responseCharCount = fullResponse.length;
    await db.update(schema.usersTable)
      .set({
        aiCharacters: sql`${schema.usersTable.aiCharacters} + ${responseCharCount}`,
        aiRequests: sql`${schema.usersTable.aiRequests} + 1`
      })
      .where(eq(schema.usersTable.telegramId, userId));

    const patchedResponse = processThinkingTags(fullResponse);

    return {
      success: true,
      response: patchedResponse,
      messageType: 'generation'
    };
  } catch (error: unknown) {
    const errorMsg = extractAxiosErrorMessage(error);
    console.error("[✨ AI | !] Error:", errorMsg);
    if (isAxiosError(error) && error.response && typeof error.response === 'object') {
      const resp = error.response as { data?: { error?: string }, status?: number };
      const errData = resp.data && typeof resp.data === 'object' && 'error' in resp.data ? (resp.data as { error?: string }).error : undefined;
      const errStatus = 'status' in resp ? resp.status : undefined;
      if ((typeof errData === 'string' && errData.includes(`model '${model}' not found`)) || errStatus === 404) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          replyGenerating.message_id,
          undefined,
          Strings.ai.pulling.replace("{model}", `\`${cleanedModelName}\``),
          { parse_mode: 'Markdown' }
        );
        console.log(`[✨ AI] Pulling ${model} from ollama...`);
        try {
          await axios.post(
            `${process.env.ollamaApi}/api/pull`,
            {
              model,
              stream: false,
              timeout: Number(process.env.ollamaApiTimeout) || 10000,
            }
          );
        } catch (e: unknown) {
          const pullMsg = extractAxiosErrorMessage(e);
          console.error("[✨ AI | !] Pull error:", pullMsg);
          return {
            success: false,
            error: `❌ Something went wrong while pulling \`${model}\`: ${pullMsg}`,
            messageType: 'system'
          };
        }
        console.log(`[✨ AI] ${model} pulled successfully`);
        return {
          success: true,
          response: Strings.ai.pulled.replace("{model}", `\`${cleanedModelName}\``),
          messageType: 'system'
        };
      }
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
}

async function handleAiReply(ctx: TextContext, model: string, prompt: string, replyGenerating: Message, aiTemperature: number, originalMessage: string, db: NodePgDatabase<typeof schema>, userId: string, Strings: ReturnType<typeof getStrings>, showThinking: boolean) {
  const aiResponse = await getResponse(prompt, ctx, replyGenerating, model, aiTemperature, originalMessage, db, userId, Strings, showThinking);
  if (!aiResponse) return;
  if (!ctx.chat) return;
  if (aiResponse.success && aiResponse.response) {
    if (aiResponse.messageType === 'system') {
      await rateLimiter.editMessageWithRetry(
        ctx,
        ctx.chat.id,
        replyGenerating.message_id,
        aiResponse.response,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const cleanedModelName = model.includes('/') ? model.split('/').pop()! : model;
    const status = Strings.ai.statusComplete;
    const modelHeader = Strings.ai.modelHeader
      .replace("{model}", `\`${cleanedModelName}\``)
      .replace("{temperature}", String(aiTemperature))
      .replace("{status}", status) + "\n\n";
    const urlWarning = containsUrls(originalMessage) ? Strings.ai.urlWarning : '';
    let finalResponse = aiResponse.response;
    if (showThinking) {
        finalResponse = finalResponse.replace(/___THINK_START___/g, `${Strings.ai.thinking}`)
                                     .replace(/___THINK_END___/g, `${Strings.ai.finishedThinking}`);
    } else {
        finalResponse = finalResponse.replace(/___THINK_START___[\s\S]*?___THINK_END___/g, '').trim();
        finalResponse = finalResponse.replace(/___THINK_START___[\s\S]*/g, '').trim();
    }

    await rateLimiter.editMessageWithRetry(
      ctx,
      ctx.chat.id,
      replyGenerating.message_id,
      modelHeader + sanitizeMarkdownForTelegram(finalResponse) + urlWarning,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  const error = Strings.unexpectedErr.replace("{error}", aiResponse.error);
  await rateLimiter.editMessageWithRetry(
    ctx,
    ctx.chat.id,
    replyGenerating.message_id,
    error,
    { parse_mode: 'Markdown' }
  );
}

async function getUserWithStringsAndModel(ctx: Context, db: NodePgDatabase<typeof schema>): Promise<{ user: User; Strings: ReturnType<typeof getStrings>; languageCode: string; customAiModel: string; aiTemperature: number, showThinking: boolean }> {
  const userArr = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
  let user = userArr[0];
  if (!user) {
    await ensureUserInDb(ctx, db);
    const newUserArr = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
    user = newUserArr[0];
    const Strings = getStrings(user.languageCode);
    return { user, Strings, languageCode: user.languageCode, customAiModel: user.customAiModel, aiTemperature: user.aiTemperature, showThinking: user.showThinking };
  }
  const Strings = getStrings(user.languageCode);
  return { user, Strings, languageCode: user.languageCode, customAiModel: user.customAiModel, aiTemperature: user.aiTemperature, showThinking: user.showThinking };
}

export function getModelLabelByName(name: string): string {
  for (const series of models) {
    const found = series.models.find(m => m.name === name);
    if (found) return found.label;
  }
  return name;
}

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  const botName = bot.botInfo?.first_name && bot.botInfo?.last_name ? `${bot.botInfo.first_name} ${bot.botInfo.last_name}` : "Kowalski"

  interface AiRequest {
    task: () => Promise<void>;
    ctx: TextContext;
    wasQueued: boolean;
  }

  const requestQueue: AiRequest[] = [];
  let isProcessing = false;

  async function processQueue() {
    if (isProcessing || requestQueue.length === 0) {
      return;
    }

    isProcessing = true;
    const { task, ctx, wasQueued } = requestQueue.shift()!;
    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);

    try {
      if (wasQueued) {
        await ctx.reply(Strings.ai.startingProcessing, {
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }),
          parse_mode: 'Markdown'
        });
      }
      await task();
    } catch (error) {
      console.error("[✨ AI | !] Error processing task:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ctx.reply(Strings.unexpectedErr.replace("{error}", errorMessage), {
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }),
        parse_mode: 'Markdown'
      });
    } finally {
      isProcessing = false;
      processQueue();
    }
  }

  async function aiCommandHandler(ctx: TextContext, command: 'ask' | 'think' | 'ai') {
    const reply_to_message_id = replyToMessageId(ctx);
    const { user, Strings, customAiModel, aiTemperature, showThinking } = await getUserWithStringsAndModel(ctx, db);
    const message = ctx.message.text;
    const author = ("@" + ctx.from?.username) || ctx.from?.first_name || "Unknown";

    const model = command === 'ai'
      ? (customAiModel || flash_model)
      : (command === 'ask' ? flash_model : thinking_model);

    const fixedMsg = message.replace(new RegExp(`^/${command}(@\\w+)?\\s*`), "").trim();
    logger.logCmdStart(author, command, model);

    if (!process.env.ollamaApi) {
      await ctx.reply(Strings.ai.disabled, { parse_mode: 'Markdown', ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }) });
      return;
    }

    if (!user.aiEnabled) {
      await ctx.reply(Strings.ai.disabledForUser, { parse_mode: 'Markdown', ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }) });
      return;
    }

    if (fixedMsg.length < 1) {
      await ctx.reply(Strings.ai.askNoMessage, { parse_mode: 'Markdown', ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }) });
      return;
    }

    const task = async () => {
      const modelLabel = getModelLabelByName(model);
      const replyGenerating = await ctx.reply(Strings.ai.askGenerating.replace("{model}", `\`${modelLabel}\``), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      const prompt = sanitizeForJson(await usingSystemPrompt(ctx, db, botName, fixedMsg));
      await handleAiReply(ctx, model, prompt, replyGenerating, aiTemperature, fixedMsg, db, user.telegramId, Strings, showThinking);
    };

    if (isProcessing) {
      requestQueue.push({ task, ctx, wasQueued: true });
      const position = requestQueue.length;
      await ctx.reply(Strings.ai.inQueue.replace("{position}", String(position)), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    } else {
      requestQueue.push({ task, ctx, wasQueued: false });
      processQueue();
    }
  }

  bot.command(["ask", "think"], spamwatchMiddleware, async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const command = ctx.message.text.startsWith('/ask') ? 'ask' : 'think';
    await aiCommandHandler(ctx as TextContext, command);
  });

  bot.command(["ai"], spamwatchMiddleware, async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    await aiCommandHandler(ctx as TextContext, 'ai');
  });

  bot.command(["aistats"], spamwatchMiddleware, async (ctx) => {
    const { user, Strings } = await getUserWithStringsAndModel(ctx, db);
    if (!user) {
      await ctx.reply(Strings.userNotFound || "User not found.");
      return;
    }
    const bookCount = Math.max(1, Math.round(user.aiCharacters / 500000));
    const bookWord = bookCount === 1 ? 'book' : 'books';
    const msg = `${Strings.aiStats.header}\n\n${Strings.aiStats.requests.replace('{aiRequests}', user.aiRequests)}\n${Strings.aiStats.characters.replace('{aiCharacters}', user.aiCharacters).replace('{bookCount}', bookCount).replace('books', bookWord)}`;
    await ctx.reply(msg, { parse_mode: 'Markdown' });
  });
}
