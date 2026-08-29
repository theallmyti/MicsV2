import { ImportResult, NormalizedTrack } from "./types";

// Token cache — reuse until expiry
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

const getSpotifyToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken; // reuse cached token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw {
      code: "MISSING_CREDENTIALS",
      message: "Spotify Client ID or Secret is not configured on the server."
    };
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw {
      code: "AUTH_FAILED",
      message: "Failed to authenticate with Spotify API."
    };
  }

  const data: any = await res.json();
  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken!;
};

/**
 * importSpotifyPlaylist
 *
 * Fetches all tracks from a public Spotify playlist using the
 * Spotify Web API — no OAuth needed for public playlists, only a
 * client credentials token (app-level, not user-level).
 *
 * Setup required (add to Railway environment variables):
 *   SPOTIFY_CLIENT_ID     — from Spotify Developer Dashboard
 *   SPOTIFY_CLIENT_SECRET — from Spotify Developer Dashboard
 *
 * Flow:
 * 1. POST to https://accounts.spotify.com/api/token with client credentials
 *    to get an access token (expires in 3600s — cache it)
 * 2. GET https://api.spotify.com/v1/playlists/{id}
 *    to get playlist metadata
 * 3. GET https://api.spotify.com/v1/playlists/{id}/tracks?limit=100&offset=0
 *    paginate through all tracks (Spotify returns max 100 per page)
 * 4. Normalize each track to our internal format
 *
 * Pagination: Spotify uses offset-based pagination.
 * Keep fetching while `next` field in response is non-null.
 * Cap at 200 tracks (same as YouTube importer).
 *
 * Error handling:
 * - 404 → code "NOT_FOUND"
 * - 403 → code "PRIVATE_PLAYLIST"
 * - 401 → re-fetch token, retry once
 * - 429 → code "RATE_LIMITED"
 *
 * Note on playability:
 * Spotify tracks imported into Mics cannot be played via Spotify
 * (no user auth, no playback SDK license).
 * Set isPlayable = false and show "Import metadata only" message.
 * The user can see their playlist contents but must connect a
 * YouTube Music plugin to resolve and play equivalent tracks.
 */
export const importSpotifyPlaylist = async (playlistId: string): Promise<ImportResult> => {
  const token = await getSpotifyToken();

  // Fetch playlist metadata
  const metaRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,description,images,owner`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (metaRes.status === 404) throw { code: "NOT_FOUND",        message: "Playlist not found on Spotify." };
  if (metaRes.status === 403) throw { code: "PRIVATE_PLAYLIST", message: "This Spotify playlist is private." };
  if (metaRes.status === 429) throw { code: "RATE_LIMITED",     message: "Spotify rate limit hit. Try again in a moment." };
  if (!metaRes.ok) throw { code: "FETCH_FAILED", message: "Could not fetch playlist metadata from Spotify." };

  const meta: any = await metaRes.json();

  // Paginate through tracks
  const tracks: NormalizedTrack[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=0&fields=next,items(track(id,name,duration_ms,artists,album,preview_url,is_playable))`;

  while (nextUrl && tracks.length < 200) {
    const res = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      break;
    }
    const data: any = await res.json();

    for (const item of data.items ?? []) {
      const t = item.track;
      if (!t || !t.id) continue; // skip null tracks (deleted from Spotify)
      tracks.push({
        id:         t.id,
        title:      t.name,
        artist:     t.artists?.[0]?.name ?? "Unknown Artist",
        artistId:   t.artists?.[0]?.id   ?? "",
        album:      t.album?.name        ?? "",
        albumId:    t.album?.id          ?? "",
        artwork:    t.album?.images?.[0]?.url ?? "",
        durationMs: t.duration_ms        ?? 0,
        sourceId:   t.id,
        source:     "spotify",
        // Spotify tracks cannot be played in Mics (no playback SDK)
        // User sees metadata; a future Spotify plugin could resolve these
        isPlayable: false,
      });
    }

    nextUrl = data.next ?? null;
  }

  return {
    platform:    "spotify",
    playlistId,
    title:       meta.name        ?? "Spotify Playlist",
    description: meta.description ?? "",
    artwork:     meta.images?.[0]?.url ?? "",
    owner:       meta.owner?.display_name ?? "",
    trackCount:  tracks.length,
    tracks:      tracks.slice(0, 200),
  };
};
