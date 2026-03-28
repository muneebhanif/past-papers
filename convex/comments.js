import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

export const listByPaper = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_paperId_createdAt", (q) => q.eq("paperId", args.paperId))
      .order("desc")
      .take(50);

    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            _id: user?._id,
            name: user?.name ?? "Unknown",
            image: user?.image ?? "",
          },
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    paperId: v.id("papers"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const cleanContent = args.content.trim();
    if (cleanContent.length < 2 || cleanContent.length > 500) {
      throw new Error("Comment must be between 2 and 500 characters.");
    }

    return ctx.db.insert("comments", {
      paperId: args.paperId,
      userId: user._id,
      content: cleanContent,
      createdAt: Date.now(),
    });
  },
});
