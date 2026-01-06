import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Recent Views - Optimized with batch gets and limited queries
 */

/**
 * Add a recent view for a user
 */
export const addView = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    action: v.union(
      v.literal("started"),
      v.literal("resumed"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Aula não encontrada");

    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new Error("Unidade não encontrada");

    const viewId: Id<"recentViews"> = await ctx.db.insert("recentViews", {
      userId: args.userId,
      lessonId: args.lessonId,
      unitId: args.unitId,
      viewedAt: Date.now(),
      action: args.action,
    });

    return viewId;
  },
});

export const clearOldViews = mutation({
  args: {
    userId: v.string(),
    keepCount: v.number(),
  },
  handler: async (ctx, args) => {
    const allViews = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const viewsToDelete = allViews.slice(args.keepCount);

    for (const view of viewsToDelete) {
      await ctx.db.delete(view._id);
    }

    return viewsToDelete.length;
  },
});

export const clearAllViews = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("recentViews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    return views.length;
  },
});

export const getRecentViews = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const views = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return views;
  },
});

export const getRecentViewsWithDetails = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // BEFORE: .collect() loaded ALL views (could be thousands!)
    // AFTER: .take(50) limits to max 50 recent views
    const allViews = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    // Group by lessonId and keep only most recent view per lesson
    const lessonViewMap = new Map<string, (typeof allViews)[0]>();
    for (const view of allViews) {
      if (!lessonViewMap.has(view.lessonId)) {
        lessonViewMap.set(view.lessonId, view);
      }
    }

    const uniqueViews = Array.from(lessonViewMap.values())
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, limit);

    // BEFORE: N individual gets inside Promise.all (still N+1!)
    // AFTER: Batch all gets together properly

    // Batch 1: Get all lessons
    const lessons = await Promise.all(
      uniqueViews.map((v) => ctx.db.get(v.lessonId)),
    );
    const validLessons = lessons.filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );

    // Batch 2: Get all units
    const units = await Promise.all(
      validLessons.map((l) => ctx.db.get(l.unitId)),
    );
    const validUnits = units.filter(
      (u): u is NonNullable<typeof u> => u !== null,
    );

    // Batch 3: Get all categories
    const categories = await Promise.all(
      validUnits.map((u) => ctx.db.get(u.categoryId)),
    );

    // Batch 4: Get all progress in parallel
    const progressResults = await Promise.all(
      uniqueViews.map((v) =>
        ctx.db
          .query("userProgress")
          .withIndex("by_userId_and_lessonId", (q) =>
            q.eq("userId", args.userId).eq("lessonId", v.lessonId),
          )
          .unique(),
      ),
    );

    // Build result
    const result = [];
    for (let i = 0; i < uniqueViews.length; i++) {
      const view = uniqueViews[i];
      const lesson = lessons[i];
      if (!lesson) continue;

      const unit = units.find((u) => u?._id === lesson.unitId);
      if (!unit) continue;

      const category = categories.find((c) => c?._id === unit.categoryId);
      if (!category) continue;

      result.push({
        _id: view._id,
        _creationTime: view._creationTime,
        viewedAt: view.viewedAt,
        action: view.action,
        isCompleted: progressResults[i]?.completed || false,
        lesson,
        unit,
        category,
      });
    }

    return result;
  },
});

export const getLastViewForLesson = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .order("desc")
      .first();

    return views || null;
  },
});

export const getUniqueViewedLessonsCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("recentViews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);

    const uniqueLessonIds = new Set(views.map((v) => v.lessonId));
    return uniqueLessonIds.size;
  },
});
