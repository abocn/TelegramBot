# Kowalski (Node.js Telegram Bot)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![GitHub License](https://img.shields.io/github/license/abocn/TelegramBot)](https://github.com/abocn/TelegramBot/blob/main/LICENSE)
[![CodeQL](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates)

Kowalski is a a simple Telegram bot made in Node.js.

- You can find Kowalski at [@KowalskiNodeBot](https://t.me/KowalskiNodeBot) on Telegram.

## Self-host requirements

> [!IMPORTANT]
> You will only need all of them if you are not running it dockerized. Read ["Running with Docker"](#running-with-docker) for more information.

- [Bun](https://bun.sh) (latest is suggested)
- A Telegram bot (create one at [@BotFather](https://t.me/botfather))
- FFmpeg (only for the `/yt` command)
- Docker and Docker Compose (only required for Docker setup)

## Running locally (non-Docker setup)

First, clone the repo with Git:

```bash
git clone --recurse-submodules https://github.com/ABOCN/TelegramBot
```

Next, inside the repository directory, create an `.env` file with some content, which you can see the [example .env file](.env.example) to fill info with. To see the meaning of each one, see [the Functions section](#env-functions).

After editing the file, save all changes and run the bot with ``bun start``.

> [!TIP]
> To deal with dependencies, just run ``bun install`` or ``bun i`` at any moment to install all of them.

## Running with Docker

> [!IMPORTANT]
> Please complete the above steps to prepare your local copy for building. You do not need to install FFmpeg on your host system.

---

> [!NOTE]
> Using the `-d` flag when running causes Kowalski to run in the background. If you're just playing around or testing, you may not want to use this flag.

You can also run Kowalski using Docker, which simplifies the setup process. Make sure you have Docker and Docker Compose installed.

### Using Docker Compose

1. **Make sure to setup your `.env` file first!**

2. **Run the container**

   ```bash
   docker compose up -d
   ```

### Using Docker Run

If you prefer to use Docker directly, you can use these instructions instead.

1. **Make sure to setup your `.env` file first!**

2. **Build the image**

   ```bash
   docker build -t kowalski .
   ```

3. **Run the container**

   ```bash
   docker run -d --name kowalski --restart unless-stopped -v $(pwd)/.env:/usr/src/app/.env:ro kowalski
   ```

## .env Functions

> [!IMPORTANT]
> Take care of your ``.env`` file, as it is so much important and needs to be secret (like your passwords), as anyone can do whatever they want to the bot with this token!

- **botSource**: Put the link to your bot source code.
- **botPrivacy**: Put the link to your bot privacy policy.
- **maxRetries**: Maximum number of retries for a failing command on Kowalski. Default is 5. If the limit is hit, the bot will crash past this number.
- **botToken**: Put your bot token that you created at [@BotFather](https://t.me/botfather).
- **botAdmins**: Put the ID of the people responsible for managing the bot. They can use some administrative + exclusive commands on any group.
- **lastKey**: Last.fm API key, for use on `lastfm.js` functions, like see who is listening to what song and etc.
- **weatherKey**: Weather.com API key, used for the `/weather` command.

## Troubleshooting

### YouTube Downloading

**Q:** I get a "Permission denied (EACCES)" error in the console when running the `/yt` command

**A:** Make sure `src/plugins/yt-dlp/yt-dlp` is executable. You can do this on Linux like so:

```bash
chmod +x src/plugins/yt-dlp/yt-dlp
```

## Contributors

<a href="https://github.com/abocn/TelegramBot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abocn/TelegramBot" alt="Profile pictures of Kowalski contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## About/License

BSD-3-Clause - 2024 Lucas Gabriel (lucmsilva).
