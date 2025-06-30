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
import { languageCode } from "../utils/language-code"
import axios from "axios"
import { rateLimiter } from "../utils/rate-limiter"
import { logger } from "../utils/log"
import { ensureUserInDb } from "../utils/ensure-user"
import * as schema from '../db/schema'
import type { NodePgDatabase } from "drizzle-orm/node-postgres"

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch)
export const flash_model = process.env.flashModel || "gemma3:4b"
export const thinking_model = process.env.thinkingModel || "qwen3:4b"

type TextContext = Context & { message: Message.TextMessage }

type User = typeof schema.usersTable.$inferSelect

interface ModelInfo {
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

export const models: ModelInfo[] = [
  {
    name: 'gemma3n',
    label: 'Gemma3n',
    descriptionEn: 'Gemma3n is a family of open, light on-device models for general tasks.',
    descriptionPt: 'Gemma3n é uma família de modelos abertos, leves e para dispositivos locais, para tarefas gerais.',
    models: [
      { name: 'gemma3n:e2b', label: 'Gemma3n e2b', parameterSize: '2B' },
      { name: 'gemma3n:e4b', label: 'Gemma3n e4b', parameterSize: '4B' },
    ]
  },
  {
    name: 'gemma3-abliterated',
    label: 'Gemma3 Uncensored',
    descriptionEn: 'Gemma3-abliterated is a family of open, uncensored models for general tasks.',
    descriptionPt: 'Gemma3-abliterated é uma família de modelos abertos, não censurados, para tarefas gerais.',
    models: [
      { name: 'huihui_ai/gemma3-abliterated:1b', label: 'Gemma3-abliterated 1B', parameterSize: '1b' },
      { name: 'huihui_ai/gemma3-abliterated:4b', label: 'Gemma3-abliterated 4B', parameterSize: '4b' },
    ]
  },
  {
    name: 'qwen3',
    label: 'Qwen3',
    descriptionEn: 'Qwen3 is a multilingual reasoning model series.',
    descriptionPt: 'Qwen3 é uma série de modelos multilingues.',
    models: [
      { name: 'qwen3:4b', label: 'Qwen3 4B', parameterSize: '4B' },
    ]
  },
  {
    name: 'deepseek',
    label: 'DeepSeek',
    descriptionEn: 'DeepSeek is a research model for reasoning tasks.',
    descriptionPt: 'DeepSeek é um modelo de pesquisa para tarefas de raciocínio.',
    models: [
      { name: 'deepseek-r1:1.5b', label: 'DeepSeek 1.5B', parameterSize: '1.5B' },
      { name: 'huihui_ai/deepseek-r1-abliterated:1.5b', label: 'DeepSeek Uncensored 1.5B', parameterSize: '1.5B' },
    ]
  }
];

const enSystemPrompt = `You are a plaintext-only, helpful assistant called {botName}.
Current Date/Time (UTC): {date}

---

Respond to the user's message:
{message}`

const ptSystemPrompt = `Você é um assistente de texto puro e útil chamado {botName}.
Data/Hora atual (UTC): {date}

---

Responda à mensagem do usuário:
{message}`

async function usingSystemPrompt(ctx: TextContext, db: NodePgDatabase<typeof schema>, botName: string): Promise<string> {
  const user = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
  if (user.length === 0) await ensureUserInDb(ctx, db);
  const userData = user[0];
  const lang = userData?.languageCode || "en";
  const utcDate = new Date().toISOString();
  const prompt = lang === "pt"
    ? ptSystemPrompt.replace("{botName}", botName).replace("{date}", utcDate).replace("{message}", ctx.message.text)
    : enSystemPrompt.replace("{botName}", botName).replace("{date}", utcDate).replace("{message}", ctx.message.text);
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

export async function preChecks() {
  const envs = [
    "ollamaApi",
    "flashModel",
    "thinkingModel",
  ]

  let checked = 0;
  for (const env of envs) {
    if (!process.env[env]) {
      console.error(`[✨ AI | !] ❌ ${env} not set!`)
      return false
    }
    checked++;
  }

  const ollamaApi = process.env.ollamaApi
  if (!ollamaApi) {
    console.error("[✨ AI | !] ❌ ollamaApi not set!")
    return false
  }
  let ollamaOk = false
  for (let i = 0; i < 10; i++) {
    try {
      const res = await axios.get(ollamaApi, { timeout: 2000 })
      if (res && res.data && typeof res.data === 'object' && 'ollama' in res.data) {
        ollamaOk = true
        break
      }
      if (res && res.status === 200) {
        ollamaOk = true
        break
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  if (!ollamaOk) {
    console.error("[✨ AI | !] ❌ Ollama API is not responding at ", ollamaApi)
    return false
  }
  checked++;
  console.log(`[✨  AI] Pre-checks passed [${checked}/${envs.length + 1}]`)
  return true
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

function escapeMarkdown(text: string): string {
  return text.replace(/([*_])/g, '\\$1');
}

async function getResponse(prompt: string, ctx: TextContext, replyGenerating: Message, model: string, aiTemperature: number): Promise<{ success: boolean; response?: string; error?: string }> {
  const Strings = getStrings(languageCode(ctx));
  if (!ctx.chat) {
    return {
      success: false,
      error: Strings.unexpectedErr.replace("{error}", "No chat found"),
    };
  }
  const modelHeader = `🤖 *${model}*  |  🌡️ *${aiTemperature}*\n\n`;
  try {
    const aiResponse = await axios.post<unknown>(
      `${process.env.ollamaApi}/api/generate`,
      {
        model,
        prompt,
        stream: true,
        options: {
          temperature: aiTemperature
        }
      },
      {
        responseType: "stream",
      }
    );
    let fullResponse = "";
    let thoughts = "";
    let lastUpdate = Date.now();
    let sentHeader = false;
    const stream: NodeJS.ReadableStream = aiResponse.data as any;
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        let ln: OllamaResponse;
        try {
          ln = JSON.parse(line);
        } catch (e) {
          console.error("[✨ AI | !] Error parsing chunk:", e);
          continue;
        }
        if (model === thinking_model && ln.response) {
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
        }
        const now = Date.now();
        if (ln.response) {
          if (model === thinking_model) {
            let patchedThoughts = ln.response;
            const thinkTagRx = /<think>([\s\S]*?)<\/think>/g;
            patchedThoughts = patchedThoughts.replace(thinkTagRx, (p1) => p1.trim().length > 0 ? '`' + Strings.ai.thinking + '`' + p1 + '`' + Strings.ai.finishedThinking + '`' : '');
            patchedThoughts = patchedThoughts.replace(/<think>/g, '`' + Strings.ai.thinking + '`');
            patchedThoughts = patchedThoughts.replace(/<\/think>/g, '`' + Strings.ai.finishedThinking + '`');
            thoughts += patchedThoughts;
            fullResponse += patchedThoughts;
          } else {
            fullResponse += ln.response;
          }
          if (now - lastUpdate >= 1000 || !sentHeader) {
            await rateLimiter.editMessageWithRetry(
              ctx,
              ctx.chat.id,
              replyGenerating.message_id,
              modelHeader + fullResponse,
              { parse_mode: 'Markdown' }
            );
            lastUpdate = now;
            sentHeader = true;
          }
        }
      }
    }
    return {
      success: true,
      response: fullResponse,
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
          Strings.ai.pulling.replace("{model}", model),
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
            error: `❌ Something went wrong while pulling ${escapeMarkdown(model)}: ${escapeMarkdown(pullMsg)}`,
          };
        }
        console.log(`[✨ AI] ${model} pulled successfully`);
        return {
          success: true,
          response: `✅ Pulled ${escapeMarkdown(model)} successfully, please retry the command.`,
        };
      }
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
}

async function handleAiReply(ctx: TextContext, model: string, prompt: string, replyGenerating: Message, aiTemperature: number) {
  const Strings = getStrings(languageCode(ctx));
  const aiResponse = await getResponse(prompt, ctx, replyGenerating, model, aiTemperature);
  if (!aiResponse) return;
  if (!ctx.chat) return;
  const modelHeader = `🤖 *${model}*  |  🌡️ *${aiTemperature}*\n\n`;
  if (aiResponse.success && aiResponse.response) {
    await rateLimiter.editMessageWithRetry(
      ctx,
      ctx.chat.id,
      replyGenerating.message_id,
      modelHeader + aiResponse.response,
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

async function getUserWithStringsAndModel(ctx: Context, db: NodePgDatabase<typeof schema>): Promise<{ user: User; Strings: ReturnType<typeof getStrings>; languageCode: string; customAiModel: string; aiTemperature: number }> {
  const userArr = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
  let user = userArr[0];
  if (!user) {
    await ensureUserInDb(ctx, db);
    const newUserArr = await db.query.usersTable.findMany({ where: (fields, { eq }) => eq(fields.telegramId, String(ctx.from!.id)), limit: 1 });
    user = newUserArr[0];
    const Strings = getStrings(user.languageCode);
    return { user, Strings, languageCode: user.languageCode, customAiModel: user.customAiModel, aiTemperature: user.aiTemperature };
  }
  const Strings = getStrings(user.languageCode);
  return { user, Strings, languageCode: user.languageCode, customAiModel: user.customAiModel, aiTemperature: user.aiTemperature };
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

  bot.command(["ask", "think"], spamwatchMiddleware, async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return
    const isAsk = ctx.message.text.startsWith("/ask")
    const model = isAsk ? flash_model : thinking_model
    const textCtx = ctx as TextContext
    const reply_to_message_id = replyToMessageId(textCtx)
    const { Strings, aiTemperature } = await getUserWithStringsAndModel(textCtx, db)
    const message = textCtx.message.text
    const author = ("@" + ctx.from?.username) || ctx.from?.first_name

    logger.logCmdStart(author, model === flash_model ? "ask" : "think")

    if (!process.env.ollamaApi) {
      await ctx.reply(Strings.ai.disabled, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })
      return
    }

    const fixedMsg = message.replace(/^\/(ask|think)(@\w+)?\s*/, "").trim()
    if (fixedMsg.length < 1) {
      await ctx.reply(Strings.ai.askNoMessage, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })
      return
    }

    const replyGenerating = await ctx.reply(Strings.ai.askGenerating.replace("{model}", model), {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
    })

    logger.logPrompt(fixedMsg)

    const prompt = sanitizeForJson(await usingSystemPrompt(textCtx, db, botName))
    await handleAiReply(textCtx, model, prompt, replyGenerating, aiTemperature)
  })

  bot.command(["ai"], spamwatchMiddleware, async (ctx) => {
    try {
      if (!ctx.message || !("text" in ctx.message)) return
      const textCtx = ctx as TextContext
      const reply_to_message_id = replyToMessageId(textCtx)
      const { Strings, customAiModel, aiTemperature } = await getUserWithStringsAndModel(textCtx, db)
      const message = textCtx.message.text
      const author = ("@" + ctx.from?.username) || ctx.from?.first_name

      logger.logCmdStart(author, "ask")

      if (!process.env.ollamaApi) {
        await ctx.reply(Strings.ai.disabled, {
          parse_mode: 'Markdown',
          ...({ reply_to_message_id })
        })
        return
      }

      const fixedMsg = message.replace(/^\/ai(@\w+)?\s*/, "").trim()
      if (fixedMsg.length < 1) {
        await ctx.reply(Strings.ai.askNoMessage, {
          parse_mode: 'Markdown',
          ...({ reply_to_message_id })
        })
        return
      }

      const modelLabel = getModelLabelByName(customAiModel)
      const replyGenerating = await ctx.reply(Strings.ai.askGenerating.replace("{model}", modelLabel), {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })

      logger.logPrompt(fixedMsg)

      const prompt = sanitizeForJson(await usingSystemPrompt(textCtx, db, botName))
      await handleAiReply(textCtx, customAiModel, prompt, replyGenerating, aiTemperature)
    } catch (err) {
      const Strings = getStrings(languageCode(ctx));
      if (ctx && ctx.reply) {
        try {
          await ctx.reply(Strings.unexpectedErr.replace("{error}", (err && err.message ? err.message : String(err))), { parse_mode: 'Markdown' })
        } catch (e) {
          console.error("[✨ AI | !] Failed to send error reply:", e)
        }
      }
    }
  })
}