import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Submit feedback for a lesson
 */
export const submitFeedback = mutation({
  args: {
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.feedback || args.feedback.trim().length === 0) {
      throw new Error("Feedback não pode estar vazio");
    }

    const feedbackId = await ctx.db.insert("lessonFeedback", {
      userId: args.userId,
      lessonId: args.lessonId,
      unitId: args.unitId,
      feedback: args.feedback.trim(),
      createdAt: Date.now(),
    });

    return feedbackId;
  },
});

/**
 * Get feedback for a lesson
 */
export const getFeedbackByLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const feedbacks = await ctx.db
      .query("lessonFeedback")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .order("desc")
      .collect();

    return feedbacks;
  },
});

/**
 * Get user's feedback for a lesson
 */
export const getUserFeedback = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("lessonFeedback")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .first();

    return feedback || null;
  },
});
