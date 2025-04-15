# Kowalski (Node.js Telegram Bot)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
![GitHub License](https://img.shields.io/github/license/ABOCN/TelegramBot)

Kowalski is a a simple Telegram bot made in Node.js.

- You can find Kowalski at [@KowalskiNodeBot](https://t.me/KowalskiNodeBot) on Telegram.

## Self-host requirements

- Node.js 20 or newer (you can also use [Bun](https://bun.sh))
- A Telegram bot (create one at [@BotFather](https://t.me/botfather))
- FFmpeg (only for the `/yt` command)
- Docker and Docker Compose (only required for Docker setup)

## Run it yourself, develop or contribute with Kowalski

First, clone the repo with Git:

```bash
git clone https://github.com/ABOCN/TelegramBot
```

And now, init the submodules with these commands (this is very important):

```bash
cd TelegramBot
git submodule update --init --recursive
```

Next, inside the repository directory, create a `config.env` file with some content, which you can see the [example .env file](config.env.example) to fill info with. To see the meaning of each one, see [the Functions section](#configenv-functions).

After editing the file, save all changes and run the bot with ``npm start``.

> [!TIP]
> To deal with dependencies, just run ``npm install`` or ``npm i`` at any moment to install all of them.

## Running with Docker

> [!IMPORTANT]
> Please complete the above steps to prepare your local copy for building. You do not need to install FFmpeg on your host system.

You can also run Kowalski using Docker, which simplifies the setup process. Make sure you have Docker and Docker Compose installed.

### Using Docker Compose

1. **Make sure to setup your `config.env` file first!**

2. **Run the container**

   ```bash
   docker compose up -d
   ```

> [!NOTE]
> The `-d` flag causes Kowalski to run in the background. If you're just playing around, you may not want to use this flag.

### Using Docker Run

If you prefer to use Docker directly, you can use these instructions instead.

1. **Make sure to setup your `config.env` file first!**

2. **Build the image**

   ```bash
   docker build -t kowalski .
   ```

3. **Run the container**

   ```bash
   docker run -d --name kowalski --restart unless-stopped -v $(pwd)/config.env:/usr/src/app/config.env:ro kowalski
   ```

> [!NOTE]
> The `-d` flag causes Kowalski to run in the background. If you're just playing around, you may not want to use this flag.

## config.env Functions

- **botSource**: Put the link to your bot source code.
- **botToken**: Put your bot token that you created at [@BotFather](https://t.me/botfather).
- **botAdmins**: Put the ID of the people responsible for managing the bot. They can use some administrative + exclusive commands on any group.
- **lastKey**: Last.fm API key, for use on `lastfm.js` functions, like see who is listening to what song and etc.
- **weatherKey**: Weather.com API key, used for the `/weather` command.

## Note

- Take care of your ``config.env`` file, as it is so much important and needs to be secret (like your passwords), as anyone can do whatever they want to the bot with this token!

## Troubleshooting

### YouTube Downloading

**Q:** I get a "Permission denied (EACCES)" error in the console when running the `/yt` command

**A:** Make sure `src/plugins/yt-dlp/yt-dlp` is executable. You can do this on Linux like so:

```bash
chmod +x src/plugins/yt-dlp/yt-dlp
```

## About/License

BSD-3-Clause - 2024 Lucas Gabriel (lucmsilva).
