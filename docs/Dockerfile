FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

EXPOSE 3000

CMD ["bun", "start"]