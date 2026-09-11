# Project Map: Mics Music Player (V2)

This document serves as a comprehensive guide for AI models and developers to understand the architecture, data flow, and components of the **Mics** music player project.

---

## 1. Project Overview
**Mics** is a minimalist, high-fidelity music streaming application. It functions by querying metadata from YouTube Music and streaming audio via a resilient two-tier audio extraction architecture, providing a glassmorphism/ambient UI and fully local-first privacy.

### Core Features:
- **Streaming**: On-the-fly audio extraction and chunk streaming with range requests.
- **Local Disk Cache**: Automatically caches played tracks to `./cache/${id}.audio` for instant replay with zero network overhead.
- **Search**: Direct integration with YouTube Music's database and search suggestions.
- **Trending & Home**: Real-time trending tracks from global charts (iTunes + YouTube Music merged rankings).
- **Ambient UI**: Dynamic background system extracting dominant colors from album art for fluid ambient lighting.
- **Local-First**: 100% database-free; all favorites, playlists, and playback queues are persisted locally in `localStorage`.

---

## 2. Technology Stack

### Frontend:
- **React 19 (Vite)**: Core UI framework.
- **TailwindCSS**: Utility-first styling.
- **Framer Motion**: Smooth animations and fluid transitions.
- **Native Audio API**: Standard browser HTML5 `Audio` element for gapless playback control.

### Backend:
- **Node.js (Express 5)**: REST API server.
- **ytmusic-api / youtube-sr**: For searching and fetching metadata from YouTube Music.
- **Primary Extractor: Remote Stream API (`STREAM_API_URL`)**: Pluggable external API (Piped, Invidious, Cobalt, RapidAPI, or custom reverse proxy) that isolates stream extraction from the host IP to completely prevent YouTube 429 rate-limit IP bans.
- **Backup Extractor: youtube-dl-exec (yt-dlp)**: Local fallback extractor equipped with `cookies.txt` auto-detection and proxy (`YTDLP_PROXY`) support.
- **Local Disk Cache**: Native Node.js stream caching in `./cache/` directory.

---

## 3. Architecture & Data Flow

### Audio Streaming Flow:
1. **Frontend**: Requests `/api/stream/:videoId`.
2. **Backend**:
   - Checks `./cache/${videoId}.audio` on disk. If present, serves directly via 206 Partial Content range streaming with zero external network calls.
   - Checks in-memory `urlCache` (5-minute TTL).
   - If not cached, runs `getAudioStreamUrl(videoId)`:
     - **Primary Tier**: Calls `STREAM_API_URL` (if configured in `.env`). Injects `:id` into the template, parses response (JSON, Piped streams, Invidious adaptive formats, or direct audio link).
     - **Backup Tier**: If primary is unconfigured or fails, invokes local `yt-dlp` using mobile client headers (`extractorArgs: youtube:player_client=android,ios,web`), passing `cookies.txt` or `YTDLP_PROXY` if present.
   - Pipes the audio stream to the client while simultaneously streaming into `./cache/${videoId}.audio.download` in the background for subsequent instant playback.
3. **Frontend**: Receives chunked audio and plays via `audioRef.current`.

### Image Proxying:
Since external image CDNs may enforce strict CORS policies, the server provides an `/api/thumb` endpoint to proxy and upscale thumbnails for `<canvas>` ambient color extraction.

---

## 4. Key Directory Structure

```text
/
├── src/
│   ├── App.jsx            # Main React Component: UI, Audio Engine, State, LocalStorage
│   ├── assets/            # Static assets
│   ├── index.css          # Design system, glassmorphism, and ambient blobs
│   └── main.jsx           # React entry point
├── public/                # Static public files & PWA assets
├── server/                # Express Backend: API, Audio Pipeline
│   ├── index.ts           # Server entry point, audio extractor orchestrator, endpoints
│   ├── routes/            # API Route handlers (e.g. playlist import)
│   └── importers/         # Playlist importers (YouTube, Spotify)
├── cache/                 # Local audio disk cache directory (*.audio)
├── .env.example           # Reference environment variables configuration
├── package.json           # Project dependencies & scripts
├── run-all.js             # Dual-runner for Express backend + Vite frontend
├── run.bat                # Windows quick launcher
└── vite.config.js         # Frontend build configuration
```

---

## 5. Critical Files for Models

### `server/index.ts`
- **Streaming Orchestrator**: `getAudioStreamUrl(id)`
- **Primary Extractor**: `extractFromStreamApi(id)` and `extractFromSingleStreamApi(url, id)`
- **Backup Extractor**: `extractYtDlp(id, attempt)`
- **Redirect-Aware Streaming**: `requestWithRedirects(targetUrl, options, callback)`
- **Audio Endpoints**: `/api/stream/:id` and `/api/precache/:id`

### `src/App.jsx`
- **Audio Engine**: Managed via `audioRef` and a set of `useEffect` hooks for audio events.
- **Local Storage**: User favorites, recent history, and custom playlists.
- **Color Extraction**: `extractCoverColor` uses a canvas to determine ambient background color.

---

## 6. How to Run

### Installation:
```bash
npm install
```

### Launch:
```bash
# Windows
run.bat

# Cross-platform
npm run dev:all
```
