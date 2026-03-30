import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib";

const normalize = (value) => value.trim().toLowerCase();
const sanitizeText = (value, max = 100) => value.trim().replace(/\s+/g, " ").slice(0, max);
const PAPER_TYPES = new Set(["Midterm", "Terminal", "Improve", "Summer"]);
const SEMESTERS = new Set(["1", "2", "3", "4", "5", "6", "7", "8"]);
const YEAR_PATTERN = /^(Fall|Spring|Summer)\s20\d{2}$/;

const isValidAcademicYear = (value) => {
  if (!YEAR_PATTERN.test(value)) return false;
  const year = Number(value.split(" ")[1]);
  return year >= 2021 && year <= new Date().getFullYear() + 2;
};

const validatePaperArgs = (args) => {
  const title = sanitizeText(args.title, 120);
  const subject = sanitizeText(args.subject, 80);
  const teacher = sanitizeText(args.teacher, 80);
  const year = sanitizeText(args.year, 20);
  const type = sanitizeText(args.type, 40);
  const semester = typeof args.semester === "string" ? sanitizeText(args.semester, 4) : "";
  const department = sanitizeText(args.department, 80);

  if (title.length < 4) {
    throw new ConvexError("Title must be at least 4 characters.");
  }
  if (subject.length < 2) {
    throw new ConvexError("Subject must be at least 2 characters.");
  }
  if (teacher.length < 2) {
    throw new ConvexError("Teacher must be at least 2 characters.");
  }
  if (!PAPER_TYPES.has(type)) {
    throw new ConvexError("Invalid paper type.");
  }
  if (!isValidAcademicYear(year)) {
    throw new ConvexError("Invalid academic year.");
  }
  if (semester && !SEMESTERS.has(semester)) {
    throw new ConvexError("Invalid semester.");
  }

  return {
    title,
    subject,
    teacher,
    year,
    type,
    ...(semester ? { semester } : {}),
    department,
  };
};

const enrichPaper = async (ctx, paper, viewerId) => {
  const uploader = await ctx.db.get(paper.uploadedBy);

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
    isMine: Boolean(viewerId && paper.uploadedBy === viewerId),
    uploader: {
      _id: uploader?._id,
      name: uploader?.username ?? uploader?.name ?? "student",
      image: uploader?.image ?? "",
    },
    stats: {
      likeCount: paper.likeCount ?? 0,
      commentCount: paper.commentCount ?? 0,
      likedByMe: Boolean(viewerLike),
    },
  };
};

export const listApproved = query({
  args: {
    paginationOpts: paginationOptsValidator,
    department: v.optional(v.string()),
    search: v.optional(v.string()),
    paperType: v.optional(v.string()),
    semester: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    const searchText = normalize(args.search ?? "");
    const selectedType = sanitizeText(args.paperType ?? "", 40);
    const selectedSemester = sanitizeText(args.semester ?? "", 10);

    if (args.paginationOpts.numItems > 20) {
      throw new ConvexError("Too many items requested at once.");
    }

    if (searchText.length > 100) {
      throw new ConvexError("Search text is too long.");
    }

    if (selectedType && selectedType !== "All" && !PAPER_TYPES.has(selectedType)) {
      throw new ConvexError("Invalid paper type filter.");
    }
    if (selectedSemester && selectedSemester !== "All" && !SEMESTERS.has(selectedSemester)) {
      throw new ConvexError("Invalid semester filter.");
    }

    let q;
    if (args.department && args.department !== "All" && selectedType && selectedType !== "All") {
      q = ctx.db
        .query("papers")
        .withIndex("by_department_status_type_createdAt", (index) =>
          index
            .eq("department", args.department)
            .eq("status", "approved")
            .eq("type", selectedType),
        )
        .order("desc");
    } else if (args.department && args.department !== "All") {
      q = ctx.db
        .query("papers")
        .withIndex("by_department_status_createdAt", (index) =>
          index.eq("department", args.department).eq("status", "approved"),
        )
        .order("desc");
    } else if (selectedType && selectedType !== "All") {
      q = ctx.db
        .query("papers")
        .withIndex("by_status_type_createdAt", (index) =>
          index.eq("status", "approved").eq("type", selectedType),
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
      if (selectedSemester && selectedSemester !== "All" && paper.semester !== selectedSemester) {
        return false;
      }
      if (!searchText) return true;
      const haystack = [
        paper.title,
        paper.subject,
        paper.teacher,
        paper.year,
        paper.type,
        paper.semester ? `semester ${paper.semester}` : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchText);
    });

    const enrichedApproved = await Promise.all(
      filtered.map((paper) => enrichPaper(ctx, paper, viewerUserId ?? null)),
    );

    const isFirstPage = !args.paginationOpts.cursor;
    let ownPendingOrRejected = [];

    if (viewerUserId && isFirstPage) {
      const ownPapers = await ctx.db
        .query("papers")
        .withIndex("by_uploadedBy_createdAt", (q) => q.eq("uploadedBy", viewerUserId))
        .order("desc")
        .take(100);

      ownPendingOrRejected = ownPapers.filter((paper) => {
        if (paper.status === "approved") return false;
        if (selectedType && selectedType !== "All" && paper.type !== selectedType) return false;
        if (selectedSemester && selectedSemester !== "All" && paper.semester !== selectedSemester) {
          return false;
        }
        if (args.department && args.department !== "All" && paper.department !== args.department) {
          return false;
        }
        if (!searchText) return true;
        const haystack = [
          paper.title,
          paper.subject,
          paper.teacher,
          paper.year,
          paper.type,
          paper.semester ? `semester ${paper.semester}` : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchText);
      });
    }

    const enrichedOwn = await Promise.all(
      ownPendingOrRejected.map((paper) => enrichPaper(ctx, paper, viewerUserId ?? null)),
    );

    const byId = new Map();
    for (const paper of [...enrichedOwn, ...enrichedApproved]) {
      byId.set(paper._id, paper);
    }
    const merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);

    return {
      ...page,
      page: merged,
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
    semester: v.optional(v.string()),
    department: v.string(),
    imageUrl: v.string(),
    secondImageUrl: v.optional(v.string()),
    imageFileId: v.optional(v.string()),
    secondImageFileId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const imageUrl = sanitizeText(args.imageUrl, 600);
    const secondImageUrl = args.secondImageUrl
      ? sanitizeText(args.secondImageUrl, 600)
      : undefined;
    const imageFileId = args.imageFileId ? sanitizeText(args.imageFileId, 120) : undefined;
    const secondImageFileId = args.secondImageFileId
      ? sanitizeText(args.secondImageFileId, 120)
      : undefined;

    const validateImageUrl = (url, label) => {
      let parsedImageUrl;
      try {
        parsedImageUrl = new URL(url);
      } catch {
        throw new ConvexError(`Invalid ${label} URL.`);
      }

      if (parsedImageUrl.protocol !== "https:") {
        throw new ConvexError(`${label} URL must use HTTPS.`);
      }

      const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
      if (endpoint) {
        let endpointHost;
        try {
          endpointHost = new URL(endpoint).hostname;
        } catch {
          throw new ConvexError("Server image host configuration is invalid.");
        }
        if (parsedImageUrl.hostname !== endpointHost) {
          throw new ConvexError(`${label} URL host is not allowed.`);
        }
      }
    };

    validateImageUrl(imageUrl, "Image");
    if (secondImageUrl) {
      validateImageUrl(secondImageUrl, "Second image");
    }

    const recent15MinUploads = await ctx.db
      .query("papers")
      .withIndex("by_uploadedBy_createdAt", (q) =>
        q.eq("uploadedBy", user._id).gte("createdAt", now - 15 * 60 * 1000),
      )
      .collect();

    if (recent15MinUploads.length >= 5) {
      throw new ConvexError("Rate limit exceeded: max 5 uploads per 15 minutes.");
    }

    const recent24hUploads = await ctx.db
      .query("papers")
      .withIndex("by_uploadedBy_createdAt", (q) =>
        q.eq("uploadedBy", user._id).gte("createdAt", now - 24 * 60 * 60 * 1000),
      )
      .collect();

    if (recent24hUploads.length >= 30) {
      throw new ConvexError("Rate limit exceeded: max 30 uploads per day.");
    }

    const validated = validatePaperArgs(args);

    return ctx.db.insert("papers", {
      ...validated,
      imageUrl,
      ...(secondImageUrl ? { secondImageUrl } : {}),
      ...(imageFileId ? { imageFileId } : {}),
      ...(secondImageFileId ? { secondImageFileId } : {}),
      uploadedBy: user._id,
      status: "pending",
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
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

export const updateMyPaper = mutation({
  args: {
    paperId: v.id("papers"),
    title: v.string(),
    subject: v.string(),
    teacher: v.string(),
    year: v.string(),
    type: v.string(),
    semester: v.optional(v.string()),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const paper = await ctx.db.get(args.paperId);

    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    if (paper.uploadedBy !== user._id) {
      throw new ConvexError("You can only update your own uploads.");
    }

    const validated = validatePaperArgs(args);

    await ctx.db.patch(args.paperId, {
      ...validated,
      status: "pending",
      reviewNote: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined,
    });

    return { ok: true };
  },
});

export const deleteMyPaper = mutation({
  args: {
    paperId: v.id("papers"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const paper = await ctx.db.get(args.paperId);

    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    if (paper.uploadedBy !== user._id) {
      throw new ConvexError("You can only delete your own uploads.");
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_paperId_createdAt", (q) => q.eq("paperId", args.paperId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_paperId", (q) => q.eq("paperId", args.paperId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("paperId"), args.paperId))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    await ctx.db.delete(args.paperId);
    return { ok: true };
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
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    const note = (args.reviewNote ?? "").trim().slice(0, 500);

    await ctx.db.patch(args.paperId, {
      status: args.status,
      reviewNote: args.status === "rejected" ? note : undefined,
      reviewedAt: Date.now(),
      reviewedBy: admin.email ?? admin.username ?? "admin",
    });
  },
});

export const toggleLike = mutation({
  args: {
    paperId: v.id("papers"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_paperId_userId", (q) =>
        q.eq("paperId", args.paperId).eq("userId", user._id),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.paperId, {
        likeCount: Math.max((paper.likeCount ?? 0) - 1, 0),
      });
      return { liked: false };
    }

    await ctx.db.insert("likes", {
      paperId: args.paperId,
      userId: user._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.paperId, {
      likeCount: (paper.likeCount ?? 0) + 1,
    });

    if (paper.uploadedBy !== user._id) {
      await ctx.db.insert("notifications", {
        userId: paper.uploadedBy,
        actorId: user._id,
        paperId: paper._id,
        type: "like",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { liked: true };
  },
});

export const rightRailData = query({
  args: {},
  handler: async (ctx) => {
    const papers = await ctx.db.query("papers").order("desc").take(3000);

    const approvedPapers = papers.filter((paper) => paper.status === "approved");
    const contributorCounts = new Map();

    for (const paper of approvedPapers) {
      const previous = contributorCounts.get(paper.uploadedBy) ?? 0;
      contributorCounts.set(paper.uploadedBy, previous + 1);
    }

    const ranked = [...contributorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topContributors = await Promise.all(
      ranked.map(async ([userId, approvedCount]) => {
        const user = await ctx.db.get(userId);
        return {
          userId,
          name: user?.username ?? user?.name ?? "student",
          image: user?.image ?? "",
          approvedCount,
        };
      }),
    );

    return {
      topContributors,
      stats: {
        totalApproved: approvedPapers.length,
        totalUploads: papers.length,
      },
    };
  },
});
