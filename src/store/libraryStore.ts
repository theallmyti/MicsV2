export interface Playlist {
  id: string;
  name: string;
  tracks: any[];
  artwork: string | null;
  description: string;
  source: "user" | "youtube_music" | "spotify";
  importedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePlaylistParams {
  name: string;
  tracks?: any[];
  artwork?: string | null;
  description?: string;
  source?: "user" | "youtube_music" | "spotify";
  importedAt?: number | null;
}

export class LibraryStore {
  private playlists: Playlist[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("mics_playlists");
    if (saved) {
      try {
        this.playlists = JSON.parse(saved);
      } catch (e) {
        this.playlists = [];
      }
    } else {
      this.playlists = [];
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    localStorage.setItem("mics_playlists", JSON.stringify(this.playlists));
  }

  public getPlaylists(): Playlist[] {
    return this.playlists;
  }

  public getPlaylist(id: string): Playlist | undefined {
    return this.playlists.find(p => p.id === id);
  }

  /**
   * createPlaylist
   *
   * Creates a new playlist in the user's library.
   * Works for both blank playlists and imported playlists.
   *
   * For imported playlists:
   * - Saves all track metadata to the playlist
   * - Marks Spotify tracks as isPlayable: false
   * - Persists to localStorage under "mics_playlists"
   * - Triggers a library UI refresh via subscription
   *
   * @param params.name        — playlist display name
   * @param params.tracks      — array of tracks (empty for blank playlist)
   * @param params.artwork     — cover art URL (null for blank)
   * @param params.description — optional description
   * @param params.source      — "user" | "youtube_music" | "spotify"
   * @param params.importedAt  — timestamp of import (null for user-created)
   */
  public createPlaylist(params: CreatePlaylistParams): Playlist {
    const playlist: Playlist = {
      id:          crypto.randomUUID(),
      name:        params.name,
      tracks:      params.tracks ?? [],
      artwork:     params.artwork ?? null,
      description: params.description ?? "",
      source:      params.source ?? "user",
      importedAt:  params.importedAt ?? null,
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    };
    this.playlists.push(playlist);
    this.persist();
    this.notify();
    return playlist;
  }

  public deletePlaylist(id: string) {
    this.playlists = this.playlists.filter(p => p.id !== id);
    this.persist();
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const libraryStore = new LibraryStore();
export default libraryStore;
