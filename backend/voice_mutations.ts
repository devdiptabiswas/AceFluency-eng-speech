import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveTranscription = mutation({
  args: {
    originalText: v.string(),
    grammarScore: v.number(),
    feedback: v.string(),
    issues: v.array(v.string()),
    audioFileId: v.id("_storage"),
    processingTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    return await ctx.db.insert("transcriptions", {
      userId: userId || undefined,
      originalText: args.originalText,
      grammarScore: args.grammarScore,
      feedback: args.feedback,
      issues: args.issues,
      audioFileId: args.audioFileId,
      processingTime: args.processingTime,
    });
  },
});

export const getRecentTranscriptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("transcriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
