// WIKI.TS
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

import axios from "axios";
import { Context, Telegraf } from "telegraf";
import { replyToMessageId } from "../utils/reply-to-message-id";
import * as crypto from 'crypto';
import { eq, and, gt, lt } from 'drizzle-orm';
import { trackCommand } from '../utils/track-command';

import { getUserAndStrings } from '../utils/get-user-strings';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mediaWikiToHtml(input: string) {
  input = escapeHtml(input);

  input = input.replace(/&lt;!--.*?--&gt;/gs, '');
  input = input.replace(/&lt;ref[^&gt;]*&gt;.*?&lt;\/ref&gt;/gs, '');
  input = input.replace(/&lt;ref[^&gt;]*\/&gt;/g, '');

  let previousInput;
  do {
    previousInput = input;
    input = input.replace(/{{[^{}]*}}/g, '');
  } while (input !== previousInput);

  input = input.replace(/{{|}}/g, '');
  input = input.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, link, text) => {
    return text;
  });
  input = input.replace(/\[\[([^\]]+)\]\]/g, (_, link) => {
    return link;
  });
  input = input.replace(/'''(.*?)'''/g, '<b>$1</b>');
  input = input.replace(/''(.*?)''/g, '<i>$1</i>');
  input = input.replace(/===(.*?)===/g, '<b>$1</b>');
  input = input.replace(/==(.*?)==/g, '<b>$1</b>');

  input = input.replace(/^\*\s/gm, '• ');
  input = input.replace(/^\#\s/gm, '1. ');
  input = input.replace(/\[\[File:[^\]]+\]\]/g, '');
  input = input.replace(/\[\[Image:[^\]]+\]\]/g, '');

  return input;
}

const PAGE_SIZE = 2048;
const DEFAULT_CACHE_AGE = 2 * 60 * 60 * 1000;
const PAGINATION_CACHE_AGE = 30 * 60 * 1000;

async function getCachedWiki(db: NodePgDatabase<typeof schema>, query: string): Promise<{ content: string; url: string } | null> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheId = crypto.createHash('md5').update(normalizedQuery).digest('hex');
  const results = await db
    .select()
    .from(schema.wikiCacheTable)
    .where(
      and(
        eq(schema.wikiCacheTable.id, cacheId),
        gt(schema.wikiCacheTable.updatedAt, new Date(Date.now() - DEFAULT_CACHE_AGE))
      )
    )
    .limit(1);

  if (results.length > 0) {
    await db
      .update(schema.wikiCacheTable)
      .set({ updatedAt: new Date() })
      .where(eq(schema.wikiCacheTable.id, cacheId));

    return {
      content: results[0].content,
      url: results[0].url
    };
  }

  return null;
}

async function setCachedWiki(db: NodePgDatabase<typeof schema>, query: string, content: string, url: string): Promise<void> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheId = crypto.createHash('md5').update(normalizedQuery).digest('hex');

  await db
    .insert(schema.wikiCacheTable)
    .values({
      id: cacheId,
      query: normalizedQuery,
      content,
      url,
      cacheAge: DEFAULT_CACHE_AGE
    })
    .onConflictDoUpdate({
      target: schema.wikiCacheTable.id,
      set: {
        content,
        url,
        updatedAt: new Date()
      }
    });
}

async function savePaginationData(db: NodePgDatabase<typeof schema>, cacheKey: string, userId: string, pages: string[]): Promise<void> {
  const expiresAt = new Date(Date.now() + PAGINATION_CACHE_AGE);

  await db
    .insert(schema.wikiPaginationTable)
    .values({
      id: cacheKey,
      userId,
      pages,
      expiresAt
    })
    .onConflictDoUpdate({
      target: schema.wikiPaginationTable.id,
      set: {
        pages,
        expiresAt,
      }
    });

  await db
    .delete(schema.wikiPaginationTable)
    .where(lt(schema.wikiPaginationTable.expiresAt, new Date()));
}

async function getPaginationData(db: NodePgDatabase<typeof schema>, cacheKey: string): Promise<string[] | null> {
  const results = await db
    .select()
    .from(schema.wikiPaginationTable)
    .where(
      and(
        eq(schema.wikiPaginationTable.id, cacheKey),
        gt(schema.wikiPaginationTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (results.length > 0) {
    await db
      .update(schema.wikiPaginationTable)
      .set({ expiresAt: new Date(Date.now() + PAGINATION_CACHE_AGE) })
      .where(eq(schema.wikiPaginationTable.id, cacheKey));

    return results[0].pages;
  }

  return null;
}

export default (bot: Telegraf<Context>, db: NodePgDatabase<typeof schema>) => {
  bot.command("wiki", async (ctx) => {
    const startTime = Date.now();

    try {
      const { Strings } = await getUserAndStrings(ctx, db);
      if (!ctx.message || !ctx.message.text) {
        return ctx.reply(Strings.wiki.noSearchTerm);
      }

    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      return ctx.reply(Strings.wiki.noSearchTerm);
    }

    const userInput = parts.slice(1).join(' ');
    const userInputCapitalized = userInput.charAt(0).toUpperCase() + userInput.slice(1);
    const apiUrl = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(userInputCapitalized)}&action=raw`;

    let convertedContent: string;
    let fromCache = false;

    try {
      const cachedData = await getCachedWiki(db, userInput);

      if (cachedData) {
        convertedContent = cachedData.content;
        fromCache = true;
      } else {
        const response = await axios(apiUrl, { headers: { 'Accept': "text/plain" } });
        const rawContent = response.data.replace(/<\/?div>/g, "");
        convertedContent = mediaWikiToHtml(rawContent);

        await setCachedWiki(db, userInput, convertedContent, apiUrl);
      }
    } catch (error) {
      return ctx.reply(Strings.wiki.error);
    }

    const cacheKeyHash = crypto.createHash('md5').update(`${ctx.from?.id}_${userInput}`).digest('hex');
    const cacheKey = cacheKeyHash;
    const pages: string[] = [];

    for (let i = 0; i < convertedContent.length; i += PAGE_SIZE) {
      let pageContent = convertedContent.slice(i, i + PAGE_SIZE);

      pageContent = pageContent.replace(/<\/?[bi]>/g, '');

      pages.push(pageContent);
    }

    await savePaginationData(db, cacheKey, ctx.from?.id?.toString() || '', pages);

    const firstPage = pages[0] || Strings.wiki.noContent;
    const reply_to_message_id = replyToMessageId(ctx);

    const options: any = {
      parse_mode: 'HTML',
      reply_to_message_id,
      disable_web_page_preview: true
    };

    if (pages.length > 1) {
      options.reply_markup = {
        inline_keyboard: [[
          {
            text: Strings.wiki.showMore.replace('{current}', '2').replace('{total}', pages.length.toString()),
            callback_data: `wiki|${cacheKey}|1|${ctx.from?.id}`
          }
        ]]
      };
    }

    await ctx.reply(firstPage, options);

    await trackCommand(db, ctx, 'wiki', true, undefined, startTime);
    } catch (error) {
      await trackCommand(db, ctx, 'wiki', false, error.message, startTime);
      throw error;
    }
  });

  bot.action(/wiki\|([^|]+)\|(\d+)\|(\d+)/, async (ctx) => {
    const cacheKey = ctx.match[1];
    const currentPage = parseInt(ctx.match[2]);
    const userId = ctx.match[3];
    const { Strings } = await getUserAndStrings(ctx, db);

    const pages = await getPaginationData(db, cacheKey);
    if (!pages) {
      console.log(`Wiki pagination data not found for key: ${cacheKey}`);
      try {
        await ctx.answerCbQuery(Strings.wiki.contentUnavailable);
      } catch (error) {
        console.error('Failed to answer callback query:', error);
      }
      return;
    }

    if (currentPage >= pages.length) {
      console.log(`Page ${currentPage} out of range (total: ${pages.length})`);
      return ctx.answerCbQuery(Strings.wiki.contentUnavailable);
    }

    const pageContent = pages[currentPage];
    const totalPages = pages.length;

    const options: any = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const buttons: any[] = [];

    if (currentPage > 0) {
      buttons.push({
        text: Strings.wiki.previous,
        callback_data: `wiki|${cacheKey}|${currentPage - 1}|${userId}`
      });
    }

    if (currentPage < totalPages - 1) {
      buttons.push({
        text: Strings.wiki.next.replace('{current}', (currentPage + 2).toString()).replace('{total}', totalPages.toString()),
        callback_data: `wiki|${cacheKey}|${currentPage + 1}|${userId}`
      });
    }

    if (buttons.length > 0) {
      options.reply_markup = {
        inline_keyboard: [buttons]
      };
    }

    try {
      await ctx.editMessageText(pageContent, options);
      await ctx.answerCbQuery(Strings.wiki.pageInfo.replace('{current}', (currentPage + 1).toString()).replace('{total}', totalPages.toString()));
    } catch (error: any) {
      console.error('Error editing wiki message:', error);
      if (error.message?.includes('message is not modified')) {
        await ctx.answerCbQuery(Strings.wiki.alreadyOnPage.replace('{current}', (currentPage + 1).toString()).replace('{total}', totalPages.toString()));
      } else if (error.message?.includes('message to edit not found')) {
        try {
          await ctx.reply(pageContent, options);
          await ctx.answerCbQuery(Strings.wiki.sentAsNewMessage);
        } catch (replyError) {
          console.error('Failed to send new wiki message:', replyError);
          await ctx.answerCbQuery(Strings.wiki.updateFailed);
        }
      } else {
        try {
          await ctx.answerCbQuery(Strings.wiki.updateFailed);
        } catch (cbError) {
          console.error('Failed to answer callback query:', cbError);
        }
      }
    }
  });
};