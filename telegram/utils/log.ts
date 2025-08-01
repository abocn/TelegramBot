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

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  logCmdStart(user: string, command: string, model: string): void {
    console.log(`\n[✨ AI | START] Received /${command} for model ${model} (from ${user})`)
  }

  logThinking(chatId: number, messageId: number, thinking: boolean): void {
    if (thinking) {
      console.log(`[✨ AI | THINKING | ${chatId}:${messageId}] Model started thinking`)
    } else {
      console.log(`[✨ AI | THINKING | ${chatId}:${messageId}] Model stopped thinking`)
    }
  }

  logChunk(chatId: number, messageId: number, text: string, isOverflow: boolean = false): void {
    if (process.env.longerLogs === 'true') {
      const prefix = isOverflow ? "[✨ AI | OVERFLOW]" : "[✨ AI | CHUNK]"
      console.log(`${prefix} [${chatId}:${messageId}] ${text.length} chars pushed to Telegram`)
    }
  }

  logPrompt(prompt: string): void {
    if (process.env.longerLogs === 'true') {
      console.log(`[✨ AI | PROMPT] ${prompt}`)
    }
  }

  logError(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { error_code?: number, parameters?: { retry_after?: number }, description?: string }, on?: { method?: string } };
      if (err.response?.error_code === 429) {
        const retryAfter = err.response.parameters?.retry_after || 1;
        console.error(`[✨ AI | RATE_LIMIT] Too Many Requests - retry after ${retryAfter}s`);
      } else if (err.response?.error_code === 400 && err.response?.description?.includes("can't parse entities")) {
        console.error("[✨ AI | PARSE_ERROR] Markdown parsing failed, retrying with plain text");
      } else {
        const errorDetails = {
          code: err.response?.error_code,
          description: err.response?.description,
          method: err.on?.method
        };
        console.error("[✨ AI | ERROR]", JSON.stringify(errorDetails, null, 2));
      }
    } else {
      console.error("[✨ AI | ERROR]", error);
    }
  }
}

export const logger = Logger.getInstance()