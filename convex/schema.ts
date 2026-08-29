import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table — stores auth credentials with hashed passwords
  users: defineTable({
    email: v.string(),
    username: v.string(),
    passwordHash: v.string(),          // bcrypt hash stored server-side
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // User sessions — JWT-like session tokens
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Liked songs — per user
  likedSongs: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    album: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    likedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_track", ["userId", "trackId"]),

  // User playlists
  playlists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    trackIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Listen history — track what user listens to
  listenHistory: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnail: v.optional(v.string()),
    listenedAt: v.number(),
    durationListenedMs: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "listenedAt"]),

  // Search history — per user
  searchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    searchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "searchedAt"]),
});
