import { type MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getTotalLessonsCount } from "../aggregate";

/**
 * Helper function to update unit and global progress
 */
export async function updateUnitAndGlobalProgress(
  ctx: MutationCtx,
  userId: string,
  unitId: Id<"units">,
) {
  const now = Date.now();

  // Update unitProgress
  const unit = await ctx.db.get(unitId);
  if (unit) {
    const completedLessonsInUnit = await ctx.db
      .query("userProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unitId),
      )
      .collect();

    const completedCount = completedLessonsInUnit.filter(
      (p) => p.completed,
    ).length;
    const progressPercent =
      unit.totalLessonVideos > 0
        ? Math.round((completedCount / unit.totalLessonVideos) * 100)
        : 0;

    const unitProgressDoc = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unitId),
      )
      .unique();

    if (!unitProgressDoc) {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId,
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
  }

  // Update userGlobalProgress
  const allCompletedLessons = await ctx.db
    .query("userProgress")
    .withIndex("by_userId_and_completed", (q) =>
      q.eq("userId", userId).eq("completed", true),
    )
    .collect();

  const totalCompletedCount = allCompletedLessons.length;

  // Get total lessons from aggregate
  const totalLessonsInSystem = await getTotalLessonsCount(ctx);
  const globalProgressPercent =
    totalLessonsInSystem > 0
      ? Math.round((totalCompletedCount / totalLessonsInSystem) * 100)
      : 0;

  const globalProgressDoc = await ctx.db
    .query("userGlobalProgress")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (!globalProgressDoc) {
    await ctx.db.insert("userGlobalProgress", {
      userId,
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
}
