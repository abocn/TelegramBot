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

import axios from "axios"

import { getStrings } from "../plugins/checklang"

import { isCommandDisabled } from "../utils/check-command-disabled"
import { replyToMessageId } from "../utils/reply-to-message-id"
import { ensureUserInDb } from "../utils/ensure-user"
import { rateLimiter } from "../utils/rate-limiter"
import { logger } from "../utils/log"

import * as schema from '../../database/schema'
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { eq, sql, and, gt, isNotNull } from 'drizzle-orm'

import {
  models,
  unloadModelAfterB,
  maxUserQueueSize,
  defaultFlashModel,
  defaultThinkingModel
} from "../../config/ai"

import type { TextContext, User, OllamaResponse, AiRequest } from "../types/ai"

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch)

const flash_model = process.env.flashModel || defaultFlashModel
const thinking_model = process.env.thinkingModel || defaultThinkingModel

function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const adminArray = process.env.botAdmins ? process.env.botAdmins.split(',').map(id => parseInt(id.trim())) : [];
  return adminArray.includes(userId);
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) return -1;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    case 'w': return value * 60 * 60 * 24 * 7;
    default: return -1;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

async function checkUserTimeout(ctx: Context, db: NodePgDatabase<typeof schema>, userId: string, Strings: ReturnType<typeof getStrings>): Promise<boolean> {
  const user = await db.query.usersTable.findFirst({ where: (fields, { eq }) => eq(fields.telegramId, userId) });
  if (!user) return false;

  if (user.aiTimeoutUntil && user.aiTimeoutUntil > new Date()) {
    const timeoutEnd = user.aiTimeoutUntil.toISOString();
    const reply_to_message_id = replyToMessageId(ctx);
    await ctx.reply(Strings.ai.userTimedOutFromAI.replace("{timeoutEnd}", timeoutEnd), {
      parse_mode: 'Markdown',
      ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
    });
    return true;
  }

  return false;
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

async function getResponse(prompt: string, ctx: TextContext, replyGenerating: Message, model: string, aiTemperature: number, originalMessage: string, db: NodePgDatabase<typeof schema>, userId: string, Strings: ReturnType<typeof getStrings>, showThinking: boolean, abortController?: AbortController): Promise<{ success: boolean; response?: string; error?: string, messageType?: 'generation' | 'system', executionTimeoutReached?: boolean }> {
  if (!ctx.chat) {
    return {
      success: false,
      error: Strings.unexpectedErr.replace("{error}", Strings.ai.noChatFound),
    };
  }
  const cleanedModelName = model.includes('/') ? model.split('/').pop()! : model;
  let status = Strings.ai.statusWaitingRender;
  let modelHeader = Strings.ai.modelHeader
    .replace("{model}", `${cleanedModelName}`)
    .replace("{temperature}", String(aiTemperature))
    .replace("{status}", status) + "\n\n";

  const promptCharCount = originalMessage.length;
  await db.update(schema.usersTable)
    .set({ aiCharacters: sql`${schema.usersTable.aiCharacters} + ${promptCharCount}` })
    .where(eq(schema.usersTable.telegramId, userId));
  const paramSizeStr = models.find(m => m.name === model)?.models.find(m => m.name === model)?.parameterSize?.replace('B', '');
  const shouldKeepAlive = paramSizeStr ? Number(paramSizeStr) > unloadModelAfterB : false;
  const user = await db.query.usersTable.findFirst({ where: (fields, { eq }) => eq(fields.telegramId, userId) });
  const maxExecutionTime = user?.aiMaxExecutionTime || 0;
  const timeout = maxExecutionTime > 0 ? maxExecutionTime * 1000 : 300000; // 5m

  let executionTimeout: NodeJS.Timeout | null = null;
  let executionTimeoutReached = false;
  let fullResponse = "";
  if (timeout < 300000) { // 5m
    executionTimeout = setTimeout(() => {
      if (abortController && !abortController.signal.aborted) {
        executionTimeoutReached = true;
        abortController.abort();
      }
    }, timeout);
  }

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
        timeout: 60000, //1m
        signal: abortController?.signal,
      }
    );
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

    let isThinking = false;
    let hasStartedThinking = false;
    let hasFinishedThinking = false;

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
            if (!hasStartedThinking) {
              isThinking = true;
              hasStartedThinking = true;
            }
          } else if (ln.response.includes('</think>')) {
            logger.logThinking(ctx.chat.id, replyGenerating.message_id, false);
            if (isThinking && !hasFinishedThinking) {
              isThinking = false;
              hasFinishedThinking = true;
            }
          }
          fullResponse += ln.response;
          if (showThinking) {
            let displayResponse = processThinkingTags(fullResponse);

            if (firstChunk) {
              status = Strings.ai.statusWaitingRender;
              modelHeader = Strings.ai.modelHeader
                .replace("{model}", `${cleanedModelName}`)
                .replace("{temperature}", String(aiTemperature))
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
          } else {
            if (hasStartedThinking && !hasFinishedThinking && isThinking) {
              if (firstChunk) {
                status = Strings.ai.statusWaitingRender;
                modelHeader = Strings.ai.modelHeader
                  .replace("{model}", `${cleanedModelName}`)
                  .replace("{temperature}", String(aiTemperature))
                  .replace("{status}", status) + "\n\n";
                await rateLimiter.editMessageWithRetry(
                  ctx,
                  ctx.chat.id,
                  replyGenerating.message_id,
                  modelHeader + Strings.ai.thinking,
                  { parse_mode: 'Markdown' }
                );
                sentHeader = true;
                firstChunk = false;
              }
            } else if (hasFinishedThinking) {
              let processedResponse = processThinkingTags(fullResponse);
              let displayResponse = processedResponse.replace(/___THINK_START___[\s\S]*?___THINK_END___/g, '').trim();
              displayResponse = displayResponse.replace(/___THINK_START___[\s\S]*/g, '').trim();

              if (firstChunk) {
                status = Strings.ai.statusWaitingRender;
                modelHeader = Strings.ai.modelHeader
                  .replace("{model}", `${cleanedModelName}`)
                  .replace("{temperature}", String(aiTemperature))
                  .replace("{status}", status) + "\n\n";
                await rateLimiter.editMessageWithRetry(
                  ctx,
                  ctx.chat.id,
                  replyGenerating.message_id,
                  modelHeader + Strings.ai.finishedThinking + "\n\n" + sanitizeMarkdownForTelegram(displayResponse),
                  { parse_mode: 'Markdown' }
                );
                lastUpdateCharCount = displayResponse.length;
                sentHeader = true;
                firstChunk = false;
                continue;
              }

              const updateEveryChars = Number(process.env.updateEveryChars) || 100;
              if (displayResponse.length - lastUpdateCharCount >= updateEveryChars) {
                await rateLimiter.editMessageWithRetry(
                  ctx,
                  ctx.chat.id,
                  replyGenerating.message_id,
                  modelHeader + Strings.ai.finishedThinking + "\n\n" + sanitizeMarkdownForTelegram(displayResponse),
                  { parse_mode: 'Markdown' }
                );
                lastUpdateCharCount = displayResponse.length;
              }
            } else if (!hasStartedThinking) {
              if (firstChunk) {
                status = Strings.ai.statusWaitingRender;
                modelHeader = Strings.ai.modelHeader
                  .replace("{model}", `${cleanedModelName}`)
                  .replace("{temperature}", String(aiTemperature))
                  .replace("{status}", status) + "\n\n";
                await rateLimiter.editMessageWithRetry(
                  ctx,
                  ctx.chat.id,
                  replyGenerating.message_id,
                  modelHeader + sanitizeMarkdownForTelegram(fullResponse),
                  { parse_mode: 'Markdown' }
                );
                lastUpdateCharCount = fullResponse.length;
                sentHeader = true;
                firstChunk = false;
                continue;
              }

              const updateEveryChars = Number(process.env.updateEveryChars) || 100;
              if (fullResponse.length - lastUpdateCharCount >= updateEveryChars) {
                await rateLimiter.editMessageWithRetry(
                  ctx,
                  ctx.chat.id,
                  replyGenerating.message_id,
                  modelHeader + sanitizeMarkdownForTelegram(fullResponse),
                  { parse_mode: 'Markdown' }
                );
                lastUpdateCharCount = fullResponse.length;
              }
            }
          }
        }
      }
    }

    if (executionTimeout) {
      clearTimeout(executionTimeout);
    }

    status = Strings.ai.statusRendering;
    modelHeader = Strings.ai.modelHeader
      .replace("{model}", `${cleanedModelName}`)
      .replace("{temperature}", String(aiTemperature))
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
    } else {
        let processedResponse = processThinkingTags(fullResponse);
        let displayResponse = processedResponse.replace(/___THINK_START___[\s\S]*?___THINK_END___/g, '').trim();
        displayResponse = displayResponse.replace(/___THINK_START___[\s\S]*/g, '').trim();
        if (hasStartedThinking) {
            await rateLimiter.editMessageWithRetry(
                ctx,
                ctx.chat.id,
                replyGenerating.message_id,
                modelHeader + Strings.ai.finishedThinking + "\n\n" + sanitizeMarkdownForTelegram(displayResponse),
                { parse_mode: 'Markdown' }
            );
        } else {
            await rateLimiter.editMessageWithRetry(
                ctx,
                ctx.chat.id,
                replyGenerating.message_id,
                modelHeader + sanitizeMarkdownForTelegram(displayResponse),
                { parse_mode: 'Markdown' }
            );
        }
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
      messageType: 'generation',
      executionTimeoutReached
    };
  } catch (error: unknown) {
    if (executionTimeout) {
      clearTimeout(executionTimeout);
    }

    if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))) {
      if (executionTimeoutReached) {
        console.log("[✨ AI] Request was aborted due to execution timeout");
        const patchedResponse = processThinkingTags(fullResponse);
        return {
          success: true,
          response: patchedResponse,
          messageType: 'generation',
          executionTimeoutReached: true
        };
      } else {
        console.log("[✨ AI] Request was aborted by user");
        return {
          success: false,
          error: 'Request was aborted'
        };
      }
    }

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
          Strings.ai.pulling.replace("{model}", `${cleanedModelName}`),
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

async function handleAiReply(ctx: TextContext, model: string, prompt: string, replyGenerating: Message, aiTemperature: number, originalMessage: string, db: NodePgDatabase<typeof schema>, userId: string, Strings: ReturnType<typeof getStrings>, showThinking: boolean, abortController?: AbortController) {
  const aiResponse = await getResponse(prompt, ctx, replyGenerating, model, aiTemperature, originalMessage, db, userId, Strings, showThinking, abortController);
  if (!aiResponse) return;
  if (!ctx.chat) return;
  if (!aiResponse.success && aiResponse.error === 'Request was aborted') {
    return;
  }
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
      .replace("{model}", `${cleanedModelName}`)
      .replace("{temperature}", String(aiTemperature))
      .replace("{status}", status) + "\n\n";
    const urlWarning = containsUrls(originalMessage) ? Strings.ai.urlWarning : '';
    let finalResponse = aiResponse.response;
    const hasThinkingContent = finalResponse.includes('___THINK_START___');

    if (showThinking) {
        finalResponse = finalResponse.replace(/___THINK_START___/g, `${Strings.ai.thinking}`)
                                     .replace(/___THINK_END___/g, `${Strings.ai.finishedThinking}`);
    } else {
        finalResponse = finalResponse.replace(/___THINK_START___[\s\S]*?___THINK_END___/g, '').trim();
        finalResponse = finalResponse.replace(/___THINK_START___[\s\S]*/g, '').trim();
    }

    const thinkingPrefix = (!showThinking && hasThinkingContent) ? `${Strings.ai.finishedThinking}\n\n` : '';
    const timeoutSuffix = aiResponse.executionTimeoutReached ? Strings.ai.executionTimeoutReached : '';

    await rateLimiter.editMessageWithRetry(
      ctx,
      ctx.chat.id,
      replyGenerating.message_id,
      modelHeader + thinkingPrefix + sanitizeMarkdownForTelegram(finalResponse) + urlWarning + timeoutSuffix,
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

  const requestQueue: AiRequest[] = [];
  let isProcessing = false;
  let lastProcessedUserId: number | null = null;
  let currentRequest: AiRequest | null = null;

  async function processQueue() {
    if (isProcessing || requestQueue.length === 0) {
      return;
    }

    isProcessing = true;

    let nextRequestIndex = 0;
    if (lastProcessedUserId !== null && requestQueue.length > 1) {
      const differentUserIndex = requestQueue.findIndex(req => req.userId !== lastProcessedUserId);
      if (differentUserIndex !== -1) {
        nextRequestIndex = differentUserIndex;
      }
    }

    const selectedRequest = requestQueue.splice(nextRequestIndex, 1)[0];
    const { task, ctx, wasQueued, userId } = selectedRequest;
    currentRequest = selectedRequest;

    lastProcessedUserId = userId;

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
      if (error.name === 'AbortError' || (error instanceof Error && error.message.toLowerCase().includes('aborted'))) {
        console.log("[✨ AI] Request was cancelled by user");
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await ctx.reply(Strings.unexpectedErr.replace("{error}", errorMessage), {
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } }),
          parse_mode: 'Markdown'
        });
      }
    } finally {
      currentRequest = null;
      isProcessing = false;
      processQueue();
    }
  }

  async function aiCommandHandler(ctx: TextContext, command: 'ask' | 'think' | 'ai') {
    const commandId = command === 'ask' || command === 'think' ? 'ai-ask-think' : 'ai-custom';
    if (await isCommandDisabled(ctx, db, commandId)) {
      return;
    }

    const reply_to_message_id = replyToMessageId(ctx);
    const { user, Strings, customAiModel, aiTemperature, showThinking } = await getUserWithStringsAndModel(ctx, db);
    const message = ctx.message.text;
    const author = ("@" + ctx.from?.username) || ctx.from?.first_name || "Unknown";

    if (await checkUserTimeout(ctx, db, user.telegramId, Strings)) {
      return;
    }

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

    const userId = ctx.from!.id;
    const userQueueSize = requestQueue.filter(req => req.userId === userId).length;

    if (userQueueSize >= maxUserQueueSize) {
      await ctx.reply(Strings.ai.queueFull, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const abortController = new AbortController();
    const task = async () => {
      const modelLabel = getModelLabelByName(model);
      const replyGenerating = await ctx.reply(Strings.ai.askGenerating.replace("{model}", `\`${modelLabel}\``), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      const prompt = sanitizeForJson(await usingSystemPrompt(ctx, db, botName, fixedMsg));
      await handleAiReply(ctx, model, prompt, replyGenerating, aiTemperature, fixedMsg, db, user.telegramId, Strings, showThinking, abortController);
    };

    if (isProcessing) {
      requestQueue.push({ task, ctx, wasQueued: true, userId: ctx.from!.id, model, abortController });
      const position = requestQueue.length;
      await ctx.reply(Strings.ai.inQueue.replace("{position}", String(position)), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    } else {
      requestQueue.push({ task, ctx, wasQueued: false, userId: ctx.from!.id, model, abortController });
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

  bot.command(["aistop"], spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'ai-stop')) {
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);
    const userId = ctx.from!.id;

    if (currentRequest && currentRequest.userId === userId) {
      currentRequest.abortController?.abort();

      try {
        await axios.post(`${process.env.ollamaApi}/api/generate`, {
          model: currentRequest.model,
          keep_alive: 0,
        }, { timeout: 5000 });
      } catch (error) {
        console.log("[✨ AI] Could not unload model after cancellation:", error.message);
      }

      await ctx.reply(Strings.ai.requestStopped, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const queuedRequestIndex = requestQueue.findIndex(req => req.userId === userId);
    if (queuedRequestIndex !== -1) {
      const removedRequest = requestQueue.splice(queuedRequestIndex, 1)[0];
      removedRequest.abortController?.abort();
      await ctx.reply(Strings.ai.requestRemovedFromQueue, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    await ctx.reply(Strings.ai.noActiveRequest, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
    });
  });

  bot.command(["aistats"], spamwatchMiddleware, async (ctx) => {
    if (await isCommandDisabled(ctx, db, 'ai-stats')) {
      return;
    }

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

  bot.command("queue", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);

    if (requestQueue.length === 0) {
      await ctx.reply(Strings.ai.queueEmpty, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    let queueItems = "";
    for (let i = 0; i < requestQueue.length; i++) {
      const item = requestQueue[i];
      const username = item.ctx.from?.username || item.ctx.from?.first_name || "Unknown";
      const status = i === 0 && isProcessing ? "Processing" : "Queued";
      const modelLabel = getModelLabelByName(item.model);
      queueItems += Strings.ai.queueItem
        .replace("{username}", username)
        .replace("{userId}", String(item.userId))
        .replace("{model}", modelLabel)
        .replace("{status}", status);
    }

    const queueMsg = Strings.ai.queueList
      .replace("{queueItems}", queueItems)
      .replace("{totalItems}", String(requestQueue.length));

    await ctx.reply(queueMsg, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
    });
  });

  bot.command("qdel", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);
    const args = ctx.message.text.split(' ');

    if (args.length < 2) {
      await ctx.reply(Strings.ai.invalidUserId, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const targetUserId = parseInt(args[1]);
    if (isNaN(targetUserId)) {
      await ctx.reply(Strings.ai.invalidUserId, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    let stoppedCurrentRequest = false;
    const initialLength = requestQueue.length;
    const filteredQueue = requestQueue.filter(item => item.userId !== targetUserId);
    const removedCount = initialLength - filteredQueue.length;

    requestQueue.length = 0;
    requestQueue.push(...filteredQueue);

    if (currentRequest && currentRequest.userId === targetUserId) {
      currentRequest.abortController?.abort();

      try {
        await axios.post(`${process.env.ollamaApi}/api/generate`, {
          model: currentRequest.model,
          keep_alive: 0,
        }, { timeout: 5000 });
      } catch (error) {
        console.log("[✨ AI] Could not unload model after cancellation:", error.message);
      }

      stoppedCurrentRequest = true;
    }

    if (removedCount === 0 && !stoppedCurrentRequest) {
      await ctx.reply(Strings.ai.noQueueItems.replace("{userId}", String(targetUserId)), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    let responseMessage = "";
    if (stoppedCurrentRequest && removedCount > 0) {
      responseMessage = Strings.ai.stoppedCurrentAndCleared.replace("{count}", String(removedCount)).replace("{userId}", String(targetUserId));
    } else if (stoppedCurrentRequest) {
      responseMessage = Strings.ai.stoppedCurrentRequestOnly.replace("{userId}", String(targetUserId));
    } else {
      responseMessage = Strings.ai.queueCleared.replace("{count}", String(removedCount)).replace("{userId}", String(targetUserId));
    }

    await ctx.reply(responseMessage, {
      parse_mode: 'Markdown',
      ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
    });
  });

  bot.command("qlimit", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);
    const args = ctx.message.text.split(' ');

    if (args.length < 3) {
      await ctx.reply("Usage: /qlimit <user_id> <duration>\nExample: /qlimit 123456789 1h", {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const targetUserId = args[1];
    const durationStr = args[2];

    if (!/^\d+$/.test(targetUserId)) {
      await ctx.reply(Strings.ai.invalidUserId, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const durationSeconds = parseDuration(durationStr);
    if (durationSeconds === -1) {
      await ctx.reply(Strings.ai.invalidDuration, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    try {
      const user = await db.query.usersTable.findFirst({ where: (fields, { eq }) => eq(fields.telegramId, targetUserId) });
      if (!user) {
        await ctx.reply(Strings.ai.userNotFound.replace("{userId}", targetUserId), {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
        return;
      }

      const timeoutEnd = new Date(Date.now() + (durationSeconds * 1000));
      await db.update(schema.usersTable)
        .set({ aiTimeoutUntil: timeoutEnd })
        .where(eq(schema.usersTable.telegramId, targetUserId));

      const filteredQueue = requestQueue.filter(item => item.userId !== parseInt(targetUserId));
      requestQueue.length = 0;
      requestQueue.push(...filteredQueue);

      await ctx.reply(Strings.ai.userTimedOut.replace("{userId}", targetUserId).replace("{timeoutEnd}", timeoutEnd.toISOString()), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    } catch (error) {
      await ctx.reply(Strings.ai.userTimeoutError.replace("{userId}", targetUserId).replace("{error}", error.message), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    }
  });

  bot.command("setexec", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);
    const args = ctx.message.text.split(' ');

    if (args.length < 3) {
      await ctx.reply("Usage: /setexec <user_id> <duration>\nExample: /setexec 123456789 5m\nUse 'unlimited' to remove limit.", {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const targetUserId = args[1];
    const durationStr = args[2];

    if (!/^\d+$/.test(targetUserId)) {
      await ctx.reply(Strings.ai.invalidUserId, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    let durationSeconds = 0;
    if (durationStr.toLowerCase() !== 'unlimited') {
      durationSeconds = parseDuration(durationStr);
      if (durationSeconds === -1) {
        await ctx.reply(Strings.ai.invalidDuration, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
        return;
      }
    }

    try {
      const user = await db.query.usersTable.findFirst({ where: (fields, { eq }) => eq(fields.telegramId, targetUserId) });
      if (!user) {
        await ctx.reply(Strings.ai.userNotFound.replace("{userId}", targetUserId), {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
        return;
      }

      await db.update(schema.usersTable)
        .set({ aiMaxExecutionTime: durationSeconds })
        .where(eq(schema.usersTable.telegramId, targetUserId));

      if (durationSeconds === 0) {
        await ctx.reply(Strings.ai.userExecTimeRemoved.replace("{userId}", targetUserId), {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
      } else {
        await ctx.reply(Strings.ai.userExecTimeSet.replace("{duration}", formatDuration(durationSeconds)).replace("{userId}", targetUserId), {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
      }
    } catch (error) {
      await ctx.reply(Strings.ai.userExecTimeError.replace("{userId}", targetUserId).replace("{error}", error.message), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    }
  });

  bot.command("rlimit", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);
    const args = ctx.message.text.split(' ');

    if (args.length < 2) {
      await ctx.reply("Usage: /rlimit <user_id>\nExample: /rlimit 123456789", {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    const targetUserId = args[1];

    if (!/^\d+$/.test(targetUserId)) {
      await ctx.reply(Strings.ai.invalidUserId, {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
      return;
    }

    try {
      const user = await db.query.usersTable.findFirst({ where: (fields, { eq }) => eq(fields.telegramId, targetUserId) });
      if (!user) {
        await ctx.reply(Strings.ai.userNotFound.replace("{userId}", targetUserId), {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
        return;
      }

      await db.update(schema.usersTable)
        .set({
          aiTimeoutUntil: null,
          aiMaxExecutionTime: 0
        })
        .where(eq(schema.usersTable.telegramId, targetUserId));

      await ctx.reply(Strings.ai.userLimitsRemoved.replace("{userId}", targetUserId), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    } catch (error) {
      await ctx.reply(Strings.ai.userLimitRemoveError.replace("{userId}", targetUserId).replace("{error}", error.message), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    }
  });

  bot.command("limits", spamwatchMiddleware, async (ctx) => {
    if (!isAdmin(ctx)) {
      const { Strings } = await getUserWithStringsAndModel(ctx, db);
      await ctx.reply(Strings.noPermission);
      return;
    }

    const { Strings } = await getUserWithStringsAndModel(ctx, db);
    const reply_to_message_id = replyToMessageId(ctx);

    try {
      const usersWithTimeouts = await db.query.usersTable.findMany({
        where: and(
          isNotNull(schema.usersTable.aiTimeoutUntil),
          gt(schema.usersTable.aiTimeoutUntil, new Date())
        ),
        columns: {
          telegramId: true,
          username: true,
          firstName: true,
          aiTimeoutUntil: true
        }
      });

      const usersWithExecLimits = await db.query.usersTable.findMany({
        where: gt(schema.usersTable.aiMaxExecutionTime, 0),
        columns: {
          telegramId: true,
          username: true,
          firstName: true,
          aiMaxExecutionTime: true
        }
      });

      if (usersWithTimeouts.length === 0 && usersWithExecLimits.length === 0) {
        await ctx.reply(Strings.ai.noLimitsSet, {
          parse_mode: 'Markdown',
          ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
        });
        return;
      }

      let limitsText = Strings.ai.limitsHeader + "\n\n";

      if (usersWithTimeouts.length > 0) {
        limitsText += Strings.ai.timeoutLimitsHeader + "\n";
        for (const user of usersWithTimeouts) {
          const displayName = user.username || user.firstName || "Unknown";
          const timeoutEnd = user.aiTimeoutUntil!.toISOString();
          limitsText += Strings.ai.timeoutLimitItem
            .replace("{displayName}", displayName)
            .replace("{userId}", user.telegramId)
            .replace("{timeoutEnd}", timeoutEnd) + "\n";
        }
        limitsText += "\n";
      }

      if (usersWithExecLimits.length > 0) {
        limitsText += Strings.ai.execLimitsHeader + "\n";
        for (const user of usersWithExecLimits) {
          const displayName = user.username || user.firstName || "Unknown";
          const execTime = formatDuration(user.aiMaxExecutionTime!);
          limitsText += Strings.ai.execLimitItem
            .replace("{displayName}", displayName)
            .replace("{userId}", user.telegramId)
            .replace("{execTime}", execTime) + "\n";
        }
      }

      await ctx.reply(limitsText.trim(), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    } catch (error) {
      await ctx.reply(Strings.ai.limitsListError.replace("{error}", error.message), {
        parse_mode: 'Markdown',
        ...(reply_to_message_id && { reply_parameters: { message_id: reply_to_message_id } })
      });
    }
  });
}
