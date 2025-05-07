// LOG.TS
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

class Logger {
  private static instance: Logger
  private thinking: boolean = false

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  logCmdStart(user: string): void {
    console.log(`[START] Received /ask from ${user}`)
  }

  logThinking(thinking: boolean): void {
    if (thinking) {
      console.log("[THINKING] Started")
    } else {
      console.log("[THINKING] Ended")
    }
  }

  logChunk(chatId: number, messageId: number, text: string, isOverflow: boolean = false): void {
    const prefix = isOverflow ? "[OVERFLOW]" : "[CHUNK]"
    console.log(`${prefix} [${chatId}:${messageId}] ${text.length} chars`)
  }

  logPrompt(prompt: string): void {
    console.log(`[PROMPT] ${prompt.length} chars: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`)
  }

  logError(error: any): void {
    if (error.response?.error_code === 429) {
      const retryAfter = error.response.parameters?.retry_after || 1
      console.error(`[RATE_LIMIT] Too Many Requests - retry after ${retryAfter}s`)
    } else if (error.response?.error_code === 400 && error.response?.description?.includes("can't parse entities")) {
      console.error("[PARSE_ERROR] Markdown parsing failed, retrying with plain text")
    } else {
      const errorDetails = {
        code: error.response?.error_code,
        description: error.response?.description,
        method: error.on?.method
      }
      console.error("[ERROR]", JSON.stringify(errorDetails, null, 2))
    }
  }
}

export const logger = Logger.getInstance() 