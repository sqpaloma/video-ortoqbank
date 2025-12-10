import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Add a recent view for a user
 */
export const addView = mutation({
  args: {
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    action: v.union(v.literal("started"), v.literal("resumed"), v.literal("completed")),
  },
  returns: v.id("recentViews"),
  handler: async (ctx, args) => {
    // Check if lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Check if module exists
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new Error("Módulo não encontrado");
    }

    const now = Date.now();

    // Create new view record
    const viewId: Id<"recentViews"> = await ctx.db.insert("recentViews", {
      userId: args.userId,
      lessonId: args.lessonId,
      moduleId: args.moduleId,
      viewedAt: now,
      action: args.action,
    });

    return viewId;
  },
});

/**
 * Get recent views for a user (most recent first)
 */
export const getRecentViews = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()), // default 10
  },
  returns: v.array(
    v.object({
      _id: v.id("recentViews"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      moduleId: v.id("modules"),
      viewedAt: v.number(),
      action: v.union(v.literal("started"), v.literal("resumed"), v.literal("completed")),
    })
  ),
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

/**
 * Get recent views with full lesson and module details
 */
export const getRecentViewsWithDetails = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("recentViews"),
      _creationTime: v.number(),
      viewedAt: v.number(),
      action: v.union(v.literal("started"), v.literal("resumed"), v.literal("completed")),
      isCompleted: v.boolean(),
      lesson: v.object({
        _id: v.id("lessons"),
        _creationTime: v.number(),
        moduleId: v.id("modules"),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        bunnyStoragePath: v.optional(v.string()),
        publicUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        durationSeconds: v.number(),
        order_index: v.number(),
        lessonNumber: v.number(),
        isPublished: v.boolean(),
        tags: v.optional(v.array(v.string())),
        videoId: v.optional(v.string()),
      }),
      module: v.object({
        _id: v.id("modules"),
        _creationTime: v.number(),
        categoryId: v.id("categories"),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        order_index: v.number(),
        totalLessonVideos: v.number(),
        isPublished: v.boolean(),
        lessonCounter: v.number(),
      }),
      category: v.object({
        _id: v.id("categories"),
        _creationTime: v.number(),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        position: v.number(),
        iconUrl: v.optional(v.string()),
        isPublished: v.boolean(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all views for the user
    const allViews = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Group by lessonId and keep only the most recent view per lesson
    const lessonViewMap = new Map<string, typeof allViews[0]>();
    for (const view of allViews) {
      const lessonIdStr = view.lessonId;
      if (!lessonViewMap.has(lessonIdStr)) {
        lessonViewMap.set(lessonIdStr, view);
      }
    }

    // Get the most recent unique lessons, limited by the limit parameter
    const uniqueViews = Array.from(lessonViewMap.values())
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, limit);

    const viewsWithDetails = await Promise.all(
      uniqueViews.map(async (view) => {
        const lesson = await ctx.db.get(view.lessonId);
        if (!lesson) {
          return null;
        }

        const module = await ctx.db.get(view.moduleId);
        if (!module) {
          return null;
        }

        const category = await ctx.db.get(module.categoryId);
        if (!category) {
          return null;
        }

        // Get the user's progress for this lesson to check if it's completed
        const progress = await ctx.db
          .query("userProgress")
          .withIndex("by_userId_and_lessonId", (q) =>
            q.eq("userId", args.userId).eq("lessonId", view.lessonId)
          )
          .unique();

        const isCompleted = progress?.completed || false;

        return {
          _id: view._id,
          _creationTime: view._creationTime,
          viewedAt: view.viewedAt,
          action: view.action,
          isCompleted,
          lesson,
          module,
          category,
        };
      })
    );

    // Filter out null values (deleted lessons/modules/categories)
    return viewsWithDetails.filter((v) => v !== null) as Array<{
      _id: Id<"recentViews">;
      _creationTime: number;
      viewedAt: number;
      action: "started" | "resumed" | "completed";
      isCompleted: boolean;
      lesson: {
        _id: Id<"lessons">;
        _creationTime: number;
        moduleId: Id<"modules">;
        title: string;
        slug: string;
        description: string;
        bunnyStoragePath?: string;
        publicUrl?: string;
        thumbnailUrl?: string;
        durationSeconds: number;
        order_index: number;
        lessonNumber: number;
        isPublished: boolean;
        tags?: string[];
        videoId?: string;
      };
      module: {
        _id: Id<"modules">;
        _creationTime: number;
        categoryId: Id<"categories">;
        title: string;
        slug: string;
        description: string;
        order_index: number;
        totalLessonVideos: number;
        isPublished: boolean;
        lessonCounter: number;
      };
      category: {
        _id: Id<"categories">;
        _creationTime: number;
        title: string;
        slug: string;
        description: string;
        position: number;
        iconUrl?: string;
        isPublished: boolean;
      };
    }>;
  },
});

/**
 * Clear old views for a user (keep only most recent N)
 */
export const clearOldViews = mutation({
  args: {
    userId: v.string(),
    keepCount: v.number(), // How many to keep
  },
  returns: v.number(), // number of deleted views
  handler: async (ctx, args) => {
    const allViews = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_viewedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Delete views beyond the keepCount
    const viewsToDelete = allViews.slice(args.keepCount);
    
    for (const view of viewsToDelete) {
      await ctx.db.delete(view._id);
    }

    return viewsToDelete.length;
  },
});

/**
 * Get last view for a specific lesson by a user
 */
export const getLastViewForLesson = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      _id: v.id("recentViews"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      moduleId: v.id("modules"),
      viewedAt: v.number(),
      action: v.union(v.literal("started"), v.literal("resumed"), v.literal("completed")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("recentViews")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .order("desc")
      .first();

    return views || null;
  },
});

/**
 * Clear all views for a user
 */
export const clearAllViews = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.number(), // number of deleted views
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

/**
 * Get count of unique viewed lessons
 */
export const getUniqueViewedLessonsCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const allViews = await ctx.db
      .query("recentViews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get unique lesson IDs
    const uniqueLessonIds = new Set<string>();
    
    for (const view of allViews) {
      const lesson = await ctx.db.get(view.lessonId);
      // Only count if lesson still exists
      if (lesson) {
        uniqueLessonIds.add(view.lessonId);
      }
    }

    return uniqueLessonIds.size;
  },
});

