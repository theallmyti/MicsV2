/**
 * @file useListenHistory.ts
 * @description React hook that exposes reactive listen history views and derived states to UI layers.
 */

import { useState, useEffect, useMemo } from "react";
import type { TrackSummary, ListeningProfile } from "./types";
import { historyStore } from "./store";
import { getListenAgainTracks, getListenAgainAlbums } from "./listenAgain";
import { getSectionInfluenceParams } from "./homeInfluence";

/**
 * useListenHistory Hook
 * Listens to historyStore updates, memoizes lists, and computes profile-aware metrics.
 */
export const useListenHistory = () => {
  const [summaries, setSummaries] = useState<TrackSummary[]>(() =>
    historyStore.getSummaries()
  );
  const [profile, setProfile] = useState<ListeningProfile | null>(() =>
    historyStore.getProfile()
  );

  // Sync state when store notifies updates
  useEffect(() => {
    const unsubscribe = historyStore.subscribe(() => {
      setSummaries(historyStore.getSummaries());
      setProfile(historyStore.getProfile());
    });
    return unsubscribe;
  }, []);

  const listenAgainTracks = useMemo(() =>
    getListenAgainTracks(summaries), [summaries]
  );

  const listenAgainAlbums = useMemo(() =>
    getListenAgainAlbums(summaries), [summaries]
  );

  const influenceParams = useMemo(() =>
    profile ? getSectionInfluenceParams(profile, summaries) : null,
    [profile, summaries]
  );

  const summaryMap = useMemo(() =>
    new Map(summaries.map(s => [s.trackId, s])), [summaries]
  );

  const recentlyPlayedIds = useMemo(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000; // 2 hours
    return new Set(
      summaries.filter(s => s.lastPlayedAt >= cutoff).map(s => s.trackId)
    );
  }, [summaries]);

  return {
    listenAgainTracks,
    listenAgainAlbums,
    influenceParams,
    profile,
    totalTracksHeard: summaries.length,
    hasEnoughHistory: summaries.length >= 10,
    recentlyPlayedIds,
    isTrackPlayed: (id: string) => summaryMap.has(id),
    getTrackAffinity: (id: string) => summaryMap.get(id)?.affinityScore ?? 0,
  };
};
