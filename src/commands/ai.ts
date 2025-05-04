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
//const model = "qwen3:0.6b"
const model = "deepseek-r1:1.5b"

type TextContext = Context & { message: Message.TextMessage }

export function sanitizeForJson(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

async function getResponse(prompt: string, ctx: TextContext, replyGenerating: Message) {
  const Strings = getStrings(languageCode(ctx))

  if (!ctx.chat) return {
    "success": false,
    "error": Strings.unexpectedErr.replace("{error}", "No chat found"),
  }

  try {
    const aiResponse = await axios.post(`${process.env.ollamaApi}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: true,
    }, {
      responseType: "stream",
    })

    let fullResponse = ""
    let thoughts = ""
    let lastUpdate = Date.now()
    
    for await (const chunk of aiResponse.data) {
      const lines = chunk.toString().split('\n')
      for (const line of lines) {
        if (!line.trim()) continue
        let ln = JSON.parse(line)
        
        if (ln.response.includes("<think>")) { logger.logThinking(true) } else if (ln.response.includes("</think>")) { logger.logThinking(false) }

        try {
          const now = Date.now()
          
          if (ln.response) {
            const patchedThoughts = ln.response.replace("<think>", "`Thinking...`").replace("</think>", "`Finished thinking`")
            thoughts += patchedThoughts
            fullResponse += patchedThoughts

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
        } catch (e) {
          console.error("Error parsing chunk:", e)
        }
      }
    }

    return {
      "success": true,
      "response": fullResponse,
    }
  } catch (error: any) {
    let shouldPullModel = false

    if (error.response?.data?.error) {
      if (error.response.data.error.includes(`model '${model}' not found`) || error.status === 404) {
        shouldPullModel = true
      } else {
        console.error("[!] 1", error.response.data.error)
        return {
          "success": false,
          "error": error.response.data.error,
        }
      }
    } else if (error.status === 404) {
      shouldPullModel = true
    }

    if (shouldPullModel) {
      ctx.telegram.editMessageText(ctx.chat.id, replyGenerating.message_id, undefined, `🔄 Pulling ${model} from ollama...`)
      console.log(`[i] Pulling ${model} from ollama...`)

      const pullModelStream = await axios.post(`${process.env.ollamaApi}/api/pull`, {
        model: model,
        stream: false,
      })

      if (pullModelStream.data.status !== ("success")) {
        console.error("[!] Something went wrong:", pullModelStream.data)
        return {
          "success": false,
          "error": `❌ Something went wrong while pulling ${model}, please try your command again!`,
        }
      }

      console.log("[i] Model pulled successfully")
      return {
        "success": true,
        "response": `✅ Pulled ${model} successfully, please retry the command.`,
      }
    }

    if (error.response) {
      console.error("[!] 2", error.response)
      return {
        "success": false,
        "error": error.response,
      }
    }

    if (error.statusText) {
      console.error("[!] 3", error.statusText)
      return {
        "success": false,
        "error": error.statusText,
      }
    }

    return {
      "success": false,
      "error": "An unexpected error occurred",
    }
  }
}

export default (bot: Telegraf<Context>) => {
  bot.command("ask", spamwatchMiddleware, async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const textCtx = ctx as TextContext;
    const reply_to_message_id = replyToMessageId(textCtx)
    const Strings = getStrings(languageCode(textCtx))
    const message = textCtx.message.text
    const author = ("@" + ctx.from?.username) || ctx.from?.first_name

    logger.logCmdStart(author)

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

    const fixedMsg = message.replace(/\/ask /, "")
    if (fixedMsg.length < 1) {
      await ctx.reply(Strings.askNoMessage, {
        parse_mode: 'Markdown',
        ...({ reply_to_message_id })
      })
      return
    }

    logger.logPrompt(fixedMsg)

    const prompt = sanitizeForJson(
`You are a helpful assistant named Kowalski, who has been given a message from a user.

The message is:

${fixedMsg}`)
    const aiResponse = await getResponse(prompt, textCtx, replyGenerating)
    if (!aiResponse) return

    if (aiResponse.success && aiResponse.response) {
      if (!ctx.chat) return
      await rateLimiter.editMessageWithRetry(
        ctx,
        ctx.chat.id,
        replyGenerating.message_id,
        aiResponse.response,
        { parse_mode: 'Markdown' }
      )
    } else {
      if (!ctx.chat) return
      const error = Strings.unexpectedErr.replace("{error}", aiResponse.error)
      await rateLimiter.editMessageWithRetry(
        ctx,
        ctx.chat.id,
        replyGenerating.message_id,
        error,
        { parse_mode: 'Markdown' }
      )
      console.error("[!] Error sending response:", aiResponse.error)
    }
  })
}