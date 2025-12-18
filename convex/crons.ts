import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/**
 * Cron Jobs for automatic cleanup and maintenance
 */

const crons = cronJobs();

// Clean old recent views (older than 30 days) - runs daily at 3am
crons.daily(
  "clean-old-recent-views",
  { hourUTC: 3, minuteUTC: 0 },
  internal.crons.cleanOldRecentViews
);

// Clean orphaned progress records - runs weekly on Monday at 4am
crons.weekly(
  "clean-orphaned-progress",
  { dayOfWeek: "monday", hourUTC: 4, minuteUTC: 0 },
  internal.crons.cleanOrphanedProgress
);

export default crons;

/**
 * Clean recentViews older than 30 days
 */
export const cleanOldRecentViews = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const oldViews = await ctx.db
      .query("recentViews")
      .filter(q => q.lt(q.field("viewedAt"), thirtyDaysAgo))
      .collect();

    let deletedCount = 0;
    for (const view of oldViews) {
      await ctx.db.delete(view._id);
      deletedCount++;
    }

    console.log(`Cleaned ${deletedCount} old recent views`);
    return { deletedCount };
  },
});

/**
 * Clean orphaned progress records (lessons/units that no longer exist)
 */
export const cleanOrphanedProgress = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deletedProgressCount = 0;
    let deletedUnitProgressCount = 0;

    // Clean userProgress with deleted lessons
    const allProgress = await ctx.db.query("userProgress").take(1000);
    
    for (const progress of allProgress) {
      const lesson = await ctx.db.get(progress.lessonId);
      if (!lesson) {
        await ctx.db.delete(progress._id);
        deletedProgressCount++;
      }
    }

    // Clean unitProgress with deleted units
    const allUnitProgress = await ctx.db.query("unitProgress").take(500);
    
    for (const unitProg of allUnitProgress) {
      const unit = await ctx.db.get(unitProg.unitId);
      if (!unit) {
        await ctx.db.delete(unitProg._id);
        deletedUnitProgressCount++;
      }
    }

    console.log(`Cleaned ${deletedProgressCount} orphaned progress, ${deletedUnitProgressCount} orphaned unit progress`);
    return { deletedProgressCount, deletedUnitProgressCount };
  },
});
