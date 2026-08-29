/**
 * @file useRecommendations.ts
 * @description React hook that provides recommendation feeds to UI components.
 * Memoizes results to optimize rendering, re-evaluating when catalog or listen events update.
 */

import { useState, useEffect, useMemo } from "react";
import type { Track, UserProfile, ListenEvent, MoodKey } from "./types.ts";
import { getListenHistory } from "./listenStore.ts";
import {
  getMixedForYou,
  getQuickPicks,
  getDiscoveryRecommendations,
  getForgottenFavorites,
  getMoodMatch,
  getSimilarTo,
  getListenersAlsoLike,
  getAutoplayNext
} from "./engine.ts";

const PROFILE_KEY = "mics_user_profile_v2";

/**
 * useRecommendations Hook
 * Subscribes to localStorage listen history and profile triggers, returning recommendation arrays.
 * @param catalog - Array of Track items representing Mics active catalog
 * @returns recommendation surfaces and generator helper methods
 */
export const useRecommendations = (catalog: Track[]) => {
  const [listenHistory, setListenHistory] = useState<ListenEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Sync state from localStorage on load and on window focus/storage events
  const syncStore = () => {
    if (typeof window === "undefined") return;

    setListenHistory(getListenHistory());

    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.warn("Failed to parse user profile in hook:", e);
      }
    } else {
      // Default blank user profile if not initialized yet
      setProfile({
        topGenres: {},
        topArtists: {},
        avgTempo: 120,
        avgEnergy: 0.5,
        avgValence: 0.5,
        avgDanceability: 0.5,
        totalPlayTime: 0,
        sessionCount: 0,
        lastUpdated: Date.now()
      });
    }
  };

  useEffect(() => {
    syncStore();

    // Listen to storage changes across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY || e.key === "mics_listen_history_v2") {
        syncStore();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncStore);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncStore);
    };
  }, []);

  // Expose a function to manually trigger a sync (useful after recording an event)
  const refreshRecommendations = () => {
    syncStore();
  };

  // 1. "Mixed for you" feed recommendation list
  const mixedForYou = useMemo(() => {
    if (!profile) return [];
    return getMixedForYou(catalog, profile, listenHistory, 20).map(r => r.track);
  }, [catalog, profile, listenHistory]);

  // 2. "Quick Picks" (Speed Dial context recommendations)
  const quickPicks = useMemo(() => {
    // Extract speed dial IDs from local storage if available
    let speedDialIds: string[] = [];
    const saved = localStorage.getItem("mics_speed_dial_v2");
    if (saved) {
      try {
        speedDialIds = JSON.parse(saved).map((item: { id: string }) => item.id);
      } catch (e) {}
    }
    return getQuickPicks(catalog, listenHistory, speedDialIds, Date.now()).map(r => r.track);
  }, [catalog, listenHistory]);

  // 3. "Forgotten Favorites"
  const forgottenFavorites = useMemo(() => {
    return getForgottenFavorites(catalog, listenHistory).map(r => r.track);
  }, [catalog, listenHistory]);

  // 4. "Discovery" releases list
  const discoveryPicks = useMemo(() => {
    if (!profile) return [];
    return getDiscoveryRecommendations(catalog, profile, listenHistory, 10).map(r => r.track);
  }, [catalog, profile, listenHistory]);

  // Helper generators that run on-demand in component views
  const getMoodMatchList = (mood: MoodKey, count = 20) => {
    if (!profile) return [];
    return getMoodMatch(mood, catalog, profile, count).map(r => r.track);
  };

  const getSimilarToTrackList = (seedTrack: Track, count = 10) => {
    return getSimilarTo(seedTrack, catalog, listenHistory, count).map(r => r.track);
  };

  const getListenersAlsoLikeList = (artistId: string, count = 8) => {
    return getListenersAlsoLike(artistId, catalog, count).map(r => r.track);
  };

  const getAutoplayNextQueue = (recentSeeds: Track[], count = 5) => {
    return getAutoplayNext(recentSeeds, catalog, listenHistory, count).map(r => r.track);
  };

  return {
    profile,
    listenHistory,
    mixedForYou,
    quickPicks,
    forgottenFavorites,
    discoveryPicks,
    getMoodMatch: getMoodMatchList,
    getSimilarTo: getSimilarToTrackList,
    getListenersAlsoLike: getListenersAlsoLikeList,
    getAutoplayNext: getAutoplayNextQueue,
    refreshRecommendations
  };
};
