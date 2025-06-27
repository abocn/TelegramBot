// RATE-LIMITER.TS
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

import { Context } from 'telegraf'
import { logger } from './log'

class RateLimiter {
  private lastEditTime: number = 0
  private readonly minInterval: number = 5000
  private pendingUpdates: Map<string, string> = new Map()
  private updateQueue: Map<string, NodeJS.Timeout> = new Map()
  private readonly max_msg_length: number = 3500
  private overflowMessages: Map<string, number> = new Map()
  private isRateLimited: boolean = false
  private rateLimitEndTime: number = 0

  private getMessageKey(chatId: number, messageId: number): string {
    return `${chatId}:${messageId}`
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.isRateLimited) {
      const now = Date.now()
      if (now < this.rateLimitEndTime) {
        const waitTime = this.rateLimitEndTime - now
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      this.isRateLimited = false
    }
  }

  private async processUpdate(
    ctx: Context,
    chatId: number,
    messageId: number,
    options: any
  ): Promise<void> {
    const messageKey = this.getMessageKey(chatId, messageId)
    const latestText = this.pendingUpdates.get(messageKey)
    if (!latestText) return

    const now = Date.now()
    const timeSinceLastEdit = now - this.lastEditTime

    await this.waitForRateLimit()

    if (timeSinceLastEdit < this.minInterval) {
      const existingTimeout = this.updateQueue.get(messageKey)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const timeout = setTimeout(() => {
        this.processUpdate(ctx, chatId, messageId, options)
      }, this.minInterval - timeSinceLastEdit)

      this.updateQueue.set(messageKey, timeout)
      return
    }

    try {
      if (latestText.length > this.max_msg_length) {
        const chunks: string[] = []
        let currentChunk = ''
        let currentLength = 0

        // Split text into chunks while preserving markdown formatting
        const lines = latestText.split('\n')
        for (const line of lines) {
          if (currentLength + line.length + 1 > this.max_msg_length) {
            if (currentChunk) {
              chunks.push(currentChunk)
              currentChunk = ''
              currentLength = 0
            }
            // if a single line is too long, split
            if (line.length > this.max_msg_length) {
              for (let i = 0; i < line.length; i += this.max_msg_length) {
                chunks.push(line.substring(i, i + this.max_msg_length))
              }
            } else {
              currentChunk = line
              currentLength = line.length
            }
          } else {
            if (currentChunk) {
              currentChunk += '\n'
              currentLength++
            }
            currentChunk += line
            currentLength += line.length
          }
        }
        if (currentChunk) {
          chunks.push(currentChunk)
        }

        const firstChunk = chunks[0]
        logger.logChunk(chatId, messageId, firstChunk)

        try {
          await ctx.telegram.editMessageText(chatId, messageId, undefined, firstChunk, options)
        } catch (error: any) {
          if (!error.response?.description?.includes("message is not modified")) {
            throw error
          }
        }

        for (let i = 1; i < chunks.length; i++) {
          const chunk = chunks[i]
          const overflowMessageId = this.overflowMessages.get(messageKey)

          if (overflowMessageId) {
            try {
              await ctx.telegram.editMessageText(chatId, overflowMessageId, undefined, chunk, options)
              logger.logChunk(chatId, overflowMessageId, chunk, true)
            } catch (error: any) {
              if (!error.response?.description?.includes("message is not modified")) {
                throw error
              }
            }
          } else {
            const newMessage = await ctx.telegram.sendMessage(chatId, chunk, {
              ...options,
              reply_to_message_id: messageId
            })
            logger.logChunk(chatId, newMessage.message_id, chunk, true)
            this.overflowMessages.set(messageKey, newMessage.message_id)
          }
        }

        this.pendingUpdates.set(messageKey, firstChunk)
        if (chunks.length > 1) {
          this.pendingUpdates.set(
            this.getMessageKey(chatId, this.overflowMessages.get(messageKey)!),
            chunks[chunks.length - 1]
          )
        }
      } else {
        const sanitizedText = latestText
        logger.logChunk(chatId, messageId, sanitizedText)

        try {
          await ctx.telegram.editMessageText(chatId, messageId, undefined, sanitizedText, options)
        } catch (error: any) {
          if (!error.response?.description?.includes("message is not modified")) {
            throw error
          }
        }
        this.pendingUpdates.delete(messageKey)
      }

      this.lastEditTime = Date.now()
      this.updateQueue.delete(messageKey)
    } catch (error: any) {
      if (error.response?.error_code === 429) {
        const retryAfter = error.response.parameters?.retry_after || 1
        this.isRateLimited = true
        this.rateLimitEndTime = Date.now() + (retryAfter * 1000)

        const existingTimeout = this.updateQueue.get(messageKey)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        const timeout = setTimeout(() => {
          this.processUpdate(ctx, chatId, messageId, options)
        }, retryAfter * 1000)

        this.updateQueue.set(messageKey, timeout)
      } else if (error.response?.error_code === 400) {
        if (error.response?.description?.includes("can't parse entities")) {
          // try again with plain text
          const plainOptions = { ...options, parse_mode: undefined }
          await this.processUpdate(ctx, chatId, messageId, plainOptions)
        } else if (error.response?.description?.includes("MESSAGE_TOO_LONG")) {
          const plainOptions = { ...options, parse_mode: undefined }
          await this.processUpdate(ctx, chatId, messageId, plainOptions)
        } else if (error.response?.description?.includes("message is not modified")) {
          this.pendingUpdates.delete(messageKey)
          this.updateQueue.delete(messageKey)
        } else {
          logger.logError(error)
          this.pendingUpdates.delete(messageKey)
          this.updateQueue.delete(messageKey)
        }
      } else {
        logger.logError(error)
        this.pendingUpdates.delete(messageKey)
        this.updateQueue.delete(messageKey)
      }
    }
  }

  async editMessageWithRetry(
    ctx: Context,
    chatId: number,
    messageId: number,
    text: string,
    options: any
  ): Promise<void> {
    const messageKey = this.getMessageKey(chatId, messageId)
    this.pendingUpdates.set(messageKey, text)
    await this.processUpdate(ctx, chatId, messageId, options)
  }
}

export const rateLimiter = new RateLimiter() 