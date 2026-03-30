import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
  })
    .index("username", ["username"])
    .index("email", ["email"])
    .index("phone", ["phone"]),

  adminSessions: defineTable({
    token: v.string(),
    email: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  papers: defineTable({
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
    uploadedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewNote: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_status_type_createdAt", ["status", "type", "createdAt"])
    .index("by_department_status_createdAt", ["department", "status", "createdAt"])
    .index("by_department_status_type_createdAt", ["department", "status", "type", "createdAt"])
    .index("by_uploadedBy_createdAt", ["uploadedBy", "createdAt"]),

  comments: defineTable({
    paperId: v.id("papers"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_paperId_createdAt", ["paperId", "createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  likes: defineTable({
    paperId: v.id("papers"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_paperId", ["paperId", "createdAt"])
    .index("by_paperId_userId", ["paperId", "userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    actorId: v.id("users"),
    paperId: v.id("papers"),
    type: v.union(v.literal("like"), v.literal("comment")),
    content: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_read_createdAt", ["userId", "read", "createdAt"]),

  uploadAuthLogs: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId_createdAt", ["userId", "createdAt"]),
});
