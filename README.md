# Mics V2 🎵

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Mics V2** is a minimalist, high-performance web music streaming application. Powered by YouTube Music metadata, real-time audio analysis, dynamic ambient background illumination, local-first client storage, and a resilient two-tier audio streaming pipeline.

---

## ✨ Features

- **Ad-Free Music Streaming**: Stream tracks from YouTube Music with low-latency direct audio proxying and range requests (`206 Partial Content`).
- **Dynamic Ambient Player UI**: Real-time canvas color extraction dynamically derives vibrant atmospheric gradients and blurs from album artwork.
- **Two-Tier Audio Streaming Pipeline**:
  - **Primary: Remote Stream API (`STREAM_API_URL`)**: Route extraction requests to an external API (Piped, Invidious, Cobalt, RapidAPI, or a custom microservice) so your local/server IP is completely shielded from YouTube 429 rate-limit blocks.
  - **Backup: `yt-dlp`**: Local fallback extractor using optimized mobile client headers (`youtube:player_client=android,ios,web`), auto-detected `cookies.txt`, and proxy support (`YTDLP_PROXY`).
  - **Local Disk Cache**: Automatically caches played tracks to `./cache/${id}.audio` for instant replay with zero network overhead.
- **Playlist Importers**: Effortlessly import playlists from **YouTube Music** and **Spotify** by simply pasting the URL.
- **100% Local-First Persistence**: Instant loading with zero database latency; playlists, favorites, and listening history persist safely in browser `localStorage`.
- **Smart Recommendations & Discovery**:
  - Context-aware "Up Next" queues generated on the fly.
  - Global & national trending charts merged from iTunes RSS and YouTube Music.
  - Local listening history tracking and adaptive recommendations.
- **PWA Ready**: Offline caching, service workers, and installable as a native desktop/mobile web app.

---

## 🛠️ Architecture & Tech Stack

```
MicsV2/
├── server/                # Express TypeScript Backend (Port 3001)
│   ├── index.ts           # Streaming proxy, search, trending, and audio pipeline
│   ├── routes/            # Modular route controllers (e.g., /api/import)
│   └── importers/         # YouTube & Spotify playlist parsers and importers
├── src/                   # React 19 + TypeScript Frontend (Port 5173)
│   ├── components/        # Modals, playlist managers, home sections
│   ├── motion/            # Framer Motion design tokens, hooks, & animations
│   ├── store/             # Local and reactive library stores
│   ├── history/           # Listening history & playback tracking
│   ├── App.jsx            # Main music player interface
│   └── index.css          # Design system, glassmorphism, & ambient effects
├── cache/                 # Local audio disk cache directory (*.audio)
├── .env.example           # Audio pipeline configuration template
├── run-all.js             # Concurrent process runner (Backend + Vite)
├── run.bat                # 1-Click Windows desktop launcher
└── Dockerfile             # Lightweight backend container
```

---

## ⚙️ Audio Pipeline Configuration

Copy `.env.example` to `.env` to configure your audio stream extractors:

```bash
cp .env.example .env
```

### 1. Primary: Remote Stream API (Recommended to avoid IP bans)
Set `STREAM_API_URL` to route requests through a remote service:
```env
# Single endpoint or comma-separated list of fallbacks
STREAM_API_URL=https://pipedapi.kavin.rocks/streams/:id
# Optional authentication
# STREAM_API_KEY=your_key
# STREAM_API_HEADER=x-api-key
```

### 2. Backup: `yt-dlp` Local Fallback
When `STREAM_API_URL` is omitted or unavailable, the backend automatically uses `yt-dlp`. To prevent YouTube bot detection on the backup:
- **Cookies**: Export cookies from your browser and place `cookies.txt` in the root folder, or set `YTDLP_COOKIES=./cookies.txt`.
- **Proxy**: Route backup requests through a proxy: `YTDLP_PROXY=http://user:pass@proxy-ip:port`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0+)
- **Python / yt-dlp** (for local backup extraction)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/theallmyti/MicsV2.git
   cd MicsV2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 💻 Running the App

### Option 1: One-Click Launcher (Windows)
Double-click [`run.bat`](./run.bat) in the project root to start Express Backend and Vite Frontend concurrently.

### Option 2: Unified Command (Cross-Platform)
```bash
npm run dev:all
```

### Option 3: Individual Terminals
- **Express Backend (Port 3001):**
  ```bash
  npx tsx server/index.ts
  ```
- **Vite Frontend (Port 5173):**
  ```bash
  npm run dev
  ```

---

## 🌐 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | API Server Health status & browser landing page |
| `/api/search?q=:query` | `GET` | Search YouTube Music tracks and artists |
| `/api/search/suggestions?q=:query` | `GET` | Autocomplete search suggestions |
| `/api/trending` | `GET` | Fetch top trending tracks (global or country-filtered) |
| `/api/home` | `GET` | Discover feed sections (New Releases, Moods, etc.) |
| `/api/stream/:videoId` | `GET` | Audio stream proxy with HTTP 206 range support |
| `/api/precache/:videoId` | `GET` | Background pre-cache next queue track to disk |
| `/api/suggestions/:videoId`| `GET` | Dynamic Up Next queue generation |
| `/api/lyrics/:videoId` | `GET` | Time-synced or static song lyrics |
| `/api/import/playlist` | `POST` | Import Spotify / YouTube Music playlists |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for educational and personal music streaming purposes.
