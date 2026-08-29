import express from "express";
import { parsePlaylistUrl }      from "../importers/urlParser";
import { importYouTubePlaylist } from "../importers/youtubeImporter";
import { importSpotifyPlaylist } from "../importers/spotifyImporter";

const router = express.Router();

/**
 * POST /api/import/playlist
 * Body: { url: string }
 *
 * 1. Validate URL
 * 2. Detect platform
 * 3. Import from correct importer
 * 4. Return normalized playlist + tracks
 */
router.post("/playlist", async (req, res): Promise<any> => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required.", code: "MISSING_URL" });
  }

  const parsed = parsePlaylistUrl(url);
  if (!parsed) {
    return res.status(400).json({
      error: "That doesn't look like a YouTube Music or Spotify playlist URL. Check the link and try again.",
      code: "INVALID_URL",
    });
  }

  try {
    let result;
    if (parsed.platform === "youtube_music") {
      result = await importYouTubePlaylist(parsed.playlistId);
    } else {
      result = await importSpotifyPlaylist(parsed.playlistId);
    }
    return res.json(result);
  } catch (err: any) {
    const code    = err.code    ?? "UNKNOWN_ERROR";
    const message = err.message ?? "Something went wrong. Please try again.";
    return res.status(500).json({ error: message, code });
  }
});

export default router;
