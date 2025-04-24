FROM node:20-slim

# Install ffmpeg and other deps
RUN apt-get update && apt-get install -y ffmpeg git && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x /usr/src/app/src/plugins/yt-dlp/yt-dlp

VOLUME /usr/src/app/.env

CMD ["npm", "start"]