import { v } from "convex/values";
import { updateUnitAndGlobalProgress } from "./helpers";
import {
  mutationWithTrigger,
  totalLessonsPerTenant,
  completedLessonsPerUser,
  completedLessonsPerUserPerUnit,
} from "../aggregate";

/**
 * Mark a lesson as completed for a user within a tenant
 * This will update userProgress, unitProgress, and userGlobalProgress atomically
 */
export const markLessonCompleted = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // Get the lesson to find its unitId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Verify lesson belongs to this tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    // Check if already completed
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_tenantId_and_userId_and_lessonId", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId),
      )
      .unique();

    const now = Date.now();

    // Create or update userProgress
    if (!existingProgress) {
      await ctx.db.insert("userProgress", {
        tenantId: args.tenantId,
        userId: args.userId,
        lessonId: args.lessonId,
        unitId: lesson.unitId,
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

    // Update unitProgress
    const unit = await ctx.db.get(lesson.unitId);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    const unitProgressDoc = await ctx.db
      .query("unitProgress")
      .withIndex("by_tenantId_and_userId_and_unitId", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("userId", args.userId)
          .eq("unitId", lesson.unitId),
      )
      .unique();

    // Get completed count from aggregate for O(log n) lookup
    const completedCount = await completedLessonsPerUserPerUnit.sum(ctx, {
      namespace: [args.tenantId, args.userId, lesson.unitId],
    });
    const progressPercent =
      unit.totalLessonVideos > 0
        ? Math.round((completedCount / unit.totalLessonVideos) * 100)
        : 0;

    if (!unitProgressDoc) {
      await ctx.db.insert("unitProgress", {
        tenantId: args.tenantId,
        userId: args.userId,
        unitId: lesson.unitId,
        completedLessonsCount: completedCount,
        totalLessonVideos: unit.totalLessonVideos,
        progressPercent,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(unitProgressDoc._id, {
        completedLessonsCount: completedCount,
        totalLessonVideos: unit.totalLessonVideos,
        progressPercent,
        updatedAt: now,
      });
    }

    // Update userGlobalProgress using aggregates for O(log n) lookup
    const totalCompletedCount = await completedLessonsPerUser.sum(ctx, {
      namespace: [args.tenantId, args.userId],
    });

    // Get total lessons from aggregate (per tenant)
    const totalLessonsInTenant = await totalLessonsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });
    const globalProgressPercent =
      totalLessonsInTenant > 0
        ? Math.round((totalCompletedCount / totalLessonsInTenant) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .unique();

    if (!globalProgressDoc) {
      await ctx.db.insert("userGlobalProgress", {
        tenantId: args.tenantId,
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
export const markLessonIncomplete = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // Get the lesson to find its unitId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Verify lesson belongs to this tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    // Find and update userProgress
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_tenantId_and_userId_and_lessonId", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId),
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

    // Update unitProgress using aggregate for O(log n) lookup
    const unit = await ctx.db.get(lesson.unitId);
    if (unit) {
      const completedCount = await completedLessonsPerUserPerUnit.sum(ctx, {
        namespace: [args.tenantId, args.userId, lesson.unitId],
      });
      const progressPercent =
        unit.totalLessonVideos > 0
          ? Math.round((completedCount / unit.totalLessonVideos) * 100)
          : 0;

      const unitProgressDoc = await ctx.db
        .query("unitProgress")
        .withIndex("by_tenantId_and_userId_and_unitId", (q) =>
          q
            .eq("tenantId", args.tenantId)
            .eq("userId", args.userId)
            .eq("unitId", lesson.unitId),
        )
        .unique();

      if (unitProgressDoc) {
        await ctx.db.patch(unitProgressDoc._id, {
          completedLessonsCount: completedCount,
          progressPercent,
          updatedAt: now,
        });
      }
    }

    // Update userGlobalProgress using aggregates for O(log n) lookup
    const totalCompletedCount = await completedLessonsPerUser.sum(ctx, {
      namespace: [args.tenantId, args.userId],
    });

    // Get total lessons from aggregate (per tenant)
    const totalLessonsInTenant = await totalLessonsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });
    const globalProgressPercent =
      totalLessonsInTenant > 0
        ? Math.round((totalCompletedCount / totalLessonsInTenant) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
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
 * Initialize or recalculate global progress for a user in a tenant
 */
export const recalculateGlobalProgress = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get completed count from aggregate for O(log n) lookup
    const totalCompletedCount = await completedLessonsPerUser.sum(ctx, {
      namespace: [args.tenantId, args.userId],
    });

    // Get total lessons from aggregate (per tenant)
    const totalLessonsInTenant = await totalLessonsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });
    const globalProgressPercent =
      totalLessonsInTenant > 0
        ? Math.round((totalCompletedCount / totalLessonsInTenant) * 100)
        : 0;

    const globalProgressDoc = await ctx.db
      .query("userGlobalProgress")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .unique();

    if (!globalProgressDoc) {
      await ctx.db.insert("userGlobalProgress", {
        tenantId: args.tenantId,
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
 * Save video progress (current time, duration, and auto-complete if >90%)
 * This is called periodically from the video player
 */
export const saveVideoProgress = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
    currentTimeSec: v.number(),
    durationSec: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the lesson to find its unitId
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Verify lesson belongs to this tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    const now = Date.now();

    // Calculate if video should be marked as completed (>90%)
    const progressPercent =
      args.durationSec > 0 ? args.currentTimeSec / args.durationSec : 0;
    const shouldComplete = progressPercent >= 0.9;

    // Check if progress exists
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_tenantId_and_userId_and_lessonId", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId),
      )
      .unique();

    if (!existingProgress) {
      // Create new progress record
      await ctx.db.insert("userProgress", {
        tenantId: args.tenantId,
        userId: args.userId,
        lessonId: args.lessonId,
        unitId: lesson.unitId,
        completed: shouldComplete,
        completedAt: shouldComplete ? now : undefined,
        currentTimeSec: args.currentTimeSec,
        durationSec: args.durationSec,
        updatedAt: now,
      });

      // If marking as completed, update unit and global progress
      if (shouldComplete) {
        await updateUnitAndGlobalProgress(
          ctx,
          args.tenantId,
          args.userId,
          lesson.unitId,
        );
      }
    } else {
      // Update existing progress
      const wasCompleted = existingProgress.completed;

      await ctx.db.patch(existingProgress._id, {
        currentTimeSec: args.currentTimeSec,
        durationSec: args.durationSec,
        completed: shouldComplete || wasCompleted,
        completedAt:
          shouldComplete && !wasCompleted ? now : existingProgress.completedAt,
        updatedAt: now,
      });

      // If newly completed (wasn't completed before), update unit and global progress
      if (shouldComplete && !wasCompleted) {
        await updateUnitAndGlobalProgress(
          ctx,
          args.tenantId,
          args.userId,
          lesson.unitId,
        );
      }
    }

    return null;
  },
});
