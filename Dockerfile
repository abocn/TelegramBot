FROM oven/bun

# Install ffmpeg and other deps
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN bun install

COPY webui/package*.json ./webui/
WORKDIR /usr/src/app/webui
RUN bun install

WORKDIR /usr/src/app
COPY . .

WORKDIR /usr/src/app/webui
RUN bun run build

RUN chmod +x /usr/src/app/telegram/plugins/yt-dlp/yt-dlp

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

VOLUME /usr/src/app/.env

EXPOSE 3000

ENV PYTHONUNBUFFERED=1
ENV BUN_LOG_LEVEL=info

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
