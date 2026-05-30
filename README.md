# Mics 🎵

Mics is a sleek, minimalist, high-performance desktop music player built with React, Vite, and TailwindCSS. It fetches streams directly from YouTube Music, delivering an ad-free, premium listening experience with an ultra-modern 2026-style interface.

## 🚀 Features

- **Ad-Free Streaming**: Listen to any song from the global YouTube Music library with zero interruptions.
- **Resilient Audio Pipeline**: Uses `yt-dlp` for lightning-fast stream extraction, with a seamless automated fallback to a headless Stealth Puppeteer browser if bot detection kicks in.
- **Ultra-Modern UI**: Features a "2026-style" Bento Grid layout for trending songs, heavy glassmorphism, dynamic gradients, and fluid micro-animations.
- **Smart Queue & Suggestions**: Automatically generates a continuous "Up Next" queue based on the currently playing track.
- **Local Library**: Persists your 'Liked Songs' and 'Recently Played' history locally.
- **Background Playback**: Optimized for uninterrupted background listening.

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS (with custom design system)
- Google Material Symbols

**Backend:**
- Node.js & Express
- `ytmusic-api` for metadata, search, and suggestions
- `youtube-dl-exec` for primary stream URL extraction
- `puppeteer-extra` & `puppeteer-extra-plugin-stealth` for resilient fallback extraction
- CORS-enabled local streaming proxy

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/theallmyti/MicsV2.git
   cd MicsV2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   *(Note: Ensure you have Node.js and a working installation of Python/yt-dlp if running locally)*

3. **Start the development servers**
   
   The project requires both the Node.js backend proxy and the Vite frontend to be running simultaneously.

   **Terminal 1 (Backend Server):**
   ```bash
   node server.js
   ```
   *Runs on http://localhost:3001*

   **Terminal 2 (Frontend UI):**
   ```bash
   npm run dev
   ```
   *Runs on http://localhost:5173*

## 🏗️ Architecture Notes

The application uses a hybrid stream extraction strategy to bypass strict rate-limiting:
1. **Primary**: Uses `yt-dlp` to directly fetch the highest quality `googlevideo` audio stream URL.
2. **Fallback**: If `yt-dlp` is blocked or fails, it boots a semaphore-limited Headless Chromium instance equipped with stealth plugins to intercept network requests and extract the raw MIME audio stream directly from the browser cache, guaranteeing uptime.

## 📄 License
MIT License. Created for educational and personal use.
