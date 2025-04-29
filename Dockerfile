FROM oven/bun

# Install ffmpeg and other deps
RUN apt-get update && apt-get install -y ffmpeg git && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN bun i

COPY . .

RUN chmod +x /usr/src/app/src/plugins/yt-dlp/yt-dlp

VOLUME /usr/src/app/.env

CMD ["bun", "start"]
