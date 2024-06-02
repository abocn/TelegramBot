# Lynx (Node.js Telegram Bot)
Lynx is a a simple Telegram bot made in Node.js.
 - You can find Lynx at [@LynxBR_bot](https://t.me/LynxBR_bot) on Telegram.

## Requirements
 - A Telegram bot (create one at [@BotFather](https://t.me/botfather))
 - Node.js 20 LTS (or above)
 - node-telegram-bot-api (install with ``npm install node-telegram-bot-api``)

## Notes
- The source code itself of the bot is at ``src/main.js``, and the commands are in ``src/commands``.
  - You can edit this file and the ``package.json`` file as your needs.
- The name of the command file will always be the command itself.
  - Example: ``whois.js`` will always be ``/whois`` on Telegram.
- Also, to see your changes, please restart the bot before making a issue.

## Develop or contribute with Lynx
First, [make a fork of this repo](https://github.com/lucmsilva651/lynx/fork), or clone it with
```
git clone https://github.com/lucmsilva651/lynx
```
Next, go to the repository directory, create a ``config.env`` file and put the content below:
```
# insert your bot token here
# get it with @BotFather on Telegram
TGBOT_TOKEN=0000000000:AAAaaAAaaaaAaAaaAAAaaaAaaaaAAAAAaaa
``` 
Put your bot token that you created at [@BotFather](https://t.me/botfather) at the variable ``TGBOT_TOKEN`` (as the example above) and save the file.

At last, run the bot with ``npm start``.

## About/License
MIT - 2024 Lucas Gabriel (lucmsilva).
