import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  transcriptions: defineTable({
    userId: v.optional(v.id("users")),
    originalText: v.string(),
    grammarScore: v.number(),
    feedback: v.string(),
    issues: v.array(v.string()),
    audioFileId: v.optional(v.id("_storage")),
    processingTime: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
