import { useState } from "react";
import libraryStore from "../store/libraryStore";

export type ImportState = "idle" | "loading" | "preview" | "error" | "saving" | "saved";

export interface ImportError {
  message: string;
  code: string;
}

export interface ImportResult {
  platform: "youtube_music" | "spotify";
  playlistId: string;
  title: string;
  description: string;
  artwork: string;
  owner: string;
  trackCount: number;
  tracks: any[];
}

/**
 * usePlaylistImport
 *
 * Manages the full import state machine:
 * "idle" → "loading" → "preview" | "error"
 *
 * Returns:
 * - state: ImportState
 * - importResult: ImportResult | null
 * - error: { message, code } | null
 * - startImport(url): triggers fetch to backend
 * - confirmImport(playlistName): saves to library
 * - reset(): back to idle
 */
export const usePlaylistImport = () => {
  const [state, setState] = useState<ImportState>("idle");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<ImportError | null>(null);

  const startImport = async (url: string): Promise<void> => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/import/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.error, code: data.code });
        setState("error");
        return;
      }
      setImportResult(data);
      setState("preview");
    } catch (err) {
      setError({ message: "Connection failed. Check your internet.", code: "NETWORK_ERROR" });
      setState("error");
    }
  };

  /**
   * confirmImport
   * Saves the imported tracks as a new playlist in the user's library.
   * Uses the existing playlist store / library management system.
   */
  const confirmImport = async (playlistName: string): Promise<void> => {
    if (!importResult) return;
    setState("saving");
    try {
      await libraryStore.createPlaylist({
        name:        playlistName,
        tracks:      importResult.tracks,
        artwork:     importResult.artwork,
        description: importResult.description,
        source:      importResult.platform,
        importedAt:  Date.now(),
      });
      setState("saved");
    } catch (err) {
      setError({ message: "Failed to save playlist. Try again.", code: "SAVE_FAILED" });
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setImportResult(null);
    setError(null);
  };

  return { state, importResult, error, startImport, confirmImport, reset };
};
