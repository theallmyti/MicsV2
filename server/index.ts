import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import YTMusic from 'ytmusic-api';
import youtubeSr from 'youtube-sr';
import youtubedl from 'youtube-dl-exec';
import https from 'https';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

import importRouter from './routes/import';

puppeteer.use(StealthPlugin());

const YouTube = (youtubeSr as any).default || youtubeSr;
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// ===== Optional Redis client (if REDIS_URL provided) =====
let redisClient: any = null;
const REDIS_URL = process.env.REDIS_URL || null;
if (REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (e: any) => console.error('Redis error:', e.message));
  redisClient.connect().then(() => console.log('Connected to Redis')).catch(() => { redisClient = null; });
}

// ===== Rate limiter: small in-memory fallback if redis not available =====
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3000, // generous limit for rich audio apps
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  skip: (req: any) => {
    // Never rate limit audio streaming chunks, image thumbnails, precache, or health checks
    return req.path.startsWith('/api/stream') ||
           req.path.startsWith('/api/thumb') ||
           req.path.startsWith('/api/precache') ||
           req.path === '/';
  }
});
app.use(limiter);

// Register the playlist import router
app.use('/api/import', importRouter);

// ===== Static files & SPA fallback in production =====
const distPath = path.join(process.cwd(), 'dist');
const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

if (hasDist) {
  app.use(express.static(distPath));
}

// ===== Root / Health check route (fallback if dist not built) =====
if (!hasDist) {
  app.get('/', (req: any, res: any) => {
    if (req.accepts('html')) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mics API Server</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d0f17;
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: rgba(26, 31, 46, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 32px;
            max-width: 580px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(34, 197, 94, 0.15);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.3);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .badge::before {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 8px #22c55e;
          }
          h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
          p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
          .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 24px;
            transition: opacity 0.2s;
          }
          .cta-btn:hover { opacity: 0.9; }
          .endpoints-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 700;
          }
          .endpoint-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .endpoint-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-family: monospace;
          }
          .method {
            font-weight: 700;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
          }
          .path { color: #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Backend API Active</div>
          <h1>Mics V2 API Server</h1>
          <p>The Express backend is running on port ${PORT}. To access the user interface, open the Vite Frontend:</p>
          <a href="http://localhost:5173" class="cta-btn">🚀 Open Frontend (http://localhost:5173)</a>
          
          <div class="endpoints-title">Available API Endpoints</div>
          <ul class="endpoint-list">
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/search?q=:query</span></li>
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/trending</span></li>
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/home</span></li>
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/stream/:videoId</span></li>
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/suggestions/:videoId</span></li>
            <li class="endpoint-item"><span class="method">GET</span> <span class="path">/api/lyrics/:videoId</span></li>
          </ul>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    status: 'online',
    message: 'Mics V2 Backend API is running',
    frontend: 'http://localhost:5173',
    version: '2.0.0',
    endpoints: [
      '/api/search',
      '/api/trending',
      '/api/home',
      '/api/stream/:videoId',
      '/api/suggestions/:videoId',
      '/api/lyrics/:videoId',
      '/api/import/playlist'
    ]
  });
});
}

// ===== YouTube Music API (Primary Search Engine) =====
const YTMusicConstructor = (YTMusic as any)?.default || YTMusic;
let ytmusic: any = null;
let ytmusicReady = false;

async function initYTMusic() {
  try {
    ytmusic = new YTMusicConstructor();
    await ytmusic.initialize();
    ytmusicReady = true;
    console.log('  ✅ YouTube Music API initialized successfully');
  } catch (err: any) {
    console.error('  ❌ YouTube Music API init failed:', err.message);
    ytmusicReady = false;
  }
}

// Retry init if it fails
async function ensureYTMusic() {
  if (ytmusicReady && ytmusic) return true;
  try {
    ytmusic = new YTMusicConstructor();
    await ytmusic.initialize();
    ytmusicReady = true;
    return true;
  } catch {
    return false;
  }
}

// ===== Helper: Parse duration string "3:42" to seconds =====
function parseDuration(durStr: string) {
  if (!durStr || typeof durStr !== 'string') return 0;
  const parts = durStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

// Helper: wrap thumbnail URL through our proxy for reliable loading
function proxyThumb(url: string) {
  if (!url) return '';
  // Upscale googleusercontent URLs to 1024x1024 (preferred high-res) through our proxy
  if (url.includes('googleusercontent.com') && url.includes('=w')) {
    url = url.replace(/=w\d+-h\d+[^&\s]*/g, '=w1024-h1024-l90-rj');
  }
  return `/api/thumb?url=${encodeURIComponent(url)}`;
}

// ===== Helper: Get best thumbnail =====
function getBestThumbnail(thumbnails: any[], videoId: string | null) {
  let url = '';
  if (thumbnails && Array.isArray(thumbnails) && thumbnails.length > 0) {
    const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    url = sorted[0].url || '';
  } else if (videoId) {
    url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return proxyThumb(url);
}

// ===== Map ytmusic-api song result to our track format =====
function mapYTMusicTrack(song: any) {
  const videoId = song.videoId || song.id || '';
  return {
    id: videoId,
    title: song.name || song.title || '',
    artist: song.artist?.name || song.artists || '',
    thumbnail: getBestThumbnail(song.thumbnails, videoId) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: song.duration ? (typeof song.duration === 'number' ? song.duration : parseDuration(song.duration)) : 0,
    views: song.views || 0,
    album: song.album?.name || '',
  };
}

// ===== Map youtube-sr video to our track format (fallback) =====
function mapYouTubeSrTrack(v: any) {
  const thumbUrl = v.thumbnail?.url || v.thumbnails?.[v.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  return {
    id: v.id,
    title: v.title || '',
    artist: v.channel?.name || '',
    thumbnail: proxyThumb(thumbUrl),
    duration: Math.round((v.duration || 0) / 1000),
    views: v.views || 0,
  };
}

// ===== Mashup / Compilation filter =====
const MASHUP_PATTERN = /\b(mashup|mash-?up|medley|mega\s*mix|megamix|nonstop|non-stop|jukebox|dj\s+mix|dj\s+set|compilation|mixtape|party\s+mix|remix\s+pack|best\s+of|ultimate\s+mix|songs?\s+collection|hits?\s+collection|all\s+songs|\d+\s+songs?|playlist\s+mix|continuous\s+mix)\b/i;

function isMashup(track: any) {
  const haystack = `${track.title || ''} ${track.artist || ''}`;
  return MASHUP_PATTERN.test(haystack);
}

function filterMashups(tracks: any[], source = '') {
  const before = tracks.length;
  const clean = tracks.filter(t => !isMashup(t));
  if (before !== clean.length) {
    console.log(`[Mashup Filter][${source}] Dropped ${before - clean.length} of ${before} tracks`);
  }
  return clean;
}

app.get('/api/thumb', async (req: any, res: any) => {
  const url = req.query.url;
  if (!url) return res.status(400).end();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) return res.status(response.status).end();
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).end();
  }
});

// ===== Search YouTube Music =====
app.get('/api/search', async (req: any, res: any) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    if (await ensureYTMusic()) {
      try {
        const songs = await ytmusic.searchSongs(q);
        if (songs && songs.length > 0) {
          console.log(`[Search] YTMusic: "${q}" → ${songs.length} songs`);
          return res.json(filterMashups(songs.map(mapYTMusicTrack), 'search-ytmusic'));
        }
      } catch (err: any) {
        console.warn(`[Search] YTMusic search failed for "${q}":`, err.message?.slice(0, 80));
      }
    }

    console.log(`[Search] Falling back to youtube-sr for "${q}"`);
    const results = await YouTube.search(`${q} song`, { limit: 20, type: 'video' });
    const filtered = results.filter((v: any) => {
      const dur = (v.duration || 0) / 1000;
      return dur > 30 && dur < 600;
    });
    res.json(filterMashups((filtered.length > 0 ? filtered : results).map(mapYouTubeSrTrack), 'search-sr'));
  } catch (err: any) {
    console.error('Search error:', err.message);
    res.json([]);
  }
});

// ===== Search Suggestions (Autocomplete) =====
app.get('/api/search/suggestions', async (req: any, res: any) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    if (await ensureYTMusic()) {
      const suggestions = await ytmusic.getSearchSuggestions(q);
      return res.json(suggestions || []);
    }
    res.json([]);
  } catch (err: any) {
    console.error('Suggestions error:', err.message);
    res.json([]);
  }
});

// ===== Get Artist Image =====
app.get('/api/artist-image', async (req: any, res: any) => {
  const q = req.query.q;
  if (!q) return res.json({ url: null });

  try {
    if (await ensureYTMusic()) {
      const artists = await ytmusic.searchArtists(q);
      if (artists && artists.length > 0) {
        const artist = artists[0];
        const thumb = getBestThumbnail(artist.thumbnails, null);
        return res.json({ url: thumb });
      }
    }
    res.json({ url: null });
  } catch (err: any) {
    console.error('Artist image error:', err.message);
    res.json({ url: null });
  }
});

// ===== Get Up Next (Related Songs) =====
app.get('/api/suggestions/:id', async (req: any, res: any) => {
  try {
    if (await ensureYTMusic()) {
      try {
        const upNext = await ytmusic.getUpNexts(req.params.id);
        if (upNext && upNext.length > 0) {
          const tracks = upNext
            .filter((t: any) => {
              const tid = t.videoId || t.id;
              return tid && tid !== req.params.id;
            })
            .map((t: any) => ({
              id: t.videoId || t.id,
              title: t.title || t.name || '',
              artist: t.artists || t.artist?.name || '',
              thumbnail: getBestThumbnail(t.thumbnails, t.videoId || t.id) || `https://i.ytimg.com/vi/${t.videoId || t.id}/hqdefault.jpg`,
              duration: t.duration ? (typeof t.duration === 'number' ? t.duration : parseDuration(t.duration)) : 0,
            }));
          const cleanTracks = filterMashups(tracks, 'upnext-ytmusic');
          console.log(`[UpNext] YTMusic: ${req.params.id} → ${cleanTracks.length} tracks`);
          return res.json(cleanTracks);
        }
      } catch (err: any) {
        console.warn(`[UpNext] YTMusic failed:`, err.message?.slice(0, 80));
      }
    }

    let searchQuery = 'trending music 2025';
    try {
      const video = await YouTube.getVideo(`https://youtube.com/watch?v=${req.params.id}`);
      searchQuery = video.channel?.name ? `${video.channel.name} songs` : (video.title || searchQuery);
    } catch {
      if (req.query.artist) {
        searchQuery = `${req.query.artist} songs`;
      } else if (req.query.title) {
        searchQuery = `${req.query.title} similar songs`;
      }
    }

    const results = await YouTube.search(searchQuery, { limit: 15, type: 'video' });
    let filtered = results.filter((v: any) => v.id !== req.params.id && (v.duration || 0) / 1000 < 600);
    
    if (req.query.title) {
      const lowerQueryTitle = req.query.title.toLowerCase();
      filtered = filtered.filter((v: any) => !(v.title && v.title.toLowerCase().includes(lowerQueryTitle)));
    }

    const tracks = filterMashups(filtered.map(mapYouTubeSrTrack), 'upnext-sr');
    res.json(tracks);
  } catch (err: any) {
    console.error('Suggestions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== Home Sections (YouTube Music Discover Feed) =====
app.get('/api/home', async (req: any, res: any) => {
  try {
    if (await ensureYTMusic()) {
      try {
        const sections = await ytmusic.getHomeSections();
        if (sections && sections.length > 0) {
          const mapped = sections.map((section: any) => ({
            title: section.title || '',
            contents: filterMashups(
              (section.contents || []).map((item: any) => ({
                id: item.videoId || item.playlistId || '',
                type: item.type || 'SONG',
                title: item.name || item.title || '',
                artist: item.artist?.name || item.artists || '',
                thumbnail: getBestThumbnail(item.thumbnails, item.videoId),
                duration: item.duration ? parseDuration(item.duration) : 0,
                playlistId: item.playlistId || null,
              })),
              `home-${section.title}`
            )
          }));
          console.log(`[Home] ${mapped.length} sections loaded`);
          return res.json(mapped);
        }
      } catch (err: any) {
        console.warn('[Home] YTMusic home sections failed:', err.message?.slice(0, 80));
      }
    }
    res.json([]);
  } catch (err: any) {
    console.error('Home error:', err.message);
    res.json([]);
  }
});

// ===== Trending (curated from YouTube Music) =====
app.get('/api/trending', async (req: any, res: any) => {
  try {
    const scope = (req.query.scope || 'global');
    const country = (req.query.country || 'US').toUpperCase();
    const cacheKey = `${scope}:${country}`;

    if (redisClient) {
      try {
        const cachedRaw = await redisClient.get(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          return res.json(parsed);
        }
      } catch (err: any) { console.warn('Redis get failed:', err.message); }
    } else {
      if (!(global as any).trendingCache) (global as any).trendingCache = new Map();
      const cached = (global as any).trendingCache.get(cacheKey);
      if (cached && (Date.now() - cached.ts) < (10 * 60 * 1000)) {
        return res.json(cached.data);
      }
    }

    if (scope === 'national' && country) {
      try {
        const itunes = await fetchItunesTopSongs(country, 25);
        let ytList = [];
        try {
          const results = await YouTube.search(`top music ${country} 2025`, { limit: 25, type: 'video' });
          ytList = (results || []).filter((v: any) => (v.duration || 0) / 1000 < 600).map(mapYouTubeSrTrack);
        } catch (e: any) {
          console.warn('[Trending] youtube-sr fetch failed for merge:', e.message?.slice(0,80));
        }

        if ((itunes && (itunes as any).length > 0) || (ytList && ytList.length > 0)) {
          const merged = mergeTrendingSources(itunes as any || [], ytList || [], { itunes: 0.6, youtube: 0.4 }, 25);
          if (redisClient) {
            try { await redisClient.set(cacheKey, JSON.stringify(merged), { EX: 10 * 60 }); } catch (e: any) { console.warn('Redis set failed:', e.message); }
          } else {
            (global as any).trendingCache.set(cacheKey, { ts: Date.now(), data: merged });
          }
          console.log(`[Trending] Merged (${country}): ${merged.length} tracks`); 
          return res.json(merged);
        }
      } catch (err: any) {
        console.warn('[Trending] iTunes fetch failed:', err.message?.slice(0,80));
      }
    }

    try {
      if (await ensureYTMusic()) {
        try {
          const songs = await ytmusic.searchSongs('trending songs 2025');
          if (songs && songs.length > 0) {
            console.log(`[Trending] YTMusic: ${songs.length} songs`);
            const mapped = filterMashups(songs.map(mapYTMusicTrack), 'trending-ytmusic');
            if (redisClient) {
              try { await redisClient.set(cacheKey, JSON.stringify(mapped), { EX: 10 * 60 }); } catch (e: any) { console.warn('Redis set failed:', e.message); }
            } else {
              (global as any).trendingCache.set(cacheKey, { ts: Date.now(), data: mapped });
            }
            return res.json(mapped);
          }
        } catch (err: any) {
          console.warn('[Trending] YTMusic failed:', err.message?.slice(0, 80));
        }
      }

      const results = await YouTube.search('trending music 2025', { limit: 20, type: 'video' });
      const filtered = results.filter((v: any) => (v.duration || 0) / 1000 < 600);
      const out = filterMashups(
        (filtered.length > 0 ? filtered : results).map(mapYouTubeSrTrack),
        'trending-sr'
      );
      if (redisClient) {
        try { await redisClient.set(cacheKey, JSON.stringify(out), { EX: 10 * 60 }); } catch (e: any) { console.warn('Redis set failed:', e.message); }
      } else {
        (global as any).trendingCache.set(cacheKey, { ts: Date.now(), data: out });
      }
      res.json(out);
    } catch (err: any) {
      console.error('Trending error:', err.message);
      res.json([]);
    }
  } catch (err: any) {
    console.error('Trending outer error:', err.message);
    res.json([]);
  }
});

// ===== Geolocation endpoint (country-level) =====
app.get('/api/geolocate', async (req: any, res: any) => {
  try {
    const country = req.headers['cf-ipcountry'] || 
                    req.headers['x-country-code'] || 
                    req.headers['x-vercel-ip-country'] || 
                    'US';
    res.json({ country: String(country).toUpperCase() });
  } catch (err) {
    res.json({ country: 'US' });
  }
});

// ===== iTunes RSS / Apple Music charts fetcher (no API key required) =====
async function fetchItunesTopSongs(country = 'US', limit = 25) {
  const c = (country || 'US').toLowerCase();
  const url = `https://itunes.apple.com/${c}/rss/topsongs/limit=${limit}/json`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (r) => {
      let raw = '';
      r.on('data', (chunk) => raw += chunk);
      r.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const entries = (json.feed && json.feed.entry) || [];
          const mapped = entries.map((e: any, idx: number) => {
            const id = e.id && (e.id.attributes && e.id.attributes.href) ? (e.id.attributes.href.split('/id').pop() || `${country}-song-${idx}`) : `${country}-song-${idx}`;
            const title = e['im:name']?.label || '';
            const artist = e['im:artist']?.label || '';
            const images = e['im:image'] || [];
            const thumb = images.length ? images[images.length - 1].label : '';
            return {
              id: id.toString(),
              title,
              artist,
              thumbnail: proxyThumb(thumb),
              duration: 0,
              source: 'itunes'
            };
          });
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

// ===== Merge multiple source lists into a ranked combined list =====
function mergeTrendingSources(itunes = [], youtube = [], weights = { itunes: 0.6, youtube: 0.4 }, limit = 25) {
  const scores = new Map();
  const items = new Map();

  const addList = (list: any[], keyPrefix: string, weight: number) => {
    list.forEach((it, idx) => {
      const key = `${it.id}` || `${keyPrefix}-${idx}`;
      const rankScore = 1 / (idx + 1);
      const score = rankScore * weight;
      scores.set(key, (scores.get(key) || 0) + score);
      if (!items.has(key)) items.set(key, { ...it });
      else items.set(key, { ...items.get(key), ...it });
    });
  };

  addList(itunes, 'itunes', weights.itunes);
  addList(youtube, 'yt', weights.youtube);

  const merged = Array.from(scores.entries())
    .map(([key, score]) => ({ key, score, item: items.get(key) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => {
      const it = entry.item;
      return {
        id: it.id,
        title: it.title || it.name || '',
        artist: it.artist || it['im:artist'] || it.channel || '',
        thumbnail: it.thumbnail || it.image || it.thumb || '',
        duration: it.duration || 0,
        source: it.source || 'merged'
      };
    });

  return merged;
}

// ===== Song Info =====
app.get('/api/info/:id', async (req: any, res: any) => {
  try {
    if (await ensureYTMusic()) {
      try {
        const song = await ytmusic.getSong(req.params.id);
        if (song) {
          return res.json(mapYTMusicTrack(song));
        }
      } catch {}
    }
    const video = await YouTube.getVideo(`https://youtube.com/watch?v=${req.params.id}`);
    res.json(mapYouTubeSrTrack(video));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Streaming Infrastructure =====
const urlCache = new Map();

class BrowserQueue {
  limit: number;
  active: number;
  queue: any[];
  constructor(limit: number) {
    this.limit = limit;
    this.active = 0;
    this.queue = [];
  }
  async acquire() {
    if (this.active >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.active++;
  }
  release() {
    this.active--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }
}
const browserQueue = new BrowserQueue(2);

// Headless fallback to manually extract the googlevideo URL
async function getAudioUrlViaPuppeteer(id: string, attempt = 1): Promise<any> {
  console.log(`[Fallback] Booting headless browser for ${id} (Attempt ${attempt})...`);
  await browserQueue.acquire();
  
  let browser: any = null;
  let audioUrl: string | null = null;

  try {
    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];
    browser = await puppeteer.launch({ 
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: puppeteerArgs
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
      const url = req.url();
      if (['image', 'stylesheet', 'font', 'other'].includes(req.resourceType())) {
        req.abort();
        return;
      }
      if (url.includes('googlevideo.com/videoplayback') && url.includes('mime=audio')) {
        audioUrl = url;
      }
      req.continue();
    });

    await page.goto(`https://www.youtube.com/watch?v=${id}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    let attempts = 0;
    while (!audioUrl && attempts < 50) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }
  } catch (err: any) {
    console.error(`[Fallback] Puppeteer error on attempt ${attempt}:`, err.message);
  } finally {
    if (browser) await browser.close();
    browserQueue.release();
  }

  if (!audioUrl) {
    if (attempt < 2) {
      console.log(`[Fallback] Retrying Puppeteer for ${id}...`);
      return await getAudioUrlViaPuppeteer(id, attempt + 1);
    }
    console.error(`[Fallback] FATAL: Headless interception failed after 2 attempts.`);
    throw new Error("Fallback failed: Could not intercept audio URL via headless browser.");
  }
  
  console.log(`[Fallback] Success! Extracted raw stream URL via Puppeteer.`);
  return audioUrl;
}

// yt-dlp primary extraction with retry and delay
async function extractPrimary(id: string, attempt = 1): Promise<any> {
  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const rawOutput: any = await youtubedl(url, {
      dumpJson: true,
      format: 'bestaudio/best',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      extractorArgs: 'youtube:player_client=android,ios,web'
    });
    console.log(`[yt-dlp] Success! Extracted URL for ${id} on attempt ${attempt}.`);
    return rawOutput.url;
  } catch (err: any) {
    console.warn(`[yt-dlp] Extraction failed on attempt ${attempt} for ${id}: ${err.message?.slice(0, 80)}`);
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
      console.log(`[yt-dlp] Retrying (attempt ${attempt + 1})...`);
      return await extractPrimary(id, attempt + 1);
    }
    throw err;
  }
}

const CACHE_DIR = path.join(process.cwd(), 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}
const downloadingLocks = new Set();

function getAudioMimeType(filePath: string): string {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // WebM / EBML: 1A 45 DF A3
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
      return 'audio/webm';
    }
    // MP4 / M4A: ftyp at offset 4
    if (buffer.toString('utf8', 4, 8) === 'ftyp') {
      return 'audio/mp4';
    }
    // MP3: ID3 header or sync word
    if (buffer.toString('utf8', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
      return 'audio/mpeg';
    }
    // OGG: OggS
    if (buffer.toString('utf8', 0, 4) === 'OggS') {
      return 'audio/ogg';
    }
  } catch {}
  return 'audio/webm';
}

// ===== OPTIONS Preflight for Stream =====
app.options('/api/stream/:id', (req: any, res: any) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
  });
  res.status(204).end();
});

// ===== Stream audio =====
app.get('/api/stream/:id', async (req: any, res: any) => {
  try {
    const id = req.params.id;
    if (!id || id.startsWith('PL') || id.startsWith('VLPL')) {
      return res.status(400).json({ error: 'Invalid video ID for streaming' });
    }
    const cacheFilePath = path.join(CACHE_DIR, `${id}.audio`);

    if (fs.existsSync(cacheFilePath)) {
      const stat = fs.statSync(cacheFilePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      const mimeType = getAudioMimeType(cacheFilePath);

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(cacheFilePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
        };
        res.writeHead(206, head);
        fileStream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
        };
        res.writeHead(200, head);
        fs.createReadStream(cacheFilePath).pipe(res);
      }
      return;
    }

    let directUrl = urlCache.get(id);

    if (!directUrl) {
      try {
        directUrl = await extractPrimary(id);
      } catch (err) {
        console.warn(`[yt-dlp] Primary extraction completely failed for ${id}. Triggering headless fallback...`);
        directUrl = await getAudioUrlViaPuppeteer(id);
      }
      
      urlCache.set(id, directUrl);
      setTimeout(() => urlCache.delete(id), 5 * 60 * 1000);
    }

    const tempCachePath = path.join(CACHE_DIR, `${id}.audio.download`);
    if (!downloadingLocks.has(id)) {
      downloadingLocks.add(id);
      const downloadOptions = {
        headers: {
          'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
        }
      };
      https.get(directUrl, downloadOptions, (downloadRes) => {
        if (downloadRes.statusCode === 200) {
          const fileStream = fs.createWriteStream(tempCachePath);
          downloadRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close(() => {
              try {
                if (fs.existsSync(tempCachePath)) {
                  fs.renameSync(tempCachePath, cacheFilePath);
                  console.log(`[Cache] Downloaded and cached ${id}`);
                }
              } catch (e) {}
              downloadingLocks.delete(id);
            });
          });
          downloadRes.on('error', () => {
            fileStream.close();
            if (fs.existsSync(tempCachePath)) fs.unlinkSync(tempCachePath);
            downloadingLocks.delete(id);
          });
        } else {
          downloadingLocks.delete(id);
        }
      }).on('error', (err) => {
        console.error('[Cache] Download error:', err.message);
        downloadingLocks.delete(id);
        if (fs.existsSync(tempCachePath)) fs.unlinkSync(tempCachePath);
      });
    }

    const options: any = {
      headers: {
        'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
      }
    };
    if (req.headers.range) {
      options.headers.Range = req.headers.range;
    }

    const proxyReq = https.get(directUrl, options, (streamRes) => {
      if (streamRes.statusCode === 403 || streamRes.statusCode === 429) {
        urlCache.delete(id);
      }
      const rawMime = streamRes.headers['content-type'] || '';
      const mimeType = (rawMime && !rawMime.includes('octet-stream')) ? rawMime : 'audio/webm';
      const proxyHeaders = {
        ...streamRes.headers,
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
      };
      res.writeHead(streamRes.statusCode, proxyHeaders);
      streamRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

  } catch (err: any) {
    console.error('Stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ===== Precache next song =====
app.get('/api/precache/:id', async (req: any, res: any) => {
  const id = req.params.id;
  const cacheFilePath = path.join(CACHE_DIR, `${id}.audio`);
  
  if (fs.existsSync(cacheFilePath) || downloadingLocks.has(id)) {
    return res.json({ status: 'already_cached_or_downloading' });
  }

  res.json({ status: 'started' });

  try {
    let directUrl = urlCache.get(id);
    if (!directUrl) {
      directUrl = await extractPrimary(id);
      urlCache.set(id, directUrl);
      setTimeout(() => urlCache.delete(id), 5 * 60 * 1000);
    }
    
    const tempCachePath = path.join(CACHE_DIR, `${id}.audio.download`);
    if (!downloadingLocks.has(id)) {
      downloadingLocks.add(id);
      const downloadOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        }
      };
      https.get(directUrl, downloadOptions, (downloadRes) => {
        if (downloadRes.statusCode === 200) {
          const fileStream = fs.createWriteStream(tempCachePath);
          downloadRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close(() => {
              try {
                if (fs.existsSync(tempCachePath)) {
                  fs.renameSync(tempCachePath, cacheFilePath);
                  console.log(`[Cache] Precached ${id}`);
                }
              } catch (e) {}
              downloadingLocks.delete(id);
            });
          });
          downloadRes.on('error', () => {
            fileStream.close();
            if (fs.existsSync(tempCachePath)) fs.unlinkSync(tempCachePath);
            downloadingLocks.delete(id);
          });
        } else {
          downloadingLocks.delete(id);
        }
      }).on('error', (err) => {
        console.error('[Cache] Precache download error:', err.message);
        downloadingLocks.delete(id);
        if (fs.existsSync(tempCachePath)) fs.unlinkSync(tempCachePath);
      });
    }
  } catch (err: any) {
    console.warn(`[Cache] Precache failed for ${id}:`, err.message);
  }
});

// ===== Fetch Playlist =====
app.get('/api/playlist', async (req: any, res: any) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing playlist URL' });

  try {
    let playlistId = url;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.searchParams.has('list')) {
        playlistId = parsedUrl.searchParams.get('list');
      }
    } catch (e) {
      // Not a valid URL, assume it's an ID
    }

    if (await ensureYTMusic()) {
      try {
        const playlist = await ytmusic.getPlaylist(playlistId);
        if (playlist && playlist.videos && playlist.videos.length > 0) {
          const tracks = playlist.videos.map((v: any) => ({
            id: v.videoId || v.id,
            title: v.name || v.title || '',
            artist: (v.artists && v.artists.map((a: any) => a.name).join(', ')) || v.artist?.name || '',
            thumbnail: getBestThumbnail(v.thumbnails, v.videoId || v.id) || `https://i.ytimg.com/vi/${v.videoId || v.id}/hqdefault.jpg`,
            duration: v.duration ? (typeof v.duration === 'number' ? v.duration : parseDuration(v.duration)) : 0,
          }));
          return res.json({ id: playlist.playlistId || playlistId, title: playlist.name || 'Imported Playlist', tracks });
        }
      } catch (err: any) {
        console.warn(`[Playlist] YTMusic failed:`, err.message?.slice(0, 80));
      }
    }

    const playlist = await YouTube.getPlaylist(url);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    
    const tracks = (playlist.videos || []).map((v: any) => mapYouTubeSrTrack(v));
    res.json({ id: playlist.id || playlistId, title: playlist.title || 'Imported Playlist', tracks });
  } catch (err: any) {
    console.error('Playlist error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== Get Lyrics =====
app.get('/api/lyrics/:videoId', async (req: any, res: any) => {
  const { videoId } = req.params;
  try {
    if (await ensureYTMusic()) {
      const lyrics = await ytmusic.getLyrics(videoId);
      return res.json(lyrics || []);
    }
    res.json([]);
  } catch (err: any) {
    console.error('Lyrics error:', err.message);
    res.status(500).json([]);
  }
});

// ===== Get Up Next Recommendations =====
app.get('/api/upnext/:videoId', async (req: any, res: any) => {
  const { videoId } = req.params;
  try {
    if (await ensureYTMusic()) {
      const upNexts = await ytmusic.getUpNexts(videoId);
      if (upNexts && Array.isArray(upNexts)) {
        const mapped = upNexts.map((song: any) => {
          const vId = song.videoId || song.id || '';
          return {
            id: vId,
            title: song.title || song.name || '',
            artist: song.artists || (song.artist?.name || ''),
            thumbnail: getBestThumbnail(song.thumbnails, vId) || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            duration: song.duration ? (typeof song.duration === 'number' ? song.duration : parseDuration(song.duration)) : 0,
          };
        });
        return res.json(filterMashups(mapped, 'upnext-dedicated'));
      }
    }
    res.json([]);
  } catch (err: any) {
    console.error('UpNext error:', err.message);
    res.status(500).json([]);
  }
});

// ===== SPA fallback for client routing in production =====
if (hasDist) {
  app.get('*', (req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/') || req.path === '/api') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ===== Boot =====
async function boot() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🎵 Mics Server running at http://localhost:${PORT}`);
    console.log(`  ├─ Search:      GET /api/search?q=song+name`);
    console.log(`  ├─ Suggestions: GET /api/search/suggestions?q=blind`);
    console.log(`  ├─ Stream:      GET /api/stream/:videoId`);
    console.log(`  ├─ Up Next:     GET /api/suggestions/:videoId`);
    console.log(`  ├─ Home Feed:   GET /api/home`);
    console.log(`  ├─ Info:        GET /api/info/:videoId`);
    console.log(`  ├─ Playlist Import: POST /api/import/playlist`);
    console.log(`  └─ Trending:    GET /api/trending\n`);
  });

  initYTMusic().catch((err) => {
    console.error('  ❌ Background YouTube Music init failed:', err.message);
  });
}

boot();
