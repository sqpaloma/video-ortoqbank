import { type MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { totalLessonsPerTenant } from "../aggregate";

/**
 * Helper function to update unit and global progress for a tenant
 */
export async function updateUnitAndGlobalProgress(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  userId: string,
  unitId: Id<"units">,
) {
  const now = Date.now();

  // Update unitProgress
  const unit = await ctx.db.get(unitId);
  if (unit) {
    const completedLessonsInUnit = await ctx.db
      .query("userProgress")
      .withIndex("by_tenantId_and_userId_and_lessonId", (q) =>
        q.eq("tenantId", tenantId).eq("userId", userId),
      )
      .collect();

    // Filter to this unit only
    const lessonsInThisUnit = completedLessonsInUnit.filter(
      (p) => p.unitId === unitId,
    );

    const completedCount = lessonsInThisUnit.filter((p) => p.completed).length;
    const progressPercent =
      unit.totalLessonVideos > 0
        ? Math.round((completedCount / unit.totalLessonVideos) * 100)
        : 0;

    const unitProgressDoc = await ctx.db
      .query("unitProgress")
      .withIndex("by_tenantId_and_userId_and_unitId", (q) =>
        q.eq("tenantId", tenantId).eq("userId", userId).eq("unitId", unitId),
      )
      .unique();

    if (!unitProgressDoc) {
      await ctx.db.insert("unitProgress", {
        tenantId,
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

  // Update userGlobalProgress for this tenant
  const allCompletedLessons = await ctx.db
    .query("userProgress")
    .withIndex("by_tenantId_and_userId", (q) =>
      q.eq("tenantId", tenantId).eq("userId", userId),
    )
    .collect();

  const totalCompletedCount = allCompletedLessons.filter(
    (p) => p.completed,
  ).length;

  // Get total lessons from aggregate (per tenant)
  const totalLessonsInTenant = await totalLessonsPerTenant.count(ctx, {
    namespace: tenantId,
  });
  const globalProgressPercent =
    totalLessonsInTenant > 0
      ? Math.round((totalCompletedCount / totalLessonsInTenant) * 100)
      : 0;

  const globalProgressDoc = await ctx.db
    .query("userGlobalProgress")
    .withIndex("by_tenantId_and_userId", (q) =>
      q.eq("tenantId", tenantId).eq("userId", userId),
    )
    .unique();

  if (!globalProgressDoc) {
    await ctx.db.insert("userGlobalProgress", {
      tenantId,
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
