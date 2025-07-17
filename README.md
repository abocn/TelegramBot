# Kowalski (Node.js Telegram Bot)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![GitHub License](https://img.shields.io/github/license/abocn/TelegramBot)](https://github.com/abocn/TelegramBot/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![CodeQL](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates)

Kowalski is a extendable Telegram bot written in TypeScript.

- You can find Kowalski on Telegram as [@KowalskiNodeBot](https://t.me/KowalskiNodeBot)

## Self-host requirements

> [!IMPORTANT]
> You will only need all of them if you are not running it dockerized. Read ["Running with Docker"](#running-with-docker) for more information.

- [Bun](https://bun.sh) (latest is suggested)
- A Telegram bot (create one at [@BotFather](https://t.me/botfather))
- FFmpeg (only for the `/yt` command)
- Docker and Docker Compose (only required for Docker setup)
- Postgres

### AI Requirements

Using AI features is not suggested for all users who plan to host Kowalski. It requires a server or computer capable of being under intense load when users are active. In the future, we plan to support for using LLM APIs to remove this requirement.

#### CPU-Only

A CPU with **at least** 8 cores is recommended, otherwise AI commands will be extremely slow, and not worth the stress you are putting on the CPU.

If you plan to use CPU, you will also need a lot of RAM to load the models themselves. 16GB is suggested at a **minimum**, and larger models can require upwards of 64-256GB of RAM. If you have a GPU available, you can use it to speed up the process.

#### GPU-Only

GPU support has not been tested. With some extra configuration, you should have no problem using your GPU, as Ollama has amazing support. Using a GPU will speed up the model's responses **significantly**. We are not rich enough to afford them, so if you have tested Kowalski with GPU, please let us know.

Your GPU will require enough VRAM to load the models, which will limit the size of the models you can run. As mentioned above, these models can be quite large.

Please ensure your GPU is compatible with Ollama, as well. Supported GPUs can be found on in the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/gpu.md)

## Run with Docker Compose

Running Kowalski with Docker simplifies the setup, deployment, and management process significantly. Make sure you have Docker and Docker Compose installed, then continue to the next steps.

1. **Clone the repo**

   ```bash
   git clone --recurse-submodules https://github.com/ABOCN/TelegramBot
   ```

1. **Copy a Docker Compose file**

   _Without AI Features (Ollama)_

   ```bash
   mv examples/docker-compose.yml docker-compose.yml
   ```

   _With AI Features (Ollama)_

   ```bash
   mv examples/docker-compose.ai.yml docker-compose.yml
   ```

1. **Setup your `.env`**

   In order to successfuly deploy Kowalski, you will need to have a valid `.env`. An example is provided in `.env.example`. You will need to edit both your `.env` file and enter matching values in `webui/.env`. Don't worry... it's mostly copy-paste!

   You can learn more about the different options in the [.env section](#env-functions).

> [!TIP]
> If you intend to setup AI, the defaults for Docker are already included (just uncomment) and don't need to be changed.
>
> Further setup may be needed for GPUs. See the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/gpu.md) for more.

4. **Run the container**

   You're all done! You can run the container with:

   ```bash
   docker compose up -d
   ```

> [!NOTE]
> Using the `-d` flag when running causes Kowalski to run in the background. If you're just playing around or testing, you may not want to use this flag.

   The web interface will be avaliable at [http://localhost:3000]. We suggest putting it a reverse proxy if you plan to use Kowalski for production use.

## Running locally (non-Docker/development setup)

1. **Clone the repo**

   ```bash
   git clone --recurse-submodules https://github.com/ABOCN/TelegramBot
   ```

1. **Install dependencies**

   ```bash
   bun install # installs deps for bot
   cd webui
   bun install # installs deps for webui
   ```

1. **Deploy neccessary components**

   - **Postgres**
     You will need a Postgres server for storing users
   - **FFmpeg**
     Make sure FFmpeg is installed for video download commands
   - **Ollama** (optional)
     If you want to use AI features, you will need to install [Ollama](https://ollama.com/).

1. **Setup your `.env`**

   In order to successfuly deploy Kowalski, you will need to have a valid `.env`. An example is provided in `.env.example`. You will need to edit both your `.env` file and enter matching values in `webui/.env`. Don't worry... it's mostly copy-paste!

   You can learn more about the different options in the [.env section](#env-functions).

> [!TIP]
> Further setup may be needed for GPUs. See the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/gpu.md) for more.

5. **Run the bot and WebUI**

   ```bash
   chmod +x start-services.sh # makes the script executable
   ./start-services.sh # starts the bot and webui
   ```

> [!NOTE]
> If you want to run the bot and webui separately, you can do so with:
>
> ```bash
> # In terminal 1
> bun start
>
> # In terminal 2
> cd webui
> bun dev
> ```

### Efficant Local (w/ Docker) Development

If you want to develop a component of Kowalski, without dealing with the headache of several terminals, we suggest you follow these guidelines:

1. If you are working on one component, run it with Bun, and Dockerize the other components.
1. Minimize the amount of non-Dockerized components to reduce headaches.
1. You will have to change your `.env` a lot. This is a common source of issues. Make sure the hostname and port are correct.

## .env Functions

> [!IMPORTANT]
> Take care of your ``.env`` file, as it is so much important and needs to be secret (like your passwords), as anyone can do whatever they want to the bot with this token!

### Bot

- **botSource**: Put the link to your bot source code.
- **botPrivacy**: Put the link to your bot privacy policy.
- **maxRetries**: Maximum number of retries for a failing command on Kowalski. Default is 5. If the limit is hit, the bot will crash past this number.
- **botToken**: Put your bot token that you created at [@BotFather](https://t.me/botfather).
- **ollamaEnabled** (optional): Enables/disables AI features
- **ollamaApi** (optional): Ollama API endpoint for various AI features, will be disabled if not set
- **handlerTimeout** (optional): How long handlers will wait before timing out. Set this high if using large AI models.
- **flashModel** (optional): Which model will be used for /ask
- **thinkingModel** (optional): Which model will be used for /think
- **updateEveryChars** (optional): The amount of chars until message update triggers (for streaming response)
- **databaseUrl**: Database server configuration (see `.env.example`)
- **valkeyBaseUrl**: The hostname of your Valkey instance.
- **valkeyPort**: The port of your Valkey instance.
- **botAdmins**: Put the ID of the people responsible for managing the bot. They can use some administrative + exclusive commands on any group.
- **lastKey**: Last.fm API key, for use on `lastfm.js` functions, like see who is listening to what song and etc.
- **weatherKey**: Weather.com API key, used for the `/weather` command.
- **longerLogs**: Set to `true` to enable verbose logging whenever possible.

> [!NOTE]
> Further, advanced fine-tuning and configuration can be done in TypeScript with the files in the `/config` folder.

### WebUI

- **botApiUrl**: Likely will stay the same, but changes the API that the bot exposes
- **databaseUrl**: Database server configuration (see `.env.example`). Should match `.env`
- **valkeyBaseUrl**: The hostname of your Valkey instance. Should match `.env`
- **valkeyPort**: The port of your Valkey instance. Should match `.env`
- **ratelimitSalt**: The salt used for hashing IP addresses in Valkey. **This should be changed in production.**
- **longerLogs**: Set to `true` to enable verbose logging whenever possible.

## Troubleshooting

### YouTube Downloading

**Q:** I get a "Permission denied (EACCES)" error in the console when running the `/yt` command

**A:** Make sure `telegram/plugins/yt-dlp/yt-dlp` is executable. You can do this on Linux like so:

```bash
chmod +x telegram/plugins/yt-dlp/yt-dlp
```

### AI

**Q:** How can I disable AI features?

**A:** AI features are disabled by default, unless you have set `ollamaEnabled` to `true` in your `.env` file. Set it back to `false` to disable.

## Contributors

<a href="https://github.com/abocn/TelegramBot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abocn/TelegramBot" alt="Profile pictures of Kowalski contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## About/License

BSD-3-Clause - 2024 Lucas Gabriel (lucmsilva).

With some components under the [Unlicense](https://unlicense.org).
