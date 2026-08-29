/**
 * @file engine.ts
 * @description Main recommendation engine. All functions are pure, deterministic, and self-contained.
 * Exposes algorithms for Home Feed, Seeds, Quick Picks, Discovery, Forgotten Favorites, Moods, and Autoplay queues.
 */

import type { Track, UserProfile, ListenEvent, RecommendationResult, MoodKey } from "./types.ts";
import { computeTrackSimilarity, computeAudioSimilarity } from "./similarity.ts";
import { 
  scoreGenreAffinity, 
  scoreArtistAffinity, 
  scoreAudioFeatureMatch, 
  computeFreshnessFactor, 
  computeNoveltyBonus, 
  computeTimeOfDayAffinity, 
  applyDiversityFilter 
} from "./scoring.ts";

/**
 * ALGORITHM 1 — "Mixed for you" / Home Feed Recommendations
 * Scores catalog tracks against the UserProfile, penalizing recent plays and capping artist repetitions.
 */
export const getMixedForYou = (
  catalog: Track[],
  profile: UserProfile,
  listenHistory: ListenEvent[],
  count = 20
): RecommendationResult[] => {
  // Map trackId to most recent timestamp
  const historyMap = new Map<string, number>();
  listenHistory.forEach(event => {
    const prev = historyMap.get(event.trackId) ?? 0;
    historyMap.set(event.trackId, Math.max(prev, event.startedAt));
  });

  const results: RecommendationResult[] = catalog.map(track => {
    const genreScore = scoreGenreAffinity(track, profile) * 0.35;
    const artistScore = scoreArtistAffinity(track, profile) * 0.25;
    const audioScore = scoreAudioFeatureMatch(track, profile) * 0.25;
    const popularityScore = ((track.popularity ?? 50) / 100) * 0.10;
    const noveltyScore = computeNoveltyBonus(track, historyMap) * 0.05;

    let baseScore = genreScore + artistScore + audioScore + popularityScore + noveltyScore;

    // Apply freshness decay (e.g. tracks played recently score lower to encourage freshness)
    const freshnessFactor = computeFreshnessFactor(track, historyMap);
    baseScore *= freshnessFactor;

    return {
      track,
      score: Math.max(0, Math.min(1.0, baseScore)),
      reason: "similar_to_liked" as const
    };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply diversity pass to limit repetitions from a single artist
  return applyDiversityFilter(results, 2).slice(0, count);
};

/**
 * ALGORITHM 2 — "Because you liked [Track]" (seed-based)
 * Finds other tracks in the catalog that are highly similar to a chosen seed song.
 */
export const getSimilarTo = (
  seedTrack: Track,
  catalog: Track[],
  listenHistory: ListenEvent[],
  count = 10
): RecommendationResult[] => {
  const historyMap = new Map<string, number>();
  listenHistory.forEach(event => {
    const prev = historyMap.get(event.trackId) ?? 0;
    historyMap.set(event.trackId, Math.max(prev, event.startedAt));
  });

  const results: RecommendationResult[] = catalog
    .filter(track => track.id !== seedTrack.id)
    .map(track => {
      let score = computeTrackSimilarity(seedTrack, track);

      // Boost same artist
      const isSameArtist = track.artistId && seedTrack.artistId 
        ? track.artistId === seedTrack.artistId 
        : track.artist.toLowerCase() === seedTrack.artist.toLowerCase();
      if (isSameArtist) {
        score += 0.15;
      }

      // Freshness decay
      const freshnessFactor = computeFreshnessFactor(track, historyMap);
      score *= freshnessFactor;

      return {
        track,
        score: Math.max(0, Math.min(1.0, score)),
        reason: (isSameArtist ? "same_artist" : "similar_to_liked") as any
      };
    });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
};

/**
 * ALGORITHM 3 — "Quick Picks" (Speed Dial context recommendations)
 * Recommends tracks based on play count, recency, time of day, excluding current speed dial items.
 */
export const getQuickPicks = (
  catalog: Track[],
  listenHistory: ListenEvent[],
  speedDialIds: string[],
  nowMs = Date.now()
): RecommendationResult[] => {
  const speedDialSet = new Set(speedDialIds);
  const hour = new Date(nowMs).getHours();

  // Compute a recency-weighted frequency play score for each track
  const trackPlayScores = new Map<string, number>();
  listenHistory.forEach(event => {
    const daysSincePlay = (nowMs - event.startedAt) / (1000 * 60 * 60 * 24);
    const weight = 1 / (Math.max(0, daysSincePlay) + 1);
    const eventScore = (event.completionRate ?? 1) * weight;

    const current = trackPlayScores.get(event.trackId) ?? 0;
    trackPlayScores.set(event.trackId, current + eventScore);
  });

  const results: RecommendationResult[] = catalog.map(track => {
    const playScore = Math.min(0.6, (trackPlayScores.get(track.id) ?? 0) / 10);
    const timeOfDayScore = computeTimeOfDayAffinity(track, hour) * 0.4;
    
    let score = playScore + timeOfDayScore;

    // Penalty for tracks already pinned in speed dial to avoid redundancy
    if (speedDialSet.has(track.id)) {
      score -= 0.25;
    }

    return {
      track,
      score: Math.max(0.01, Math.min(1.0, score)),
      reason: "speed_dial_affinity" as const
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 8);
};

/**
 * ALGORITHM 4 — "Discover" (New releases personalized exploration)
 * Surfaces tracks released recently that user hasn't heard, enforcing genre diversity.
 */
export const getDiscoveryRecommendations = (
  catalog: Track[],
  profile: UserProfile,
  listenHistory: ListenEvent[],
  count = 10
): RecommendationResult[] => {
  const playedSet = new Set(listenHistory.map(h => h.trackId));
  const currentYear = new Date().getFullYear();

  // Filter to tracks released in the last 2 years (since catalog might have older years)
  const recentTracks = catalog.filter(track => {
    return !playedSet.has(track.id) && (track.releaseYear >= currentYear - 2);
  });

  const results: RecommendationResult[] = recentTracks.map(track => {
    const genreScore = scoreGenreAffinity(track, profile) * 0.4;
    const audioScore = scoreAudioFeatureMatch(track, profile) * 0.4;
    const popularityScore = ((track.popularity ?? 50) / 100) * 0.2;

    const score = genreScore + audioScore + popularityScore;

    return {
      track,
      score: Math.max(0, Math.min(1.0, score)),
      reason: "discovery" as const
    };
  });

  results.sort((a, b) => b.score - a.score);

  // Filter for genre diversity: max 1 track per primary genre
  const seenGenres = new Set<string>();
  const diverseResults: RecommendationResult[] = [];

  for (const res of results) {
    const primaryGenre = res.track.genres?.[0] || "unknown";
    if (!seenGenres.has(primaryGenre)) {
      seenGenres.add(primaryGenre);
      diverseResults.push(res);
    }
    if (diverseResults.length >= count) break;
  }

  // Fallback if not enough diverse items
  if (diverseResults.length < count) {
    for (const res of results) {
      if (!diverseResults.some(d => d.track.id === res.track.id)) {
        diverseResults.push(res);
      }
      if (diverseResults.length >= count) break;
    }
  }

  return diverseResults;
};

/**
 * ALGORITHM 5 — "Forgotten Favorites"
 * Identifies songs the user liked or listened to fully in the past, but hasn't played recently.
 */
export const getForgottenFavorites = (
  catalog: Track[],
  listenHistory: ListenEvent[]
): RecommendationResult[] => {
  const now = Date.now();
  const historyMap = new Map<string, number>(); // trackId -> last played timestamp
  const completionRates = new Map<string, number[]>(); // trackId -> completion rates

  listenHistory.forEach(event => {
    const prev = historyMap.get(event.trackId) ?? 0;
    historyMap.set(event.trackId, Math.max(prev, event.startedAt));

    const rates = completionRates.get(event.trackId) ?? [];
    rates.push(event.completionRate);
    completionRates.set(event.trackId, rates);
  });

  const favorites = catalog.filter(track => {
    const lastPlayed = historyMap.get(track.id) ?? 0;
    const daysSincePlay = (now - lastPlayed) / (1000 * 60 * 60 * 24);

    // Track has been played in the past, but NOT in the last 30 days
    const notPlayedRecently = lastPlayed > 0 && daysSincePlay >= 30;

    // Check if liked or has average completion rate >= 0.8
    const isLiked = track.likedAt !== null;
    const rates = completionRates.get(track.id) ?? [];
    const avgCompletion = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
    
    return notPlayedRecently && (isLiked || avgCompletion >= 0.8);
  });

  const results: RecommendationResult[] = favorites.map(track => {
    const rates = completionRates.get(track.id) ?? [];
    const maxCompletion = rates.length > 0 ? Math.max(...rates) : 1.0;
    const score = (track.likedAt !== null ? 0.9 : 0.6) * maxCompletion;

    return {
      track,
      score,
      reason: "completion_rate_signal" as const
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
};

// Ideal profiles for user moods
const moodProfiles: Record<MoodKey, { energy: number; valence: number; tempo: number; danceability?: number; acousticness?: number; instrumentalness?: number }> = {
  energizing: { energy: 0.85, valence: 0.7, tempo: 130 },
  focus:      { energy: 0.45, valence: 0.5, tempo: 95, instrumentalness: 0.6 },
  workout:    { energy: 0.90, valence: 0.6, tempo: 140, danceability: 0.7 },
  party:      { energy: 0.75, valence: 0.75, tempo: 124, danceability: 0.8 },
  relaxing:   { energy: 0.30, valence: 0.4, tempo: 85, acousticness: 0.5 },
  sad:        { energy: 0.35, valence: 0.2, tempo: 80 },
  romance:    { energy: 0.45, valence: 0.55, tempo: 90, acousticness: 0.4 },
  commute:    { energy: 0.65, valence: 0.5, tempo: 110, danceability: 0.6 }
};

/**
 * ALGORITHM 6 — "Mood Match"
 * Filters and scores tracks based on distance to specific audio energy/tempo profiles.
 */
export const getMoodMatch = (
  mood: MoodKey,
  catalog: Track[],
  profile: UserProfile,
  count = 20
): RecommendationResult[] => {
  const target = moodProfiles[mood];
  if (!target) return [];

  const results: RecommendationResult[] = catalog.map(track => {
    // Euclidean distance in audio features space
    const dEnergy = (track.energy ?? 0.5) - target.energy;
    const dValence = (track.valence ?? 0.5) - target.valence;
    const dTempo = ((track.tempo ?? 120) - target.tempo) / 100;
    
    let sumSq = dEnergy * dEnergy + dValence * dValence + dTempo * dTempo;

    if (target.danceability !== undefined) {
      const dDance = (track.danceability ?? 0.5) - target.danceability;
      sumSq += dDance * dDance;
    }
    if (target.acousticness !== undefined) {
      const dAcoustic = (track.acousticness ?? 0.1) - target.acousticness;
      sumSq += dAcoustic * dAcoustic;
    }
    if (target.instrumentalness !== undefined) {
      const dInst = (track.instrumentalness ?? 0.0) - target.instrumentalness;
      sumSq += dInst * dInst;
    }

    const distance = Math.sqrt(sumSq);
    // Invert so closer distance translates to higher score
    const audioMatchScore = Math.max(0.01, 1 - distance);

    // Personalize results within mood: blend 70% mood feature match and 30% user profile genre match
    const genreScore = scoreGenreAffinity(track, profile);
    const finalScore = audioMatchScore * 0.70 + genreScore * 0.30;

    return {
      track,
      score: finalScore,
      reason: "mood_match" as const
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
};

/**
 * ALGORITHM 7 — Autoplay Queue (infinite radio mode)
 * Takes recent seeds and returns similar tracks, filtering out recent plays.
 */
export const getAutoplayNext = (
  recentSeeds: Track[],
  catalog: Track[],
  recentHistory: ListenEvent[],
  count = 5
): RecommendationResult[] => {
  if (recentSeeds.length === 0) return [];

  // Exclude tracks played in the last 2 hours
  const twoHoursAgo = Date.now() - 1000 * 60 * 60 * 2;
  const recentHistoryIds = new Set(
    recentHistory
      .filter(event => event.startedAt >= twoHoursAgo)
      .map(event => event.trackId)
  );

  const seedIds = new Set(recentSeeds.map(s => s.id));

  // Gather 5 candidate recommendations per seed track
  const candidatesMap = new Map<string, { track: Track; totalScore: number; count: number }>();

  recentSeeds.forEach(seed => {
    const similar = getSimilarTo(seed, catalog, [], 10);
    similar.forEach(res => {
      const cid = res.track.id;
      // Do not suggest the seeds themselves or recently played tracks
      if (seedIds.has(cid) || recentHistoryIds.has(cid)) return;

      const existing = candidatesMap.get(cid);
      if (existing) {
        existing.totalScore += res.score;
        existing.count += 1;
      } else {
        candidatesMap.set(cid, { track: res.track, totalScore: res.score, count: 1 });
      }
    });
  });

  const results: RecommendationResult[] = [];
  candidatesMap.forEach((val) => {
    // Score is average similarity across seeds
    const avgScore = val.totalScore / val.count;
    results.push({
      track: val.track,
      score: avgScore,
      reason: "recently_played_artist" as const
    });
  });

  results.sort((a, b) => b.score - a.score);
  
  // Apply diversity: max 2 tracks per artist
  return applyDiversityFilter(results, 2).slice(0, count);
};

/**
 * ALGORITHM 8 — "Listeners Also Like" (Artist / Album page)
 * Computes the artist fingerprint (average features) and scores other tracks by similarity.
 */
export const getListenersAlsoLike = (
  artistId: string,
  catalog: Track[],
  count = 8
): RecommendationResult[] => {
  const artistTracks = catalog.filter(track => track.artistId === artistId);
  if (artistTracks.length === 0) return [];

  // Compute average feature vector across all tracks by the artist (the artist fingerprint)
  let sumEnergy = 0;
  let sumValence = 0;
  let sumDance = 0;
  let sumAcoustic = 0;
  let sumInst = 0;
  let sumTempo = 0;

  artistTracks.forEach(track => {
    sumEnergy += track.energy ?? 0.5;
    sumValence += track.valence ?? 0.5;
    sumDance += track.danceability ?? 0.5;
    sumAcoustic += track.acousticness ?? 0.1;
    sumInst += track.instrumentalness ?? 0.0;
    sumTempo += track.tempo ?? 120;
  });

  const length = artistTracks.length;
  const artistFingerprint: Track = {
    id: "fingerprint",
    title: "fingerprint",
    artist: "fingerprint",
    artistId: "fingerprint",
    album: "fingerprint",
    albumId: "fingerprint",
    genres: artistTracks.flatMap(t => t.genres || []),
    tempo: sumTempo / length,
    energy: sumEnergy / length,
    valence: sumValence / length,
    danceability: sumDance / length,
    acousticness: sumAcoustic / length,
    instrumentalness: sumInst / length,
    durationMs: 0,
    releaseYear: 2024,
    popularity: 50,
    playCount: 0,
    lastPlayedAt: null,
    likedAt: null,
    addedToLibraryAt: null,
    thumbnail: ""
  };

  const results: RecommendationResult[] = catalog
    .filter(track => track.artistId !== artistId) // exclude tracks by the same artist
    .map(track => {
      const score = computeAudioSimilarity(artistFingerprint, track);
      return {
        track,
        score,
        reason: "trending_in_genre" as const
      };
    });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
};
