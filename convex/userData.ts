import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────
// Helper: validate session and return userId
// ─────────────────────────────────────────────────────────────────
async function requireAuth(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized – please log in");
  }
  return session.userId;
}

// ─────────────────────────────────────────────────────────────────
// Liked Songs
// ─────────────────────────────────────────────────────────────────

export const getLikedSongs = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return [];

    return await ctx.db
      .query("likedSongs")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc")
      .collect();
  },
});

export const toggleLike = mutation({
  args: {
    token: v.string(),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    album: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args.token);

    const existing = await ctx.db
      .query("likedSongs")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", userId).eq("trackId", args.trackId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("likedSongs", {
        userId,
        trackId: args.trackId,
        title: args.title,
        artist: args.artist,
        album: args.album,
        thumbnail: args.thumbnail,
        durationMs: args.durationMs,
        likedAt: Date.now(),
      });
      return { liked: true };
    }
  },
});

export const isTrackLiked = query({
  args: { token: v.string(), trackId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return false;

    const existing = await ctx.db
      .query("likedSongs")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", session.userId).eq("trackId", args.trackId)
      )
      .unique();

    return !!existing;
  },
});

// ─────────────────────────────────────────────────────────────────
// Listen History
// ─────────────────────────────────────────────────────────────────

export const recordListen = mutation({
  args: {
    token: v.string(),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnail: v.optional(v.string()),
    durationListenedMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args.token);

    await ctx.db.insert("listenHistory", {
      userId,
      trackId: args.trackId,
      title: args.title,
      artist: args.artist,
      thumbnail: args.thumbnail,
      listenedAt: Date.now(),
      durationListenedMs: args.durationListenedMs,
    });
  },
});

export const getListenHistory = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return [];

    const limit = args.limit ?? 50;
    return await ctx.db
      .query("listenHistory")
      .withIndex("by_user_time", (q) => q.eq("userId", session.userId))
      .order("desc")
      .take(limit);
  },
});

// ─────────────────────────────────────────────────────────────────
// Search History
// ─────────────────────────────────────────────────────────────────

export const saveSearch = mutation({
  args: { token: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return;
    const userId = await requireAuth(ctx, args.token);

    await ctx.db.insert("searchHistory", {
      userId,
      query: args.query.trim(),
      searchedAt: Date.now(),
    });
  },
});

export const getSearchHistory = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return [];

    return await ctx.db
      .query("searchHistory")
      .withIndex("by_user_time", (q) => q.eq("userId", session.userId))
      .order("desc")
      .take(20);
  },
});

// ─────────────────────────────────────────────────────────────────
// Playlists
// ─────────────────────────────────────────────────────────────────

export const getPlaylists = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return [];

    return await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc")
      .collect();
  },
});

export const createPlaylist = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args.token);
    const now = Date.now();

    return await ctx.db.insert("playlists", {
      userId,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic ?? false,
      trackIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addTrackToPlaylist = mutation({
  args: {
    token: v.string(),
    playlistId: v.id("playlists"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args.token);
    const playlist = await ctx.db.get(args.playlistId);

    if (!playlist || playlist.userId.toString() !== userId.toString()) {
      throw new Error("Playlist not found or unauthorized");
    }

    if (!playlist.trackIds.includes(args.trackId)) {
      await ctx.db.patch(args.playlistId, {
        trackIds: [...playlist.trackIds, args.trackId],
        updatedAt: Date.now(),
      });
    }
  },
});
