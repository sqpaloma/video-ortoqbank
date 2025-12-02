import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Mark a lesson as completed for a user
 * This will update userProgress, moduleProgress, and userGlobalProgress atomically
 */
export const markLessonCompleted = mutation({
  args: {
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the lesson to find its moduleId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Check if already completed
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    const now = Date.now();

    // Create or update userProgress
    if (!existingProgress) {
      await ctx.db.insert("userProgress", {
        userId: args.userId,
        lessonId: args.lessonId,
        moduleId: lesson.moduleId,
        completed: true,
        completedAt: now,
      });
    } else if (!existingProgress.completed) {
      await ctx.db.patch(existingProgress._id, {
        completed: true,
        completedAt: now,
      });
    } else {
      // Already completed, nothing to do
      return null;
    }

    // Update moduleProgress
    const module = await ctx.db.get(lesson.moduleId);
    if (!module) {
      throw new Error("Módulo não encontrado");
    }

    const moduleProgressDoc = await ctx.db
      .query("moduleProgress")
      .withIndex("by_userId_and_moduleId", (q) =>
        q.eq("userId", args.userId).eq("moduleId", lesson.moduleId)
      )
      .unique();

    const completedLessonsInModule = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_moduleId", (q) =>
        q.eq("userId", args.userId).eq("moduleId", lesson.moduleId)
      )
      .collect();

    const completedCount = completedLessonsInModule.filter(
      (p) => p.completed
    ).length;
    const progressPercent =
      module.totalLessonVideos > 0
        ? Math.round((completedCount / module.totalLessonVideos) * 100)
        : 0;

    if (!moduleProgressDoc) {
      await ctx.db.insert("moduleProgress", {
        userId: args.userId,
        moduleId: lesson.moduleId,
        completedLessonsCount: completedCount,
        totalLessonVideos: module.totalLessonVideos,
        progressPercent,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(moduleProgressDoc._id, {
        completedLessonsCount: completedCount,
        totalLessonVideos: module.totalLessonVideos,
        progressPercent,
        updatedAt: now,
      });
    }

    // Update userGlobalProgress
    const allCompletedLessons = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .collect();

    const totalCompletedCount = allCompletedLessons.length;

    // Get total lessons from contentStats
    const contentStats = await ctx.db.query("contentStats").first();
    const totalLessonsInSystem = contentStats?.totalLessons || 0;
    const globalProgressPercent =
      totalLessonsInSystem > 0
        ? Math.round((totalCompletedCount / totalLessonsInSystem) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!globalProgressDoc) {
      await ctx.db.insert("userGlobalProgress", {
        userId: args.userId,
        completedLessonsCount: totalCompletedCount,
        progressPercent: globalProgressPercent,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(globalProgressDoc._id, {
        completedLessonsCount: totalCompletedCount,
        progressPercent: globalProgressPercent,
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Mark a lesson as incomplete (undo completion)
 */
export const markLessonIncomplete = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the lesson to find its moduleId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Find and update userProgress
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (!existingProgress || !existingProgress.completed) {
      // Already incomplete or doesn't exist
      return null;
    }

    await ctx.db.patch(existingProgress._id, {
      completed: false,
      completedAt: undefined,
    });

    const now = Date.now();

    // Update moduleProgress
    const module = await ctx.db.get(lesson.moduleId);
    if (module) {
      const completedLessonsInModule = await ctx.db
        .query("userProgress")
        .withIndex("by_userId_and_moduleId", (q) =>
          q.eq("userId", args.userId).eq("moduleId", lesson.moduleId)
        )
        .collect();

      const completedCount = completedLessonsInModule.filter(
        (p) => p.completed
      ).length;
      const progressPercent =
        module.totalLessonVideos > 0
          ? Math.round((completedCount / module.totalLessonVideos) * 100)
          : 0;

      const moduleProgressDoc = await ctx.db
        .query("moduleProgress")
        .withIndex("by_userId_and_moduleId", (q) =>
          q.eq("userId", args.userId).eq("moduleId", lesson.moduleId)
        )
        .unique();

      if (moduleProgressDoc) {
        await ctx.db.patch(moduleProgressDoc._id, {
          completedLessonsCount: completedCount,
          progressPercent,
          updatedAt: now,
        });
      }
    }

    // Update userGlobalProgress
    const allCompletedLessons = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .collect();

    const totalCompletedCount = allCompletedLessons.length;

    const allLessons = await ctx.db
      .query("lessons")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    const totalLessonsInSystem = allLessons.length;
    const globalProgressPercent =
      totalLessonsInSystem > 0
        ? Math.round((totalCompletedCount / totalLessonsInSystem) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (globalProgressDoc) {
      await ctx.db.patch(globalProgressDoc._id, {
        completedLessonsCount: totalCompletedCount,
        progressPercent: globalProgressPercent,
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Get user progress for a specific lesson
 */
export const getLessonProgress = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      _id: v.id("userProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      moduleId: v.id("modules"),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    return progress;
  },
});

/**
 * Get user progress for a specific module
 */
export const getModuleProgress = query({
  args: {
    userId: v.string(),
    moduleId: v.id("modules"),
  },
  returns: v.union(
    v.object({
      _id: v.id("moduleProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      moduleId: v.id("modules"),
      completedLessonsCount: v.number(),
      totalLessonVideos: v.number(),
      progressPercent: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("moduleProgress")
      .withIndex("by_userId_and_moduleId", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
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
  returns: v.union(
    v.object({
      _id: v.id("userGlobalProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      completedLessonsCount: v.number(),
      progressPercent: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return progress;
  },
});

/**
 * Get all lesson progress for a user in a specific module
 */
export const getModuleLessonsProgress = query({
  args: {
    userId: v.string(),
    moduleId: v.id("modules"),
  },
  returns: v.array(
    v.object({
      _id: v.id("userProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      moduleId: v.id("modules"),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_moduleId", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
      )
      .collect();

    return progress;
  },
});

/**
 * Get all module progress for a user
 */
export const getAllModuleProgress = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("moduleProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      moduleId: v.id("modules"),
      completedLessonsCount: v.number(),
      totalLessonVideos: v.number(),
      progressPercent: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("moduleProgress")
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
  returns: v.array(
    v.object({
      _id: v.id("userProgress"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      moduleId: v.id("modules"),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .collect();

    return progress;
  },
});

/**
 * Initialize or recalculate global progress for a user
 * Useful for migrations or fixing inconsistencies
 */
export const recalculateGlobalProgress = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all completed lessons
    const allCompletedLessons = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .collect();

    const totalCompletedCount = allCompletedLessons.length;

    // Get total lessons from contentStats
    const contentStats = await ctx.db.query("contentStats").first();
    const totalLessonsInSystem = contentStats?.totalLessons || 0;
    const globalProgressPercent =
      totalLessonsInSystem > 0
        ? Math.round((totalCompletedCount / totalLessonsInSystem) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!globalProgressDoc) {
      await ctx.db.insert("userGlobalProgress", {
        userId: args.userId,
        completedLessonsCount: totalCompletedCount,
        progressPercent: globalProgressPercent,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(globalProgressDoc._id, {
        completedLessonsCount: totalCompletedCount,
        progressPercent: globalProgressPercent,
        updatedAt: now,
      });
    }

    return null;
  },
});

