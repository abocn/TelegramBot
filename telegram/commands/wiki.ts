/*
import axios from "axios";
import { Context, Telegraf } from "telegraf";
import { replyToMessageId } from "../utils/reply-to-message-id";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function mediaWikiToMarkdown(input: string) {
  input = input.replace(/===(.*?)===/g, '*$1*');
  input = input.replace(/==(.*?)==/g, '*$1*');
  input = input.replace(/=(.*?)=/g, '*$1*');
  input = input.replace(/'''(.*?)'''/g, '**$1**');
  input = input.replace(/''(.*?)''/g, '_$1_');
  input = input.replace(/^\*\s/gm, '- ');
  input = input.replace(/^\#\s/gm, '1. ');
  input = input.replace(/{{Quote(.*?)}}/g, "```\n$1```\n");
  input = input.replace(/\[\[(.*?)\|?(.*?)\]\]/g, (_, link, text) => {
    const sanitizedLink = link.replace(/ /g, '_');
    return text ? `[${text}](${sanitizedLink})` : `[${sanitizedLink}](${sanitizedLink})`;
  });
  input = input.replace(/\[\[File:(.*?)\|.*?\]\]/g, '![$1](https://en.wikipedia.org/wiki/File:$1)');

  return input;
}

export default (bot: Telegraf<Context>) => {
  bot.command("wiki", async (ctx) => {
    const userInput = capitalizeFirstLetter(ctx.message.text.split(' ')[1]);
    const apiUrl = `https://en.wikipedia.org/w/index.php?title=${userInput}&action=raw`;
    const response = await axios(apiUrl, { headers: { 'Accept': "text/plain" } });
    const convertedResponse = response.data.replace(/<\/?div>/g, "").replace(/{{Infobox.*?}}/s, "");

    const result = mediaWikiToMarkdown(convertedResponse).slice(0, 2048);
    const reply_to_message_id = replyToMessageId(ctx);

    ctx.reply(result, { parse_mode: 'Markdown', ...({ reply_to_message_id, disable_web_page_preview: true }) });
  });
};
*/