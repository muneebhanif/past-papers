import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforceRateLimit, ensureAdminFlag, requireUser } from "./lib";

const sanitizeUsername = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);

const fallbackUsername = (userId, base) => {
  const cleanBase = sanitizeUsername(base || "student");
  const suffix = String(userId).slice(-6).replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${cleanBase || "student"}_${suffix || "must"}`;
};

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return ensureAdminFlag(ctx, userId);
  },
});

export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ensureAdminFlag(ctx, userId);
    if (!user) return null;

    if (!user.username) {
      const base = user.name || user.email?.split("@")[0] || "student";
      const username = fallbackUsername(userId, base);
      await ctx.db.patch(userId, { username });
      return { ...user, username };
    }

    return user;
  },
});

export const byId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const updateProfile = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await enforceRateLimit(ctx, {
      scope: "profile_update",
      key: user._id,
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      errorMessage: "Too many profile updates. Please wait 15 minutes and try again.",
    });

    const username = sanitizeUsername(args.username);
    if (username.length < 3) {
      throw new ConvexError("Username must be at least 3 characters (letters, numbers, underscore).");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", username))
      .first();

    if (existing && existing._id !== user._id) {
      throw new ConvexError("Username is already taken.");
    }

    await ctx.db.patch(user._id, {
      username,
    });

    const updated = await ctx.db.get(user._id);
    return updated;
  },
});
