import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get user progress for a specific lesson
 */
export const getLessonProgress = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .unique();

    return progress;
  },
});

/**
 * Get user progress for a specific unit
 */
export const getUnitProgress = query({
  args: {
    userId: v.string(),
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", args.userId).eq("unitId", args.unitId),
      )
      .unique();

    return progress;
  },
});

/**
 * Get global progress for a user
 */
export const getGlobalProgress = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return progress;
  },
});

/**
 * Get all lesson progress for a user in a specific unit
 */
export const getUnitLessonsProgress = query({
  args: {
    userId: v.string(),
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", args.userId).eq("unitId", args.unitId),
      )
      .collect();

    return progress;
  },
});

/**
 * Get all unit progress for a user
 */
export const getAllUnitProgress = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return progress;
  },
});

/**
 * Get all completed lessons for a user
 */
export const getCompletedLessons = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true),
      )
      .collect();

    return progress;
  },
});

/**
 * Get count of completed published lessons
 * OPTIMIZED: Uses userGlobalProgress aggregate table
 */
export const getCompletedPublishedLessonsCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the aggregate table instead of counting manually
    const globalProgress = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return globalProgress?.completedLessonsCount || 0;
  },
});

/**
 * OPTIMIZED: Get unit progress for specific category only
 * Reduces data load from all 1000 units to ~100 per category
 */
export const getUnitProgressByCategory = query({
  args: {
    userId: v.string(),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Get units for this category
    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .take(200);

    const unitIds = new Set(units.map((u) => u._id));

    // Get progress only for these units
    const allProgress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return allProgress.filter((p) => unitIds.has(p.unitId));
  },
});

/**
 * OPTIMIZED: Get completed lessons for specific category only
 */
export const getCompletedLessonsByCategory = query({
  args: {
    userId: v.string(),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Get lessons for this category
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .take(1000);

    const lessonIds = new Set(lessons.map((l) => l._id));

    // Get completed progress only for these lessons
    const allProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true),
      )
      .collect();

    return allProgress.filter((p) => lessonIds.has(p.lessonId));
  },
});
