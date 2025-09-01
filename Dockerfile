FROM oven/bun AS base
WORKDIR /usr/src/app

FROM base AS deps
COPY package*.json ./
RUN bun install

COPY webui/package*.json ./webui/
WORKDIR /usr/src/app/webui
RUN bun install

FROM base AS test
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/webui/node_modules ./webui/node_modules
COPY . .

RUN echo "Running bot tests..." && \
    if [ -d "telegram/commands/__tests__" ]; then \
        bun test telegram/commands/__tests__/*.test.ts || exit 1; \
    else \
        echo "No bot tests found, skipping..."; \
    fi

WORKDIR /usr/src/app/webui
RUN echo "Running WebUI tests..." && \
    if [ -d "lib/__tests__" ]; then \
        bun test lib/__tests__/*.test.ts || exit 1; \
    else \
        echo "No WebUI tests found, skipping..."; \
    fi

FROM base AS build
WORKDIR /usr/src/app
COPY --from=test /usr/src/app/node_modules ./node_modules
COPY --from=test /usr/src/app/webui/node_modules ./webui/node_modules
COPY --from=test /usr/src/app/ ./

RUN git rev-parse --short HEAD > .git-commit || echo "unknown" > .git-commit

RUN cp database/schema.ts webui/lib/schema.ts

WORKDIR /usr/src/app/webui
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM base AS runtime

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    supervisor \
    python3 \
    python3-pip \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/webui/node_modules ./webui/node_modules

COPY --from=build /usr/src/app/.git-commit ./.git-commit
COPY --from=build /usr/src/app/webui/.next ./webui/.next
COPY --from=build /usr/src/app/webui/public ./webui/public

COPY . .

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

VOLUME /usr/src/app/.env

EXPOSE 3000

ENV PYTHONUNBUFFERED=1
ENV BUN_LOG_LEVEL=info
ENV DOCKER_ENV=true

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]