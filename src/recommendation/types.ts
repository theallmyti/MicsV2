/**
 * @file types.ts
 * @description Data type contracts and interface declarations for the Mics Recommendation Engine.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  genres: string[];           // e.g. ["pop", "indie", "electropop"]
  tempo: number;              // BPM, 60–200
  energy: number;             // 0.0–1.0 (low chill → high intense)
  valence: number;            // 0.0–1.0 (sad → happy)
  danceability: number;       // 0.0–1.0
  acousticness: number;       // 0.0–1.0
  instrumentalness: number;   // 0.0–1.0
  durationMs: number;
  releaseYear: number;
  popularity: number;         // 0–100, provider-supplied
  playCount: number;          // user's local play count
  lastPlayedAt: number | null; // Date.now() timestamp
  likedAt: number | null;      // timestamp if liked, null if not
  addedToLibraryAt: number | null;
  thumbnail: string;
}

const ENRICHED_FEATURES: Record<string, Partial<Track>> = {
  '2g5y74q1P7c': { genres: ['electronic', 'synthwave'], tempo: 120, energy: 0.8, valence: 0.6, danceability: 0.7, acousticness: 0.1, instrumentalness: 0.2 },
  'neV3EPWRLIY': { genres: ['jazz', 'chill'], tempo: 85, energy: 0.35, valence: 0.45, danceability: 0.5, acousticness: 0.7, instrumentalness: 0.8 },
  'r9-V4Drc7tA': { genres: ['techno', 'electronic'], tempo: 126, energy: 0.9, valence: 0.5, danceability: 0.85, acousticness: 0.05, instrumentalness: 0.9 },
  '7-x3Y1S3b0s': { genres: ['acoustic', 'indie'], tempo: 92, energy: 0.4, valence: 0.6, danceability: 0.55, acousticness: 0.8, instrumentalness: 0.1 }
};

/**
 * enrichTrack
 * Takes a raw search result or partial track object and maps it to a complete Track instance
 * with deterministic feature vector parameters for recommendation calculation.
 */
export const enrichTrack = (track: any): Track => {
  if (!track) {
    return {
      id: "", title: "", artist: "", artistId: "", album: "", albumId: "",
      genres: [], tempo: 120, energy: 0.5, valence: 0.5, danceability: 0.5,
      acousticness: 0.5, instrumentalness: 0, durationMs: 0, releaseYear: 2024,
      popularity: 50, playCount: 0, lastPlayedAt: null, likedAt: null,
      addedToLibraryAt: null, thumbnail: ""
    };
  }
  const id = track.id || track.videoId || "";
  const features = ENRICHED_FEATURES[id] || {};

  const title = track.title || track.name || "Unknown Title";
  const artist = track.artist || (track.artists && track.artists[0]?.name) || "Unknown Artist";
  
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);

  const defaultGenres = [
    ['pop', 'dance'],
    ['rock', 'indie'],
    ['hiphop', 'rap'],
    ['jazz', 'chill'],
    ['electronic', 'ambient']
  ];
  const genres = features.genres || defaultGenres[absHash % defaultGenres.length];
  
  return {
    id,
    title,
    artist,
    artistId: track.artistId || artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    album: track.album || (track.albumName) || "Single",
    albumId: track.albumId || (track.album || "Single").toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    genres,
    tempo: features.tempo || (75 + (absHash % 115)), // 75-190 BPM
    energy: features.energy || (0.2 + (absHash % 80) / 100), // 0.2-1.0
    valence: features.valence || (0.1 + (absHash % 85) / 100), // 0.1-0.95
    danceability: features.danceability || (0.3 + (absHash % 60) / 100), // 0.3-0.9
    acousticness: features.acousticness || (0.01 + (absHash % 90) / 100), // 0.01-0.91
    instrumentalness: features.instrumentalness || (absHash % 10 === 0 ? 0.8 : 0.0),
    durationMs: (track.duration || 200) * 1000,
    releaseYear: track.releaseYear || (2010 + (absHash % 16)),
    popularity: track.popularity || (30 + (absHash % 70)),
    playCount: track.playCount || 0,
    lastPlayedAt: track.lastPlayedAt || null,
    likedAt: track.likedAt || null,
    addedToLibraryAt: track.addedToLibraryAt || null,
    thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  };
};

export interface UserProfile {
  topGenres: Record<string, number>;      // genre → affinity score (0–1)
  topArtists: Record<string, number>;     // artistId → affinity score
  avgTempo: number;
  avgEnergy: number;
  avgValence: number;
  avgDanceability: number;
  totalPlayTime: number;                  // ms
  sessionCount: number;
  lastUpdated: number;                    // Date.now()
}

export interface ListenEvent {
  trackId: string;
  startedAt: number;
  durationListenedMs: number;            // how long actually listened
  completionRate: number;                // 0.0–1.0 (skipped at 0.1, full play = ~0.95+)
  context: "search" | "recommendation" | "library" | "queue" | "speeddial";
  likedDuring: boolean;
  skipped: boolean;
}

export interface RecommendationResult {
  track: Track;
  score: number;             // 0.0–1.0, higher = stronger recommendation
  reason: RecommendationReason;
}

export type RecommendationReason =
  | "similar_to_liked"
  | "same_artist"
  | "same_genre"
  | "trending_in_genre"
  | "mood_match"
  | "tempo_match"
  | "discovery"
  | "recently_played_artist"
  | "speed_dial_affinity"
  | "completion_rate_signal";

export type MoodKey =
  | "energizing"
  | "focus"
  | "workout"
  | "party"
  | "relaxing"
  | "sad"
  | "romance"
  | "commute";
