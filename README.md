# Kowalski (Node.js Telegram Bot)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![GitHub License](https://img.shields.io/github/license/abocn/TelegramBot)](https://github.com/abocn/TelegramBot/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![CodeQL](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/abocn/TelegramBot/actions/workflows/dependabot/dependabot-updates)

Kowalski is a extendable Telegram bot written in TypeScript.

- You can find Kowalski on Telegram as [@KowalskiNodeBot](https://t.me/KowalskiNodeBot)

## Bot requirements

> [!IMPORTANT]
> You will only need all of them if you are not running Kowalski Dockerized. Read ["Running with Docker"](https://docs.kowalski.social/self-hosting/docker) for more information.

- [Bun](https://bun.sh) (latest is suggested)
- A Telegram bot (create one at [@BotFather](https://t.me/botfather))
- FFmpeg (only for the `/yt` command)
- Docker and Docker Compose (only required for Docker setup)
- Postgres

## AI Requirements

Using AI features is not suggested for all users who plan to host Kowalski. It requires a server or computer capable of being under intense load when users are active. In the future, we plan to support for using LLM APIs to remove this requirement.

### CPU-Only

A CPU with **at least** 8 cores is recommended, otherwise AI commands will be extremely slow, and not worth the stress you are putting on the CPU.

If you plan to use CPU, you will also need a lot of RAM to load the models themselves. 16GB is suggested at a **minimum**, and larger models can require upwards of 64-256GB of RAM. If you have a GPU available, you can use it to speed up the process.

### GPU-Only

GPU support has not been tested. With some extra configuration, you should have no problem using your GPU, as Ollama has amazing support. Using a GPU will speed up the model's responses **significantly**. We are not rich enough to afford them, so if you have tested Kowalski with GPU, please let us know.

Your GPU will require enough VRAM to load the models, which will limit the size of the models you can run. As mentioned above, these models can be quite large.

Please ensure your GPU is compatible with Ollama, as well. Supported GPUs can be found on in the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/gpu.md)

## Contributors

<a href="https://github.com/abocn/TelegramBot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abocn/TelegramBot" alt="Profile pictures of Kowalski contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## About/License

BSD-3-Clause - 2024 Lucas Gabriel (lucmsilva).

With some components under the [Unlicense](https://unlicense.org).
