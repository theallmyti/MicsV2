FROM node:20-bookworm-slim

# Install Chromium (for Puppeteer), Python3 (for youtube-dl), and FFmpeg
RUN apt-get update && apt-get install -y \
    chromium \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium we just installed
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set up working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 3001

# Run the server
CMD ["npx", "tsx", "server/index.ts"]
