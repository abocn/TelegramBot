const { isOnSpamWatch } = require('../plugins/lib-spamwatch/spamwatch.js');
const spamwatchMiddleware = require('../plugins/lib-spamwatch/Middleware.js')(isOnSpamWatch);
const axios = require('axios');

async function searchCodename() {
    try {
        const url = 'https://raw.githubusercontent.com/Hycon-Devices/official_devices/refs/heads/master/devices.json'
        const response = await axios.get(url);
        return response.data
    } catch(error){
        console.error("Error fetching:", error);
        return error;
    }
}

module.exports = (bot) => {
    bot.command(['codename'], spamwatchMiddleware, async (ctx) => {
        const typedCodename = ctx.message.text.split(" ").slice(1).join(" ");
        
        if (!typedCodename) {
            return ctx.reply("Please provide a codename.", { reply_to_message_id: ctx.message.message_id });
        }
        
        const requestedPhones = await searchCodename(typedCodename);
        const foundPhone = requestedPhones.find((element) => element.codename === typedCodename)

        if(!foundPhone){
            return ctx.reply("No phones were found, please try another codename!")
        }

        const {brand, codename, name} = foundPhone;
        const message = `<b>Brand:</b> <code>${brand}</code>\n<b>Codename:</b> <code>${codename}</code>\n<b>Name:</b> <code>${name}</code>`

        return ctx.reply(message, { reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML' });
    })
}