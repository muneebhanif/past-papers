import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const normalizeEmail = (value, label = "Email") => {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ConvexError(`${label} is invalid.`);
  }
  return email;
};

export const normalizeOptionalHttpsUrl = (value, label = "URL") => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ConvexError(`${label} is invalid.`);
  }

  if (parsed.protocol !== "https:") {
    throw new ConvexError(`${label} must use HTTPS.`);
  }

  return parsed.toString();
};

export const enforceRateLimit = async (
  ctx,
  { scope, key, windowMs, maxRequests, errorMessage, blockDurationMs = windowMs },
) => {
  const normalizedScope = scope.trim().toLowerCase().slice(0, 80);
  const normalizedKey = String(key).trim().toLowerCase().slice(0, 160);

  if (!normalizedScope || !normalizedKey) {
    throw new ConvexError("Invalid rate limit configuration.");
  }

  const now = Date.now();
  const record = await ctx.db
    .query("rateLimits")
    .withIndex("by_scope_key", (q) => q.eq("scope", normalizedScope).eq("key", normalizedKey))
    .unique();

  if (!record) {
    await ctx.db.insert("rateLimits", {
      scope: normalizedScope,
      key: normalizedKey,
      windowStartedAt: now,
      count: 1,
      updatedAt: now,
    });
    return;
  }

  if ((record.blockedUntil ?? 0) > now) {
    throw new ConvexError(errorMessage);
  }

  if (now - record.windowStartedAt >= windowMs) {
    await ctx.db.patch(record._id, {
      windowStartedAt: now,
      count: 1,
      updatedAt: now,
      blockedUntil: undefined,
    });
    return;
  }

  const nextCount = record.count + 1;
  if (nextCount > maxRequests) {
    await ctx.db.patch(record._id, {
      count: nextCount,
      updatedAt: now,
      blockedUntil: now + blockDurationMs,
    });
    throw new ConvexError(errorMessage);
  }

  await ctx.db.patch(record._id, {
    count: nextCount,
    updatedAt: now,
  });
};

export const ensureAdminFlag = async (ctx, userId) => {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("User not found.");
  }

  const isAdmin = getAdminEmails().includes((user.email ?? "").toLowerCase());

  if (user.isAdmin !== isAdmin) {
    await ctx.db.patch(user._id, { isAdmin });
    return { ...user, isAdmin };
  }

  return user;
};

export const requireUser = async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Authentication required.");
  }

  return ensureAdminFlag(ctx, userId);
};

export const requireAdmin = async (ctx) => {
  const user = await requireUser(ctx);
  if (!user.isAdmin) {
    throw new ConvexError("Admin permissions required.");
  }
  return user;
};
