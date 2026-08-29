/**
 * parsePlaylistUrl
 *
 * Detects the platform and extracts the playlist ID from any URL format.
 * Returns null if URL is not a recognized playlist URL.
 *
 * YouTube Music URL formats:
 *   https://music.youtube.com/playlist?list=PLxxxxxxxx
 *   https://www.youtube.com/playlist?list=PLxxxxxxxx
 *   https://youtu.be/... (not a playlist — reject)
 *
 * Spotify URL formats:
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xxxxx
 *   spotify:playlist:37i9dQZF1DXcBWIGoYBM5M (URI format)
 *
 * Returns:
 *   { platform: "youtube_music" | "spotify", playlistId: string } | null
 */

export interface ParsedUrl {
  platform: "youtube_music" | "spotify";
  playlistId: string;
}

export const parsePlaylistUrl = (url: string): ParsedUrl | null => {
  url = url.trim();

  // YouTube Music / YouTube
  const ytMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (ytMatch && (url.includes("youtube.com") || url.includes("music.youtube.com"))) {
    return { platform: "youtube_music", playlistId: ytMatch[1] };
  }

  // Spotify web URL
  const spMatch = url.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (spMatch) {
    return { platform: "spotify", playlistId: spMatch[1] };
  }

  // Spotify URI
  const spUri = url.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (spUri) {
    return { platform: "spotify", playlistId: spUri[1] };
  }

  return null; // unrecognized
};
