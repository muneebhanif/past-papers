import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforceRateLimit, getAdminEmails, normalizeEmail, normalizeOptionalHttpsUrl } from "./lib";

const sessionDurationMs = 1000 * 60 * 60 * 12;

const validateSessionToken = (token) => {
  const cleanToken = token.trim();
  if (cleanToken.length < 32 || cleanToken.length > 200) {
    throw new ConvexError("Invalid admin session.");
  }
  return cleanToken;
};

const requireValidSession = async (ctx, token) => {
  const sessionToken = validateSessionToken(token);
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .first();

  if (!session) {
    throw new ConvexError("Admin session expired. Please sign in again.");
  }

  if (session.expiresAt < Date.now()) {
    await ctx.db.delete(session._id);
    throw new ConvexError("Admin session expired. Please sign in again.");
  }

  return session;
};

const sanitizeUsername = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);

const ensureUniqueUsername = async (ctx, username, ignoreUserId) => {
  const existing = await ctx.db
    .query("users")
    .withIndex("username", (q) => q.eq("username", username))
    .first();

  if (existing && existing._id !== ignoreUserId) {
    throw new ConvexError("Username is already taken.");
  }
};

const enrichPaper = async (ctx, paper) => {
  const uploader = await ctx.db.get(paper.uploadedBy);

  return {
    ...paper,
    uploader: {
      _id: uploader?._id,
      name: uploader?.username ?? uploader?.name ?? "student",
      image: uploader?.image ?? "",
    },
    stats: {
      likeCount: paper.likeCount ?? 0,
      commentCount: paper.commentCount ?? 0,
      likedByMe: false,
    },
  };
};

const sanitizeText = (value, max = 120) => value.trim().replace(/\s+/g, " ").slice(0, max);

// ============================================================================
// AUTH
// ============================================================================

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email, "Admin email");
    const password = args.password;

    const allowedEmails = getAdminEmails();
    const adminPanelPassword = process.env.ADMIN_PANEL_PASSWORD;

    if (!adminPanelPassword) {
      throw new ConvexError("Admin panel password is not configured.");
    }

    await enforceRateLimit(ctx, {
      scope: "admin_login",
      key: email,
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
      blockDurationMs: 15 * 60 * 1000,
      errorMessage: "Too many admin login attempts. Please wait 15 minutes and try again.",
    });

    if (!allowedEmails.includes(email) || password !== adminPanelPassword) {
      throw new ConvexError("Invalid admin credentials.");
    }

    const token = `${crypto.randomUUID()}_${crypto.randomUUID()}`;
    const now = Date.now();

    const existingSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_email_createdAt", (q) => q.eq("email", email))
      .take(20);

    for (const existingSession of existingSessions) {
      await ctx.db.delete(existingSession._id);
    }

    await ctx.db.insert("adminSessions", {
      token,
      email,
      expiresAt: now + sessionDurationMs,
      createdAt: now,
    });

    return {
      token,
      expiresAt: now + sessionDurationMs,
    };
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const session = await requireValidSession(ctx, args.token);
      return { ok: true, email: session.email, expiresAt: session.expiresAt };
    } catch {
      return { ok: false };
    }
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const sessionToken = validateSessionToken(args.token);
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { ok: true };
  },
});

// ============================================================================
// PAPER MODERATION
// ============================================================================

export const listPending = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(200);

    return Promise.all(papers.map((paper) => enrichPaper(ctx, paper)));
  },
});

export const setStatus = mutation({
  args: {
    token: v.string(),
    paperId: v.id("papers"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireValidSession(ctx, args.token);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    const note = (args.reviewNote ?? "").trim().slice(0, 500);

    if (args.status === "rejected" && !note) {
      throw new ConvexError("Please add a rejection note.");
    }

    await ctx.db.patch(args.paperId, {
      status: args.status,
      reviewNote: args.status === "rejected" ? note : undefined,
      imageFileId: args.status === "rejected" ? undefined : paper.imageFileId,
      secondImageFileId: args.status === "rejected" ? undefined : paper.secondImageFileId,
      reviewedAt: Date.now(),
      reviewedBy: session.email,
    });

    return { ok: true };
  },
});

export const getPaperCleanupData = query({
  args: {
    token: v.string(),
    paperId: v.id("papers"),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    return {
      paperId: paper._id,
      imageFileId: paper.imageFileId,
      secondImageFileId: paper.secondImageFileId,
    };
  },
});

// ============================================================================
// USERS CRUD
// ============================================================================

export const listUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const users = await ctx.db.query("users").order("desc").take(500);
    const papers = await ctx.db.query("papers").order("desc").take(5000);
    const comments = await ctx.db.query("comments").order("desc").take(5000);
    const likes = await ctx.db.query("likes").order("desc").take(5000);

    const uploadsByUser = new Map();
    for (const paper of papers) {
      uploadsByUser.set(paper.uploadedBy, (uploadsByUser.get(paper.uploadedBy) ?? 0) + 1);
    }

    const commentsByUser = new Map();
    for (const comment of comments) {
      commentsByUser.set(comment.userId, (commentsByUser.get(comment.userId) ?? 0) + 1);
    }

    const likesByUser = new Map();
    for (const like of likes) {
      likesByUser.set(like.userId, (likesByUser.get(like.userId) ?? 0) + 1);
    }

    return Promise.all(
      users.map(async (user) => {
        return {
          ...user,
          uploadCount: uploadsByUser.get(user._id) ?? 0,
          commentCount: commentsByUser.get(user._id) ?? 0,
          likeCount: likesByUser.get(user._id) ?? 0,
        };
      }),
    );
  },
});

export const createUser = mutation({
  args: {
    token: v.string(),
    username: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const username = sanitizeUsername(args.username);
    if (username.length < 3) {
      throw new ConvexError("Username must be at least 3 characters.");
    }

    await ensureUniqueUsername(ctx, username);

    const email = args.email ? normalizeEmail(args.email) : undefined;
    const image = normalizeOptionalHttpsUrl(args.image, "Image URL");

    const userId = await ctx.db.insert("users", {
      username,
      name: args.name?.trim() || undefined,
      email,
      image: image || undefined,
      isAdmin: false,
      isAnonymous: false,
    });

    return ctx.db.get(userId);
  },
});

export const updateUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    username: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found.");
    }

    const username = sanitizeUsername(args.username);
    if (username.length < 3) {
      throw new ConvexError("Username must be at least 3 characters.");
    }

    await ensureUniqueUsername(ctx, username, args.userId);

    const email = args.email ? normalizeEmail(args.email) : undefined;
    const image = normalizeOptionalHttpsUrl(args.image, "Image URL");

    await ctx.db.patch(args.userId, {
      username,
      name: args.name?.trim() || undefined,
      email,
      image: image || undefined,
    });

    return ctx.db.get(args.userId);
  },
});

export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await requireValidSession(ctx, args.token);
    const target = await ctx.db.get(args.userId);

    if (!target) {
      throw new ConvexError("User not found.");
    }

    const adminEmails = getAdminEmails();
    if (target.email && adminEmails.includes(target.email.toLowerCase())) {
      throw new ConvexError("Cannot delete an admin allowlisted user.");
    }

    if (target.email && target.email.toLowerCase() === session.email) {
      throw new ConvexError("You cannot delete your own admin-linked account.");
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();
    for (const comment of comments) {
      const paper = await ctx.db.get(comment.paperId);
      if (paper) {
        await ctx.db.patch(paper._id, {
          commentCount: Math.max((paper.commentCount ?? 0) - 1, 0),
        });
      }
      await ctx.db.delete(comment._id);
    }

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();
    for (const like of likes) {
      const paper = await ctx.db.get(like.paperId);
      if (paper) {
        await ctx.db.patch(paper._id, {
          likeCount: Math.max((paper.likeCount ?? 0) - 1, 0),
        });
      }
      await ctx.db.delete(like._id);
    }

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_uploadedBy_createdAt", (q) => q.eq("uploadedBy", args.userId))
      .collect();
    for (const paper of papers) {
      await ctx.db.delete(paper._id);
    }

    const authLogs = await ctx.db
      .query("uploadAuthLogs")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();
    for (const log of authLogs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.userId);
    return { ok: true };
  },
});

// ============================================================================
// PAPERS CRUD
// ============================================================================

export const listAllPapers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const papers = await ctx.db.query("papers").order("desc").take(5000);
    return Promise.all(papers.map((paper) => enrichPaper(ctx, paper)));
  },
});

export const updatePaper = mutation({
  args: {
    token: v.string(),
    paperId: v.id("papers"),
    title: v.string(),
    department: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireValidSession(ctx, args.token);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
    }

    const title = sanitizeText(args.title, 120);
    if (title.length < 4) {
      throw new ConvexError("Title must be at least 4 characters.");
    }

    const department = args.department ? sanitizeText(args.department, 80) : paper.department;
    const subject = args.subject ? sanitizeText(args.subject, 80) : paper.subject;

    await ctx.db.patch(args.paperId, {
      title,
      department,
      subject,
      updatedAt: Date.now(),
      updatedBy: session.email,
    });

    return { ok: true };
  },
});

export const deletePaper = mutation({
  args: {
    token: v.string(),
    paperId: v.id("papers"),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found.");
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
    for (const item of notifications) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.paperId);
    return { ok: true };
  },
});

// ============================================================================
// COMMENTS CRUD (Admin)
// ============================================================================

export const listAllComments = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const comments = await ctx.db.query("comments").order("desc").take(500);

    return Promise.all(
      comments.map(async (comment) => {
        const [user, paper] = await Promise.all([
          ctx.db.get(comment.userId),
          ctx.db.get(comment.paperId),
        ]);

        let parentComment = null;
        if (comment.parentId) {
          parentComment = await ctx.db.get(comment.parentId);
        }

        return {
          ...comment,
          user: {
            _id: user?._id,
            name: user?.username ?? user?.name ?? "Unknown",
            image: user?.image ?? "",
            email: user?.email ?? "",
          },
          paper: {
            _id: paper?._id,
            title: paper?.title ?? "Deleted Paper",
            department: paper?.department ?? "",
            status: paper?.status ?? "unknown",
          },
          isReply: Boolean(comment.parentId),
          parentContent: parentComment?.content ?? null,
        };
      }),
    );
  },
});

export const adminUpdateComment = mutation({
  args: {
    token: v.string(),
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError("Comment not found.");
    }

    const cleanContent = args.content.trim();
    if (cleanContent.length < 2 || cleanContent.length > 500) {
      throw new ConvexError("Comment must be between 2 and 500 characters.");
    }

    await ctx.db.patch(args.commentId, {
      content: cleanContent,
      editedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const adminDeleteComment = mutation({
  args: {
    token: v.string(),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return { ok: true };
    }

    // Detach replies
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_paperId_parentId_createdAt", (q) =>
        q.eq("paperId", comment.paperId).eq("parentId", comment._id),
      )
      .collect();
    for (const reply of replies) {
      await ctx.db.patch(reply._id, { parentId: undefined });
    }

    // Decrement paper comment count
    const paper = await ctx.db.get(comment.paperId);
    if (paper) {
      await ctx.db.patch(paper._id, {
        commentCount: Math.max((paper.commentCount ?? 0) - 1, 0),
      });
    }

    await ctx.db.delete(args.commentId);
    return { ok: true };
  },
});

// ============================================================================
// LIKES CRUD (Admin)
// ============================================================================

export const listAllLikes = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const likes = await ctx.db.query("likes").order("desc").take(500);

    return Promise.all(
      likes.map(async (like) => {
        const [user, paper] = await Promise.all([
          ctx.db.get(like.userId),
          ctx.db.get(like.paperId),
        ]);

        return {
          ...like,
          user: {
            _id: user?._id,
            name: user?.username ?? user?.name ?? "Unknown",
            image: user?.image ?? "",
            email: user?.email ?? "",
          },
          paper: {
            _id: paper?._id,
            title: paper?.title ?? "Deleted Paper",
            department: paper?.department ?? "",
            status: paper?.status ?? "unknown",
          },
        };
      }),
    );
  },
});

export const adminDeleteLike = mutation({
  args: {
    token: v.string(),
    likeId: v.id("likes"),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const like = await ctx.db.get(args.likeId);
    if (!like) {
      return { ok: true };
    }

    const paper = await ctx.db.get(like.paperId);
    if (paper) {
      await ctx.db.patch(paper._id, {
        likeCount: Math.max((paper.likeCount ?? 0) - 1, 0),
      });
    }

    await ctx.db.delete(args.likeId);
    return { ok: true };
  },
});

// ============================================================================
// ADMIN STATS & ANALYTICS
// ============================================================================

export const getAdminStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * oneDayMs;
    const thirtyDaysAgo = now - 30 * oneDayMs;

    const allPapers = await ctx.db.query("papers").order("desc").take(5000);
    const allUsers = await ctx.db.query("users").order("desc").take(5000);
    const allComments = await ctx.db.query("comments").order("desc").take(5000);
    const allLikes = await ctx.db.query("likes").order("desc").take(5000);
    const allNotifications = await ctx.db.query("notifications").order("desc").take(5000);

    // Papers by status
    const approvedCount = allPapers.filter((p) => p.status === "approved").length;
    const pendingCount = allPapers.filter((p) => p.status === "pending").length;
    const rejectedCount = allPapers.filter((p) => p.status === "rejected").length;

    // Daily data for last 7 days (for charts)
    const dailyUploads = [];
    const dailyComments = [];
    const dailyLikes = [];
    const dailyUsers = [];
    const dayLabels = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * oneDayMs;
      const dayEnd = dayStart + oneDayMs;
      const dayDate = new Date(dayStart);
      const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short" });
      dayLabels.push(dayLabel);

      dailyUploads.push(allPapers.filter((p) => p.createdAt >= dayStart && p.createdAt < dayEnd).length);
      dailyComments.push(allComments.filter((c) => c.createdAt >= dayStart && c.createdAt < dayEnd).length);
      dailyLikes.push(allLikes.filter((l) => l.createdAt >= dayStart && l.createdAt < dayEnd).length);
      dailyUsers.push(allUsers.filter((u) => u._creationTime >= dayStart && u._creationTime < dayEnd).length);
    }

    // Papers by department
    const deptCounts = {};
    for (const paper of allPapers.filter((p) => p.status === "approved")) {
      if (paper.department) {
        deptCounts[paper.department] = (deptCounts[paper.department] ?? 0) + 1;
      }
    }
    const topDepartments = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Papers by type
    const typeCounts = {};
    for (const paper of allPapers.filter((p) => p.status === "approved")) {
      if (paper.type) {
        typeCounts[paper.type] = (typeCounts[paper.type] ?? 0) + 1;
      }
    }
    const papersByType = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top uploaders
    const uploaderCounts = {};
    for (const paper of allPapers) {
      uploaderCounts[paper.uploadedBy] = (uploaderCounts[paper.uploadedBy] ?? 0) + 1;
    }
    const topUploaderEntries = Object.entries(uploaderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topUploaders = await Promise.all(
      topUploaderEntries.map(async ([userId, count]) => {
        const user = await ctx.db.get(userId);
        return {
          name: user?.username ?? user?.name ?? "Unknown",
          image: user?.image ?? "",
          count,
        };
      }),
    );

    // Top commenters
    const commenterCounts = {};
    for (const comment of allComments) {
      commenterCounts[comment.userId] = (commenterCounts[comment.userId] ?? 0) + 1;
    }
    const topCommenterEntries = Object.entries(commenterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topCommenters = await Promise.all(
      topCommenterEntries.map(async ([userId, count]) => {
        const user = await ctx.db.get(userId);
        return {
          name: user?.username ?? user?.name ?? "Unknown",
          image: user?.image ?? "",
          count,
        };
      }),
    );

    // Most liked papers
    const mostLikedPapers = [...allPapers]
      .filter((p) => p.status === "approved" && (p.likeCount ?? 0) > 0)
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      .slice(0, 5)
      .map((p) => ({ title: p.title, likeCount: p.likeCount ?? 0, department: p.department }));

    // Most commented papers
    const mostCommentedPapers = [...allPapers]
      .filter((p) => p.status === "approved" && (p.commentCount ?? 0) > 0)
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0))
      .slice(0, 5)
      .map((p) => ({ title: p.title, commentCount: p.commentCount ?? 0, department: p.department }));

    // Recent 7 days growth
    const last7Papers = allPapers.filter((p) => p.createdAt >= sevenDaysAgo).length;
    const last7Comments = allComments.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const last7Likes = allLikes.filter((l) => l.createdAt >= sevenDaysAgo).length;
    const last7Users = allUsers.filter((u) => u._creationTime >= sevenDaysAgo).length;

    // Last 30 days
    const last30Papers = allPapers.filter((p) => p.createdAt >= thirtyDaysAgo).length;
    const last30Comments = allComments.filter((c) => c.createdAt >= thirtyDaysAgo).length;
    const last30Likes = allLikes.filter((l) => l.createdAt >= thirtyDaysAgo).length;
    const last30Users = allUsers.filter((u) => u._creationTime >= thirtyDaysAgo).length;

    // Total engagement
    const totalLikes = allPapers.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
    const totalComments = allPapers.reduce((sum, p) => sum + (p.commentCount ?? 0), 0);

    return {
      totals: {
        papers: allPapers.length,
        users: allUsers.length,
        comments: allComments.length,
        likes: allLikes.length,
        notifications: allNotifications.length,
        totalLikes,
        totalComments,
      },
      paperStatus: { approvedCount, pendingCount, rejectedCount },
      chartData: {
        dayLabels,
        dailyUploads,
        dailyComments,
        dailyLikes,
        dailyUsers,
      },
      topDepartments,
      papersByType,
      topUploaders,
      topCommenters,
      mostLikedPapers,
      mostCommentedPapers,
      growth: {
        last7: { papers: last7Papers, comments: last7Comments, likes: last7Likes, users: last7Users },
        last30: { papers: last30Papers, comments: last30Comments, likes: last30Likes, users: last30Users },
      },
    };
  },
});

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export const listActivity = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    const limit = Math.min(Math.max(args.limit ?? 80, 20), 200);
    const perTypeLimit = Math.ceil(limit / 3);

    const [recentComments, recentLikes, recentPaperEdits] = await Promise.all([
      ctx.db.query("comments").order("desc").take(perTypeLimit),
      ctx.db.query("likes").order("desc").take(perTypeLimit),
      ctx.db.query("papers").withIndex("by_updatedAt").order("desc").take(perTypeLimit),
    ]);

    const commentEvents = await Promise.all(
      recentComments.map(async (comment) => {
        const [actor, paper] = await Promise.all([
          ctx.db.get(comment.userId),
          ctx.db.get(comment.paperId),
        ]);

        return {
          id: `comment_${comment._id}`,
          type: "comment",
          createdAt: comment.createdAt,
          actorName: actor?.username ?? actor?.name ?? "student",
          actorImage: actor?.image ?? "",
          actorEmail: actor?.email ?? "",
          paperTitle: paper?.title ?? "Deleted paper",
          paperDepartment: paper?.department ?? "",
          content: comment.content,
          isReply: Boolean(comment.parentId),
        };
      }),
    );

    const likeEvents = await Promise.all(
      recentLikes.map(async (like) => {
        const [actor, paper] = await Promise.all([
          ctx.db.get(like.userId),
          ctx.db.get(like.paperId),
        ]);

        return {
          id: `like_${like._id}`,
          type: "like",
          createdAt: like.createdAt,
          actorName: actor?.username ?? actor?.name ?? "student",
          actorImage: actor?.image ?? "",
          actorEmail: actor?.email ?? "",
          paperTitle: paper?.title ?? "Deleted paper",
          paperDepartment: paper?.department ?? "",
          content: undefined,
        };
      }),
    );

    const paperEditEvents = await Promise.all(
      recentPaperEdits
        .filter((paper) => (paper.updatedAt ?? 0) > (paper.createdAt ?? 0))
        .map(async (paper) => {
          const uploader = await ctx.db.get(paper.uploadedBy);
          return {
            id: `paper_edit_${paper._id}_${paper.updatedAt}`,
            type: "paper_edit",
            createdAt: paper.updatedAt,
            actorName: paper.updatedBy ?? uploader?.username ?? uploader?.name ?? "student",
            actorImage: uploader?.image ?? "",
            actorEmail: uploader?.email ?? "",
            paperTitle: paper.title ?? "Untitled paper",
            paperDepartment: paper.department ?? "",
            content: "Updated paper details",
          };
        }),
    );

    // Also include paper uploads as events
    const recentUploads = await ctx.db.query("papers").order("desc").take(perTypeLimit);
    const uploadEvents = await Promise.all(
      recentUploads.map(async (paper) => {
        const uploader = await ctx.db.get(paper.uploadedBy);
        return {
          id: `upload_${paper._id}`,
          type: "upload",
          createdAt: paper.createdAt,
          actorName: uploader?.username ?? uploader?.name ?? "student",
          actorImage: uploader?.image ?? "",
          actorEmail: uploader?.email ?? "",
          paperTitle: paper.title ?? "Untitled paper",
          paperDepartment: paper.department ?? "",
          content: `Uploaded to ${paper.department}`,
          paperStatus: paper.status,
        };
      }),
    );

    return [...commentEvents, ...likeEvents, ...paperEditEvents, ...uploadEvents]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const deleteActivity = mutation({
  args: {
    token: v.string(),
    activityId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireValidSession(ctx, args.token);

    let activityType = "";
    let entityId = "";

    if (args.activityId.startsWith("comment_")) {
      activityType = "comment";
      entityId = args.activityId.slice("comment_".length);
    } else if (args.activityId.startsWith("like_")) {
      activityType = "like";
      entityId = args.activityId.slice("like_".length);
    }

    if (!activityType || !entityId) {
      throw new ConvexError("Invalid activity id.");
    }

    if (activityType === "comment") {
      const comment = await ctx.db.get(entityId);
      if (!comment) {
        return { ok: true };
      }

      const paper = await ctx.db.get(comment.paperId);
      if (paper) {
        await ctx.db.patch(paper._id, {
          commentCount: Math.max((paper.commentCount ?? 0) - 1, 0),
        });
      }

      await ctx.db.delete(comment._id);
      return { ok: true };
    }

    if (activityType === "like") {
      const like = await ctx.db.get(entityId);
      if (!like) {
        return { ok: true };
      }

      const paper = await ctx.db.get(like.paperId);
      if (paper) {
        await ctx.db.patch(paper._id, {
          likeCount: Math.max((paper.likeCount ?? 0) - 1, 0),
        });
      }

      await ctx.db.delete(like._id);
      return { ok: true };
    }

    throw new ConvexError("Unsupported activity type.");
  },
});
