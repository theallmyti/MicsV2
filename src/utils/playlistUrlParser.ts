/**
 * parsePlaylistUrl (frontend)
 * Identical logic to the backend version.
 * Used for instant URL validation in the import modal.
 * Returns { platform, playlistId } or null.
 */
export type Platform = "youtube_music" | "spotify";
export interface ParsedUrl { platform: Platform; playlistId: string; }

export const parsePlaylistUrl = (url: string): ParsedUrl | null => {
  url = url.trim();
  const ytMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (ytMatch && url.includes("youtube")) {
    return { platform: "youtube_music", playlistId: ytMatch[1] };
  }
  const spMatch = url.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (spMatch) return { platform: "spotify", playlistId: spMatch[1] };
  const spUri   = url.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (spUri)   return { platform: "spotify", playlistId: spUri[1] };
  return null;
};

/**
 * getPlatformLabel
 * Returns display name for the platform.
 */
export const getPlatformLabel = (platform: Platform): string => ({
  youtube_music: "YouTube Music",
  spotify:       "Spotify",
}[platform]);
