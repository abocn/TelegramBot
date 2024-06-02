module.exports = function(bot, msg) {
	const chatId = msg.chat.id;

	const message = `*Privacy Policy for Lynx Telegram Bot (@LynxBR_bot)*\n` + 
	`Before using, you will need to read the privacy policy ` +
	`to understand where your data goes when using this bot. ` +
	`If you don't agree with any of these terms, stop using ` +
	`the bot.\n\n` +
	`*1. Data Collection and Use*\n` +
	`All text messages sent to the Lynx bot, along with ` +
	`their respective identifiers (username and ID), are ` +
	`collected in a secure environment for the developers. ` +
	`This data is used solely for the purpose of improving ` +
	`and debugging the bot and is retained for a period `+
	`of 60 days before being completely deleted. ` +
	`Also, any messages sended on groups or channels that the ` +
	`bot is present are not collected by privacy reasons.\n\n` +
	`*2. Data Sharing*\n` +
	`Message data, including text and identifiers, is not ` +
	`shared with any companies or third-party entities.\n\n` +
	`*3. Legal Compliance*\n` +
	`In the event of legal action, data will be provided ` +
	`in accordance with applicable laws and regulations.\n\n` +
	`*4. User-Generated Content*\n` +
	`We (the creators, developers, and hosts of the bot) ` +
	`are not responsible for any content generated by users, ` +
	`whether it is triggered by our bot or another.\n\n` +
	`*5. Blocklist System*\n` +
	`We have implemented a blocklist system via user ID. If ` +
	`a user generates inappropriate content or misuses the bot, ` +
	`they will be permanently blocked. If the use of alternative ` +
	`or secondary accounts by a blocked user is detected, those ` +
	`accounts will also be blocked.\n\n` +
	`*6. Source Code*\n` +
	`If you wish to review the source code, please visit:` +
	`[https://github.com/lucmsilva651/lynx](https://github.com/lucmsilva651/lynx/).\n\n` +
	`*7. Terms Modification*\n` +
	`These terms may be changed or invalidated at any time, with or without prior notice.\n\n` +
	`*8. Immediate Cancellation of Terms*\n` +
	`In case of usage block, as mentioned above, the terms will be immediately cancelled for the user.`;

	bot.sendMessage(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true })
		.catch(error => console.error('WARN: Message cannot be sent: ', error));
};
