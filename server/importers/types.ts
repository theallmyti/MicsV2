export interface NormalizedTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  artwork: string;
  durationMs: number;
  sourceId: string;
  source: "youtube_music" | "spotify";
  isPlayable: boolean;
}

export interface ImportResult {
  platform: "youtube_music" | "spotify";
  playlistId: string;
  title: string;
  description: string;
  artwork: string;
  owner: string;
  trackCount: number;
  tracks: NormalizedTrack[];
}
