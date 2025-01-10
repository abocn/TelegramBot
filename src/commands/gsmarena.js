// Ported and improved from Hitalo's PyKorone bot
// Copyright (c) 2024 Hitalo M. (https://github.com/HitaloM)
// Original code license: BSD-3-Clause
// With some help from GPT (I don't really like AI but whatever)
// If this were a kang, I would not be giving credits to him!

const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);

const axios = require('axios');
const { parse } = require('node-html-parser');

class PhoneSearchResult {
  constructor(name, url) {
    this.name = name;
    this.url = url;
    Object.freeze(this);
  }
}

const HEADERS = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
};

function getDataFromSpecs(specsData, category, attributes) {
  const details = specsData?.specs?.[category] || {};

  return attributes
    .map(attr => details[attr] || null)
    .filter(Boolean)
    .join("\n");
}

function parseSpecs(specsData) {
  const categories = {
    "status": ["Launch", ["Status"]],
    "network": ["Network", ["Technology"]],
    "system": ["Platform", ["OS"]],
    "models": ["Misc", ["Models"]],
    "weight": ["Body", ["Weight"]],
    "jack": ["Sound", ["3.5mm jack"]],
    "usb": ["Comms", ["USB"]],
    "sensors": ["Features", ["Sensors"]],
    "battery": ["Battery", ["Type"]],
    "charging": ["Battery", ["Charging"]],
    "display_type": ["Display", ["Type"]],
    "display_size": ["Display", ["Size"]],
    "display_resolution": ["Display", ["Resolution"]],
    "platform_chipset": ["Platform", ["Chipset"]],
    "platform_cpu": ["Platform", ["CPU"]],
    "platform_gpu": ["Platform", ["GPU"]],
    "memory": ["Memory", ["Internal"]],
    "main_camera_single": ["Main Camera", ["Single"]],
    "main_camera_dual": ["Main Camera", ["Dual"]],
    "main_camera_triple": ["Main Camera", ["Triple"]],
    "main_camera_quad": ["Main Camera", ["Quad"]],
    "main_camera_features": ["Main Camera", ["Features"]],
    "main_camera_video": ["Main Camera", ["Video"]],
    "selfie_camera_single": ["Selfie Camera", ["Single"]],
    "selfie_camera_dual": ["Selfie Camera", ["Dual"]],
    "selfie_camera_triple": ["Selfie Camera", ["Triple"]],
    "selfie_camera_quad": ["Selfie Camera", ["Quad"]],
    "selfie_camera_features": ["Selfie Camera", ["Features"]],
    "selfie_camera_video": ["Selfie Camera", ["Video"]]
  };

  const parsedData = Object.keys(categories).reduce((acc, key) => {
    const [cat, attrs] = categories[key];
    acc[key] = getDataFromSpecs(specsData, cat, attrs) || "";
    return acc;
  }, {});

  parsedData["name"] = specsData.name || "";
  parsedData["url"] = specsData.url || "";

  return parsedData;
}

function formatPhone(phone) {
  const formattedPhone = parseSpecs(phone);
  const attributesDict = {
    "Status": "status",
    "Network": "network",
    "OS": "system",
    "Models": "models",
    "Weight": "weight",
    "3.5mm jack": "jack",
    "USB": "usb",
    "Sensors": "sensors",
    "Battery": "battery",
    "Charging": "charging",
    "Display Type": "display_type",
    "Display Size": "display_size",
    "Display Resolution": "display_resolution",
    "Chipset": "platform_chipset",
    "CPU": "platform_cpu",
    "GPU": "platform_gpu",
    "Memory": "memory",
    "Rear Camera (Single)": "main_camera_single",
    "Rear Camera (Dual)": "main_camera_dual",
    "Rear Camera (Triple)": "main_camera_triple",
    "Rear Camera (Quad)": "main_camera_quad",
    "Rear Camera (Features)": "main_camera_features",
    "Rear Camera (Video)": "main_camera_video",
    "Front Camera (Single)": "selfie_camera_single",
    "Front Camera (Dual)": "selfie_camera_dual",
    "Front Camera (Triple)": "selfie_camera_triple",
    "Front Camera (Quad)": "selfie_camera_quad",
    "Front Camera (Features)": "selfie_camera_features",
    "Front Camera (Video)": "selfie_camera_video"
  };

  const attributes = Object.entries(attributesDict)
    .filter(([_, key]) => formattedPhone[key])
    .map(([label, key]) => `<b>${label}:</b> <code>${formattedPhone[key]}</code>`)
    .join("\n\n");

  const deviceUrl = `<b>GSMArena page:</b> ${formattedPhone.url}`;
  const deviceImage = phone.picture ? `<b>Device Image</b>: ${phone.picture}` : '';

  return `<b>\n\nName: </b><code>${formattedPhone.name}</code>\n\n${attributes}\n\n${deviceImage}\n\n${deviceUrl}`;
}

async function fetchHtml(url) {
  try {
    const response = await axios.get(url, { headers: HEADERS });
    return response.data;
  } catch (error) {
    console.error("Error fetching HTML:", error);
    throw error;
  }
}

async function searchPhone(phone) {
  try {
    const searchUrl = `https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(phone)}`;
    const htmlContent = await fetchHtml(searchUrl);
    const root = parse(htmlContent);
    const foundPhones = root.querySelectorAll('.general-menu.material-card ul li');

    return foundPhones.map((phoneTag) => {
      const name = phoneTag.querySelector('img')?.getAttribute('title') || "";
      const url = phoneTag.querySelector('a')?.getAttribute('href') || "";
      return new PhoneSearchResult(name, url);
    });
  } catch (error) {
    console.error("Error searching for phone:", error);
    return [];
  }
}

async function checkPhoneDetails(url) {
  try {
    const htmlContent = await fetchHtml(`https://www.gsmarena.com/${url}`);
    const root = parse(htmlContent);
    const specsTables = root.querySelectorAll('table[cellspacing="0"]');
    const specsData = extractSpecs(specsTables);
    const metaScripts = root.querySelectorAll('script[language="javascript"]');
    const meta = metaScripts.length ? metaScripts[0].text.split("\n") : [];
    const name = extractMetaData(meta, "ITEM_NAME");
    const picture = extractMetaData(meta, "ITEM_IMAGE");

    return { ...specsData, name, picture, url: `https://www.gsmarena.com/${url}` };
  } catch (error) {
    console.error("Error fetching phone details:", error);
    return {};
  }
}

function extractSpecs(specsTables) {
  return {
    specs: specsTables.reduce((acc, table) => {
      const feature = table.querySelector('th')?.text.trim() || "";
      table.querySelectorAll('tr').forEach((tr) => {
        const header = tr.querySelector('.ttl')?.text.trim() || "info";
        let detail = tr.querySelector('.nfo')?.text.trim() || "";
        detail = detail.replace(/\s*\n\s*/g, " / ").trim();
        if (!acc[feature]) {
          acc[feature] = {};
        }
        acc[feature][header] = acc[feature][header]
          ? `${acc[feature][header]} / ${detail}`
          : detail;
      });
      return acc;
    }, {})
  };
}

function extractMetaData(meta, key) {
  const line = meta.find((line) => line.includes(key));
  return line ? line.split('"')[1] : "";
}

module.exports = (bot) => {
  bot.command(['d', 'device'], spamwatchMiddleware, async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;

    const phone = ctx.message.text.split(" ").slice(1).join(" ");
    if (!phone) {
      return ctx.reply("Please provide the phone name.", { reply_to_message_id: ctx.message.message_id });
    }

    const results = await searchPhone(phone);
    if (results.length === 0) {
      return ctx.reply("No phones found.", { reply_to_message_id: ctx.message.message_id });
    }

    const testUser = `<a href="tg://user?id=${userId}">${userName}</a>, please select your device:`;
    const options = {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: results.map(result => [{ text: result.name, callback_data: `details:${result.url}:${ctx.from.id}` }])
      }
    };
    ctx.reply(testUser, options);

  });

  bot.action(/details:(.+):(.+)/, async (ctx) => {
    const url = ctx.match[1];
    const userId = parseInt(ctx.match[2]);
    const userName = ctx.from.first_name;

    const callbackQueryUserId = ctx.update.callback_query.from.id;

    if (userId !== callbackQueryUserId) {
      return ctx.answerCbQuery(`${userName}, you are not allowed to interact with this.`);
    }

    ctx.answerCbQuery();

    const phoneDetails = await checkPhoneDetails(url);

    if (phoneDetails.name) {
      const message = formatPhone(phoneDetails);
      ctx.editMessageText(`<b><a href="tg://user?id=${userId}">${userName}</a>, these are the details of your device:</b>` + message, { parse_mode: 'HTML', disable_web_page_preview: false });
    } else {
      ctx.reply("Error fetching phone details.", { reply_to_message_id: ctx.message.message_id });
    }
  });
};
