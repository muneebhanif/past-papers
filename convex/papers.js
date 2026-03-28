import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib";

const normalize = (value) => value.trim().toLowerCase();

const enrichPaper = async (ctx, paper, viewerId) => {
  const uploader = await ctx.db.get(paper.uploadedBy);

  const likes = await ctx.db
    .query("likes")
    .withIndex("by_paperId", (q) => q.eq("paperId", paper._id))
    .collect();

  const comments = await ctx.db
    .query("comments")
    .withIndex("by_paperId_createdAt", (q) => q.eq("paperId", paper._id))
    .collect();

  const viewerLike = viewerId
    ? await ctx.db
        .query("likes")
        .withIndex("by_paperId_userId", (q) =>
          q.eq("paperId", paper._id).eq("userId", viewerId),
        )
        .first()
    : null;

  return {
    ...paper,
    uploader: {
      _id: uploader?._id,
      name: uploader?.name ?? "Unknown user",
      image: uploader?.image ?? "",
    },
    stats: {
      likeCount: likes.length,
      commentCount: comments.length,
      likedByMe: Boolean(viewerLike),
    },
  };
};

export const listApproved = query({
  args: {
    paginationOpts: paginationOptsValidator,
    department: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const searchText = normalize(args.search ?? "");

    let q;
    if (args.department && args.department !== "All") {
      q = ctx.db
        .query("papers")
        .withIndex("by_department_status_createdAt", (index) =>
          index.eq("department", args.department).eq("status", "approved"),
        )
        .order("desc");
    } else {
      q = ctx.db
        .query("papers")
        .withIndex("by_status_createdAt", (index) => index.eq("status", "approved"))
        .order("desc");
    }

    const page = await q.paginate(args.paginationOpts);

    const filtered = page.page.filter((paper) => {
      if (!searchText) return true;
      const haystack = [paper.title, paper.subject, paper.teacher, paper.year, paper.type]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchText);
    });

    const enriched = await Promise.all(
      filtered.map((paper) => enrichPaper(ctx, paper, identity?.subject ?? null)),
    );

    return {
      ...page,
      page: enriched,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    teacher: v.string(),
    year: v.string(),
    type: v.string(),
    department: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!args.imageUrl.startsWith("http")) {
      throw new ConvexError("Invalid image URL.");
    }

    const sanitize = (value, max = 100) => value.trim().slice(0, max);

    return ctx.db.insert("papers", {
      title: sanitize(args.title),
      subject: sanitize(args.subject),
      teacher: sanitize(args.teacher),
      year: sanitize(args.year, 20),
      type: sanitize(args.type, 40),
      department: sanitize(args.department, 80),
      imageUrl: sanitize(args.imageUrl, 600),
      uploadedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listMyUploads = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_uploadedBy_createdAt", (q) => q.eq("uploadedBy", user._id))
      .order("desc")
      .collect();

    return papers;
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(200);

    return Promise.all(papers.map((paper) => enrichPaper(ctx, paper, null)));
  },
});

export const setStatus = mutation({
  args: {
    paperId: v.id("papers"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    await ctx.db.patch(args.paperId, {
      status: args.status,
    });
  },
});

export const toggleLike = mutation({
  args: {
    paperId: v.id("papers"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_paperId_userId", (q) =>
        q.eq("paperId", args.paperId).eq("userId", user._id),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }

    await ctx.db.insert("likes", {
      paperId: args.paperId,
      userId: user._id,
      createdAt: Date.now(),
    });

    return { liked: true };
  },
});
