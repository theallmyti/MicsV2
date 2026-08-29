# Multi-stage Dockerfile for Mics V2 (Optimized for Render, Railway, & Cloud)

# ==============================================================================
# Stage 1: Build Frontend (Vite + React)
# ==============================================================================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install full dependencies (including devDependencies required for Vite build)
RUN npm ci || npm install

# Copy application source and build production bundle
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Runtime (Node.js + Chromium + yt-dlp + FFmpeg)
# ==============================================================================
FROM node:20-bookworm-slim AS runner

# Install system dependencies: Chromium (for headless fallback), FFmpeg, Python3, and yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    python3 \
    python3-pip \
    ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Configure environment variables for Chromium and container runtime
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3001

WORKDIR /app

# Copy dependency manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy server code and configuration
COPY server/ ./server/
COPY tsconfig.json ./

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Create local cache directory for audio buffering
RUN mkdir -p /app/cache

# Expose default and cloud ports
EXPOSE 3001 10000

# Start Express server via tsx
CMD ["npx", "tsx", "server/index.ts"]
