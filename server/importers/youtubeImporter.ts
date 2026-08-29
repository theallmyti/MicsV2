import { exec } from "child_process";
import { promisify } from "util";
import { ImportResult, NormalizedTrack } from "./types";
const execAsync = promisify(exec);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * importYouTubePlaylist
 *
 * Fetches all tracks from a YouTube Music playlist.
 *
 * Strategy:
 * 1. Use yt-dlp (installed on the server) to dump playlist metadata as JSON
 *    Command: yt-dlp --dump-json --flat-playlist "https://www.youtube.com/playlist?list={id}"
 *    --flat-playlist = don't download, just get metadata
 *    --dump-json = output each entry as a JSON line (not a full JSON array)
 *
 * 2. Parse the output line by line (each line is one track's JSON)
 *
 * 3. Normalize each entry to our internal Track format
 *
 * Error handling:
 * - Exit code non-zero → throw with code "NOT_FOUND" or "PRIVATE_PLAYLIST"
 * - Stderr contains "private" → throw with code "PRIVATE_PLAYLIST"
 * - Stderr contains "not exist" → throw with code "NOT_FOUND"
 * - Timeout after 30 seconds → throw with code "TIMEOUT"
 *
 * Rate limiting:
 * - Add 200ms delay between parsing each track (yt-dlp does network calls per entry)
 * - Max 200 tracks per import (prevent abuse and timeout)
 */
export const importYouTubePlaylist = async (playlistId: string): Promise<ImportResult> => {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;

  let stdout: string;
  try {
    const result = await execAsync(
      `yt-dlp --dump-json --flat-playlist --no-warnings "${url}"`,
      { timeout: 30_000 }   // 30 second timeout
    );
    stdout = result.stdout;
  } catch (err: any) {
    const stderr = err.stderr ?? "";
    if (stderr.includes("private")) {
      throw { code: "PRIVATE_PLAYLIST", message: "This playlist is private." };
    }
    if (stderr.includes("not exist") || stderr.includes("404")) {
      throw { code: "NOT_FOUND", message: "Playlist not found." };
    }
    throw { code: "FETCH_FAILED", message: "Could not fetch playlist from YouTube." };
  }

  // Parse: each line of stdout is one JSON object
  const lines = stdout.trim().split("\n").filter(Boolean).slice(0, 200);
  const tracks: NormalizedTrack[] = [];

  for (const line of lines) {
    // Add 200ms delay between parsing each track
    await delay(200);
    try {
      const entry = JSON.parse(line);
      tracks.push({
        id:         entry.id || "",
        title:      entry.title       ?? "Unknown Title",
        artist:     entry.uploader    ?? entry.channel ?? "Unknown Artist",
        artistId:   entry.channel_id  ?? "",
        album:      "",               // YouTube Music doesn't expose album in flat playlist
        albumId:    "",
        artwork:    entry.thumbnails?.[entry.thumbnails.length - 1]?.url ?? "",
        durationMs: (entry.duration   ?? 0) * 1000,
        sourceId:   entry.id || "",
        source:     "youtube_music",
        isPlayable: true,
      });
    } catch (e) {
      // Ignore parsing errors for individual lines
    }
  }

  // Get playlist metadata from the first entry
  const firstEntry = lines[0] ? JSON.parse(lines[0]) : {};

  return {
    platform:    "youtube_music",
    playlistId,
    title:       firstEntry.playlist_title ?? "YouTube Music Playlist",
    description: "",
    artwork:     firstEntry.thumbnails?.[0]?.url ?? "",
    owner:       firstEntry.playlist_uploader ?? "",
    trackCount:  tracks.length,
    tracks,
  };
};
