import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  papers: defineTable({
    title: v.string(),
    subject: v.string(),
    teacher: v.string(),
    year: v.string(),
    type: v.string(),
    department: v.string(),
    imageUrl: v.string(),
    uploadedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
  })
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_department_status_createdAt", ["department", "status", "createdAt"])
    .index("by_uploadedBy_createdAt", ["uploadedBy", "createdAt"]),

  comments: defineTable({
    paperId: v.id("papers"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_paperId_createdAt", ["paperId", "createdAt"]),

  likes: defineTable({
    paperId: v.id("papers"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_paperId", ["paperId", "createdAt"])
    .index("by_paperId_userId", ["paperId", "userId"]),

  uploadAuthLogs: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId_createdAt", ["userId", "createdAt"]),
});
