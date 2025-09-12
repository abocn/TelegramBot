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

import express, { Request, Response } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../../database/schema";
import { eq } from "drizzle-orm";
import { twoFactorTable, usersTable } from "../../database/schema";
import { Telegraf } from "telegraf";
import { getStrings } from "../plugins/checklang";
import { register } from "../monitoring/metrics";

const client = new Client({ connectionString: process.env.databaseUrl });
const db = drizzle(client, { schema });

const bot = new Telegraf(process.env.botToken!);
const botName = bot.botInfo?.first_name && bot.botInfo?.last_name ? `${bot.botInfo.first_name} ${bot.botInfo.last_name}` : "Kowalski"

function shouldLogLonger() {
  return process.env.longerLogs === 'true';
}

export async function startServer() {
  await client.connect();

  const app = express();

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.send("OK");
  });

  app.get("/metrics", async (_req: Request, res: Response) => {
    try {
      const { performLiveHealthCheck } = require('../utils/real-time-health');
      try {
        await performLiveHealthCheck();
      } catch (error) {
        console.error("[🌐 API] Error performing health checks:", error);
      }

      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      console.error("[🌐 API] Error generating metrics:", error);
      res.status(500).send("Error generating metrics");
    }
  });

  app.post("/2fa/get", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        console.log("[🌐 API] Missing userId in request");
        return res.status(400).json({ generated: false, error: "User ID is required" });
      }

      if (shouldLogLonger()) {
        console.log("[🌐 API] Looking up user:", userId);
      }
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.telegramId, userId),
        columns: {
          languageCode: true,
        },
      });

      if (!user) {
        console.log("[🌐 API] User not found:", userId);
        return res.status(404).json({ generated: false, error: "User not found" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      console.log("[🌐 API] Inserting 2FA record");

      await db.insert(twoFactorTable).values({
        userId,
        currentCode: code,
        codeAttempts: 0,
        codeExpiresAt: new Date(Date.now() + 1000 * 60 * 5),
      }).onConflictDoUpdate({
        target: twoFactorTable.userId,
        set: {
          currentCode: code,
          codeAttempts: 0,
          codeExpiresAt: new Date(Date.now() + 1000 * 60 * 5),
        }
      });

      if (shouldLogLonger()) {
        console.log("[🌐 API] Sending 2FA message");
      }

      try {
        const Strings = getStrings(user.languageCode);
        const message = Strings.twoFactor.codeMessage
          .replace("{botName}", botName)
          .replace("{code}", code);
        await bot.telegram.sendMessage(userId, message, { parse_mode: "MarkdownV2" });
        if (shouldLogLonger()) {
          console.log("[🌐 API] Message sent successfully");
        }
      } catch (error) {
        console.error("[🌐 API] Error sending 2FA code to user", error);
        return res.status(500).json({ generated: false, error: "Error sending 2FA message" });
      }

      res.json({ generated: true });

    } catch (error) {
      console.error("[🌐 API] Unexpected error in 2FA endpoint:", error);
      return res.status(500).json({ generated: false, error: "Internal server error" });
    }
  });

  app.listen(3030, () => {
    console.log("[🌐 API] Running on port 3030\n");
  });
}