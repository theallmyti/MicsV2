# Mics V2 🎵

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Auth_%26_DB-FF5A5F?logo=convex&logoColor=white)](https://convex.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Mics V2** is a minimalist, high-performance web music streaming application. Powered by YouTube Music and enhanced with real-time audio analysis, dynamic ambient background illumination, cloud database sync via Convex, and a resilient streaming pipeline.

---

## ✨ Features

- **Ad-Free Music Streaming**: Stream tracks from YouTube Music with low-latency direct audio proxying.
- **Dynamic Ambient Player UI**: Real-time canvas color extraction that dynamically derives vibrant atmospheric gradients and blurs from album artwork.
- **Resilient Audio Pipeline**:
  - Primary extraction with `yt-dlp` using optimized Android/iOS client headers to eliminate bot blocks and `403 Forbidden` errors.
  - Automatic local chunk caching (`206 Partial Content` audio streaming).
  - Headless Puppeteer stealth fallback when deep interception is required.
- **Playlist Importers**: Effortlessly import playlists from **YouTube Music** and **Spotify** by simply pasting the URL.
- **Cloud Sync & Auth with Convex**: Seamless user authentication, cloud library persistence, playlist management, and listening history.
- **Smart Recommendations & Discovery**:
  - Context-aware "Up Next" queues generated on the fly.
  - Global & national trending charts merged from iTunes RSS and YouTube Music.
  - Local listening history tracking and adaptive recommendations.
- **PWA Ready**: Offline caching, service workers, and installable as a native-feeling desktop app.

---

## 🛠️ Architecture & Tech Stack

```
MicsV2/
├── convex/                # Convex Cloud database schemas, auth, and queries
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
├── run-all.js             # Concurrent process runner (Convex + Backend + Vite)
├── run.bat                # 1-Click Windows desktop launcher
├── Dockerfile             # Container definition with Chromium & FFmpeg
└── docker-compose.yml     # Multi-container orchestration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0+)
- **Python / yt-dlp** (installed and available on PATH for local extraction)

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

3. **Configure Environment:**
   Create or verify your `.env.local` file:
   ```env
   CONVEX_DEPLOYMENT=your-convex-deployment-id
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
   ```

---

## 💻 Running the App

### Option 1: One-Click Launcher (Windows)
Double-click [`run.bat`](./run.bat) in the project root to start Convex Dev, Express Backend, and Vite Frontend concurrently.

### Option 2: Unified Command (Cross-Platform)
```bash
npm run dev:all
```

### Option 3: Individual Terminals
- **Convex Database:**
  ```bash
  npx convex dev
  ```
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
| `/api/suggestions/:videoId`| `GET` | Dynamic Up Next queue generation |
| `/api/lyrics/:videoId` | `GET` | Time-synced or static song lyrics |
| `/api/import/playlist` | `POST` | Import Spotify / YouTube Music playlists |

---

## 🐳 Docker Deployment

To build and run the backend via Docker:

```bash
docker-compose up -d --build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for educational and personal music streaming purposes.
