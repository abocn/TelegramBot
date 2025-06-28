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

const spamwatchMiddleware = spamwatchMiddlewareModule(isOnSpamWatch)
export const flash_model = process.env.flashModel || "gemma3:4b"
export const thinking_model = process.env.thinkingModel || "qwen3:4b"

type TextContext = Context & { message: Message.TextMessage }

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
  console.log(`[✨ AI] Pre-checks passed [${checked}/${envs.length}]\n`)
  return true
}

function isAxiosError(error: unknown): error is { response?: { data?: { error?: string }, status?: number }, request?: unknown, message?: string } {
  return typeof error === 'object' && error !== null && (
    'response' in error || 'request' in error || 'message' in error
  )
}

function extractAxiosErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const err = error as Record<string, unknown>;
    if (err.response && typeof err.response === 'object') {
      const resp = err.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === 'object' && 'error' in resp.data) {
        return String((resp.data as Record<string, unknown>).error);
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

async function getResponse(prompt: string, ctx: TextContext, replyGenerating: Message, model: string) {
  const Strings = getStrings(languageCode(ctx))

  if (!ctx.chat) {
    return {
      success: false,
      error: Strings.unexpectedErr.replace("{error}", "No chat found"),
    }
  }

  try {
    const aiResponse = await axios.post(
      `${process.env.ollamaApi}/api/generate`,
      {
        model,
        prompt,
        stream: true,
      },
      {
        responseType: "stream",
      }
    )

    let fullResponse = ""
    let thoughts = ""
    let lastUpdate = Date.now()

    const stream = aiResponse.data
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n')
      for (const line of lines) {
        if (!line.trim()) continue
        let ln
        try {
          ln = JSON.parse(line)
        } catch (e) {
          console.error("[✨ AI | !] Error parsing chunk:", e)
          continue
        }

        if (model === thinking_model) {
          if (ln.response.includes('<think>')) {
            const thinkMatch = ln.response.match(/<think>([\s\S]*?)<\/think>/)
            if (thinkMatch && thinkMatch[1].trim().length > 0) {
              logger.logThinking(ctx.chat.id, replyGenerating.message_id, true)
            } else if (!thinkMatch) {
              logger.logThinking(ctx.chat.id, replyGenerating.message_id, true)
            }
          } else if (ln.response.includes('</think>')) {
            logger.logThinking(ctx.chat.id, replyGenerating.message_id, false)
          }
        }

        const now = Date.now()
        if (ln.response) {
          if (model === thinking_model) {
            let patchedThoughts = ln.response
            const thinkTagRx = /<think>([\s\S]*?)<\/think>/g
            patchedThoughts = patchedThoughts.replace(thinkTagRx, (match, p1) => p1.trim().length > 0 ? '`Thinking...`' + p1 + '`Finished thinking`' : '')
            patchedThoughts = patchedThoughts.replace(/<think>/g, '`Thinking...`')
            patchedThoughts = patchedThoughts.replace(/<\/think>/g, '`Finished thinking`')
            thoughts += patchedThoughts
            fullResponse += patchedThoughts
          } else {
            fullResponse += ln.response
          }
          if (now - lastUpdate >= 1000) {
            await rateLimiter.editMessageWithRetry(
              ctx,
              ctx.chat.id,
              replyGenerating.message_id,
              thoughts,
              { parse_mode: 'Markdown' }
            )
            lastUpdate = now
          }
        }
      }
    }

    return {
      success: true,
      response: fullResponse,
    }
  } catch (error: unknown) {
    const errorMsg = extractAxiosErrorMessage(error)
    console.error("[✨ AI | !] Error:", errorMsg)

    // model not found or 404
    if (isAxiosError(error) && error.response && typeof error.response === 'object') {
      const resp = error.response as Record<string, unknown>;
      const errData = resp.data && typeof resp.data === 'object' && 'error' in resp.data ? (resp.data as Record<string, unknown>).error : undefined;
      const errStatus = 'status' in resp ? resp.status : undefined;
      if ((typeof errData === 'string' && errData.includes(`model '${model}' not found`)) || errStatus === 404) {
        ctx.telegram.editMessageText(
          ctx.chat.id,
          replyGenerating.message_id,
          undefined,
          `🔄 *Pulling ${model} from Ollama...*\n\nThis may take a few minutes...`,
          { parse_mode: 'Markdown' }
        )
        console.log(`[✨ AI | i] Pulling ${model} from ollama...`)
        try {
          await axios.post(
            `${process.env.ollamaApi}/api/pull`,
            {
              model,
              stream: false,
              timeout: process.env.ollamaApiTimeout || 10000,
            }
          )
        } catch (e: unknown) {
          const pullMsg = extractAxiosErrorMessage(e)
          console.error("[✨ AI | !] Pull error:", pullMsg)
          return {
            success: false,
            error: `❌ Something went wrong while pulling ${model}: ${pullMsg}`,
          }
        }
        console.log(`[✨ AI | i] ${model} pulled successfully`)
        return {
          success: true,
          response: `✅ Pulled ${model} successfully, please retry the command.`,
        }
      }
    }
    return {
      success: false,
      error: errorMsg,
    }
  }
}

export default (bot: Telegraf<Context>) => {
  const botName = bot.botInfo?.first_name && bot.botInfo?.last_name ? `${bot.botInfo.first_name} ${bot.botInfo.last_name}` : "Kowalski"

  bot.command(["ask", "think"], spamwatchMiddleware, async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return
    const isAsk = ctx.message.text.startsWith("/ask")
    const model = isAsk ? flash_model : thinking_model
    const textCtx = ctx as TextContext
    const reply_to_message_id = replyToMessageId(textCtx)
    const Strings = getStrings(languageCode(textCtx))
    const message = textCtx.message.text
    const author = ("@" + ctx.from?.username) || ctx.from?.first_name

    logger.logCmdStart(author, model === flash_model ? "ask" : "think")

    if (!process.env.ollamaApi) {
      await ctx.reply(Strings.aiDisabled, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })
      return
    }

    const replyGenerating = await ctx.reply(Strings.askGenerating.replace("{model}", model), {
      parse_mode: 'Markdown',
      ...({ reply_to_message_id })
    })

    const fixedMsg = message.replace(/\/(ask|think) /, "")
    if (fixedMsg.length < 1) {
      await ctx.reply(Strings.askNoMessage, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })
      return
    }

    logger.logPrompt(fixedMsg)

    const prompt = sanitizeForJson(
`You are a plaintext-only, helpful assistant called ${botName}.
Current Date/Time (UTC): ${new Date().toLocaleString()}

---

Respond to the user's message:
${fixedMsg}`)
    const aiResponse = await getResponse(prompt, textCtx, replyGenerating, model)
    if (!aiResponse) return

    if (!ctx.chat) return
    if (aiResponse.success && aiResponse.response) {
      await rateLimiter.editMessageWithRetry(
        ctx,
        ctx.chat.id,
        replyGenerating.message_id,
        aiResponse.response,
        { parse_mode: 'Markdown' }
      )
      return
    }
    const error = Strings.unexpectedErr.replace("{error}", aiResponse.error)
    await rateLimiter.editMessageWithRetry(
      ctx,
      ctx.chat.id,
      replyGenerating.message_id,
      error,
      { parse_mode: 'Markdown' }
    )
  })
}