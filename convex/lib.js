import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

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
