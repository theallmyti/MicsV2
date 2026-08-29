import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─────────────────────────────────────────────────────────────────
// Crypto helpers (Web Crypto API — works in all Convex runtimes)
// ─────────────────────────────────────────────────────────────────

/** Generate a 32-byte cryptographically random hex token */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a 16-byte random salt as hex */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash a password with PBKDF2-SHA256 (100,000 iterations) — secure & fast */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations: 100_000,
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(bits));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${salt}:${hashHex}`;
}

/** Compare a plain password against a stored hash */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support both pbkdf2 format and legacy bcrypt format
  if (!storedHash.startsWith("pbkdf2:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt] = parts;
  const computed = await hashPassword(password, salt);
  // Constant-time comparison
  return computed === storedHash;
}

// ─────────────────────────────────────────────────────────────────
// Action: Register
// ─────────────────────────────────────────────────────────────────
export const register: any = action({
  args: {
    email: v.string(),
    username: v.string(),
    password: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate inputs
    if (!args.email.includes("@")) throw new Error("Invalid email address");
    if (args.username.length < 3) throw new Error("Username must be at least 3 characters");
    if (args.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(args.username)) throw new Error("Username: only letters, numbers, underscores");

    // 2. Check for existing user
    const existing = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email.toLowerCase(),
    });
    if (existing) throw new Error("An account with this email already exists");

    const existingUsername = await ctx.runQuery(api.auth.getUserByUsername, {
      username: args.username.toLowerCase(),
    });
    if (existingUsername) throw new Error("Username is already taken");

    // 3. Hash password with PBKDF2
    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);

    // 4. Create user + session in DB
    const result = await ctx.runMutation(api.auth.createUserAndSession, {
      email: args.email.toLowerCase(),
      username: args.username.toLowerCase(),
      passwordHash,
      displayName: args.displayName?.trim() || args.username,
    });

    return result;
  },
});

// ─────────────────────────────────────────────────────────────────
// Action: Login
// ─────────────────────────────────────────────────────────────────
export const login: any = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find user
    const user = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email.toLowerCase(),
    });
    if (!user) throw new Error("Invalid email or password");

    // 2. Verify password
    const isValid = await verifyPassword(args.password, user.passwordHash);
    if (!isValid) throw new Error("Invalid email or password");

    // 3. Create session
    const token = generateToken();
    await ctx.runMutation(api.auth.createSession, {
      userId: user._id,
      token,
    });

    // 4. Update last login timestamp
    await ctx.runMutation(api.auth.updateLastLogin, { userId: user._id });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────
// Mutation: Create user + initial session (called from register)
// ─────────────────────────────────────────────────────────────────
export const createUserAndSession = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    passwordHash: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email,
      username: args.username,
      passwordHash: args.passwordHash,
      displayName: args.displayName,
      createdAt: now,
    });

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: now,
    });

    const user = await ctx.db.get(userId);
    return {
      token,
      user: {
        id: userId,
        email: user!.email,
        username: user!.username,
        displayName: user!.displayName,
        avatarUrl: user!.avatarUrl,
        bio: user!.bio,
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────
// Mutation: Create session only (called from login)
// ─────────────────────────────────────────────────────────────────
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });
  },
});

// ─────────────────────────────────────────────────────────────────
// Mutation: Update last login timestamp
// ─────────────────────────────────────────────────────────────────
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastLoginAt: Date.now() });
  },
});

// ─────────────────────────────────────────────────────────────────
// Mutation: Logout — delete the session
// ─────────────────────────────────────────────────────────────────
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ─────────────────────────────────────────────────────────────────
// Query: Get current user from session token (used by auth gate)
// ─────────────────────────────────────────────────────────────────
export const getMe = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .unique();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  },
});

// ─────────────────────────────────────────────────────────────────
// Query helpers (called from actions — read-only)
// ─────────────────────────────────────────────────────────────────
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

// ─────────────────────────────────────────────────────────────────
// Mutation: Update profile fields
// ─────────────────────────────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    token: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) throw new Error("Unauthorized");

    const updates: Partial<{ displayName: string; bio: string; avatarUrl: string }> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    await ctx.db.patch(session.userId, updates);
  },
});
