# Project Map: Mics Music Player

This document serves as a comprehensive guide for AI models and developers to understand the architecture, data flow, and components of the **Mics** music player project.

---

## 1. Project Overview
**Mics** is a minimalist, high-fidelity music streaming application. It functions by scraping metadata and audio streams from YouTube Music, providing a premium-feeling web interface and an Android application (via Capacitor).

### Core Features:
- **Streaming**: On-the-fly audio extraction and transcoding to MP3.
- **Search**: Direct integration with YouTube Music's database.
- **Trending**: Real-time trending tracks from global charts.
- **Ambient UI**: A dynamic background system that extracts colors from album art to create a glassmorphism/ambient effect.

---

## 2. Technology Stack

### Frontend:
- **React (Vite)**: Core UI framework.
- **TailwindCSS**: Utility-first styling.
- **Material Symbols**: Google's icon library for the interface.
- **Native Audio API**: Standard browser `Audio` object for playback control.

### Backend:
- **Node.js (Express)**: REST API server.
- **ytmusic-api**: For searching and fetching metadata from YouTube Music.
- **youtube-dl-exec (yt-dlp)**: Primary engine for audio stream extraction.
- **Puppeteer (Stealth)**: Fallback engine for stream extraction when scraping is blocked.
- **FFmpeg**: Spawns a process to transcode raw streams into high-quality MP3 (192k).

---

## 3. Architecture & Data Flow

### Audio Streaming Flow:
1. **Frontend**: Requests `/api/stream/:videoId`.
2. **Backend**:
   - Checks `urlCache` for an existing stream URL.
   - If missing, attempts extraction via `yt-dlp`.
   - If `yt-dlp` fails, spawns a **Puppeteer Stealth** instance to intercept the video playback request and grab the raw GoogleVideo URL.
   - Fetches the raw audio stream from Google servers.
   - Pipes the stream through **FFmpeg** to convert it to MP3.
   - Streams the MP3 data back to the frontend.
3. **Frontend**: Receives a `Blob` URL and plays it via `audioRef.current`.

### Image Proxying:
Since YouTube images have strict CORS policies, the server provides an `/api/image` endpoint that proxies images to the frontend, allowing the React app to perform color extraction on the `<canvas>`.

---

## 4. Key Directory Structure

```text
/
├── src/
│   ├── App.jsx            # Main React Component: UI, Audio Engine, State
│   ├── assets/            # Static assets
│   ├── index.css          # Design system, glassmorphism, and ambient blobs
│   ├── main.jsx           # React entry point
│   └── main.ts            # Vite entry point (TS variant)
├── public/                # Static public files
├── server/                # Express Backend: API, Streaming logic, Transcoding
│   ├── index.ts           # Server entry point
│   ├── routes/            # API Route handlers
│   └── importers/         # Playlist importers (YT, Spotify)
├── package.json           # Dependencies (React, Express, yt-dlp, Puppeteer)
└── vite.config.js         # Frontend build configuration
```

---

## 5. Critical Files for Models

### `server/index.ts`
- **Streaming Logic**: See `app.get('/api/stream/:id')`.
- **Extraction Logic**: `extractPrimary` and `getAudioUrlViaPuppeteer`.
- **Transcoding**: Look for the streaming proxy and cache pipeline.

### `src/App.jsx`
- **Audio Engine**: Managed via `audioRef` and a set of `useEffect` hooks for audio events.
- **State Management**: Uses React hooks for `queue`, `isPlaying`, `progress`, and `currentTrack`.
- **Color Extraction**: `extractCoverColor` uses a canvas to determine the ambient background color.

### `src/index.css`
- **Ambient Shell**: Defines the `.ambient-shell` and `.ambient-blob` classes that create the visual atmosphere.

---

## 6. How to Run

### Requirements:
- **Node.js**: v18+ recommended.
- **FFmpeg**: Must be installed on the system PATH for streaming to work.
- **yt-dlp**: Recommended to be available for faster extraction.

### Installation:
```bash
npm install
```

### Development:
1. Start all services concurrently: `npm run dev:all`
   *(or individually: `npx tsx server/index.ts` + `npm run dev` + `npx convex dev`)*
