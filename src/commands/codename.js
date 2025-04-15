const Resources = require('../props/resources.json');
const { getStrings } = require('../plugins/checklang.js');
const { isOnSpamWatch } = require('../spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');
const { verifyInput } = require('../plugins/verifyInput.js');

async function getDeviceList() {
  try {
    const response = await axios.get(Resources.codenameApi);
    return response.data
  } catch (error) {
    const message = Strings.codenameCheck.apiErr
      .replace('{error}', error.message);

    return ctx.reply(message, {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message.message_id
    });
  }
}

module.exports = (bot) => {
  bot.command(['codename', 'whatis'], spamwatchMiddleware, async (ctx) => {
    const userInput = ctx.message.text.split(" ").slice(1).join(" ");
    const Strings = getStrings(ctx.from.language_code);
    const { noCodename } = Strings.codenameCheck
  
    if(verifyInput(ctx, userInput, noCodename)){
      return;
    }

    const jsonRes = await getDeviceList()
    const phoneSearch = Object.keys(jsonRes).find((codename) => codename === userInput);

    if (!phoneSearch) {
      return ctx.reply(Strings.codenameCheck.notFound, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.message.message_id
      });
    }
    
    const deviceDetails = jsonRes[phoneSearch];
    const device = deviceDetails.find((item) => item.brand) || deviceDetails[0];
    const message = Strings.codenameCheck.resultMsg
      .replace('{brand}', device.brand)
      .replace('{codename}', userInput)
      .replace('{model}', device.model)
      .replace('{name}', device.name);

    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
  })
}