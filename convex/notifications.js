import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforceRateLimit, requireUser } from "./lib";

export const listForMe = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);

    const items = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return Promise.all(
      items.map(async (item) => {
        const actor = await ctx.db.get(item.actorId);
        const paper = await ctx.db.get(item.paperId);
        return {
          ...item,
          actorName: actor?.username ?? actor?.name ?? "student",
          paperTitle: paper?.title ?? "your paper",
        };
      }),
    );
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read_createdAt", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    return unread.length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    await enforceRateLimit(ctx, {
      scope: "notifications_mark_all_read",
      key: user._id,
      windowMs: 60 * 1000,
      maxRequests: 10,
      errorMessage: "Too many notification updates. Please wait a minute and try again.",
    });

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read_createdAt", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    for (const item of unread) {
      await ctx.db.patch(item._id, { read: true });
    }

    return { ok: true, count: unread.length };
  },
});
