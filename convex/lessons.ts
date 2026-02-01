import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { requireTenantAdmin } from "./lib/tenantContext";
import { mutationWithTrigger } from "./aggregate";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all lessons for a tenant with pagination (ADMIN)
 */
export const listPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .paginate(args.paginationOpts);
  },
});

/**
 * List all lessons for a tenant (ADMIN - limited to 100)
 */
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .take(100);
    return lessons;
  },
});

/**
 * List only PUBLISHED lessons for a tenant (USER)
 * OPTIMIZED: Uses by_tenantId_isPublished index instead of filtering in memory
 */
export const listPublished = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId_isPublished", (q) =>
        q.eq("tenantId", args.tenantId).eq("isPublished", true),
      )
      .collect();

    return lessons;
  },
});

/**
 * List lessons by unit with pagination (ADMIN)
 */
export const listByUnitPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_tenantId_and_unitId", (q) =>
        q.eq("tenantId", args.tenantId).eq("unitId", args.unitId),
      )
      .paginate(args.paginationOpts);
  },
});

/**
 * List lessons by unit (ADMIN - limited to 100)
 */
export const listByUnit = query({
  args: {
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId_and_unitId", (q) =>
        q.eq("tenantId", args.tenantId).eq("unitId", args.unitId),
      )
      .take(100);

    return lessons;
  },
});

/**
 * List all lessons for a category (ADMIN)
 * OPTIMIZED: Limited to 500 lessons to prevent large reads
 */
export const listByCategory = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Verify category belongs to tenant
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.tenantId !== args.tenantId) {
      return [];
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_categoryId_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .take(500);

    return lessons;
  },
});

/**
 * List only PUBLISHED lessons for a PUBLISHED unit (USER)
 */
export const listPublishedByUnit = query({
  args: {
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    // Check if unit is published and belongs to tenant
    const unit = await ctx.db.get(args.unitId);
    if (!unit || !unit.isPublished || unit.tenantId !== args.tenantId) {
      return [];
    }

    // Check if category is published
    const category = await ctx.db.get(unit.categoryId);
    if (!category || !category.isPublished) {
      return [];
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId_isPublished_order", (q) =>
        q.eq("unitId", args.unitId).eq("isPublished", true),
      )
      .collect();

    return lessons;
  },
});

/**
 * Get a lesson by ID
 */
export const getById = query({
  args: {
    id: v.id("lessons"),
    tenantId: v.optional(v.id("tenants")),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    return lesson;
  },
});

/**
 * Get a lesson by slug within a tenant
 */
export const getBySlug = query({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    // Verify tenant ownership
    if (lesson && lesson.tenantId !== args.tenantId) {
      return null;
    }

    return lesson;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new lesson (tenant admin only)
 */
export const create = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
    title: v.string(),
    description: v.string(),
    videoId: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify unit belongs to this tenant
    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }
    if (unit.tenantId !== args.tenantId) {
      throw new Error("Unidade não pertence a este tenant");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Check if slug already exists
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma aula com este slug");
    }

    // Initialize counters if they don't exist
    const currentOrderCounter = unit.lessonCounter ?? 0;
    const currentNumberCounter = unit.lessonNumberCounter ?? 0;
    const nextOrderIndex = currentOrderCounter;
    const nextLessonNumber = currentNumberCounter + 1;

    // Atomically increment all counters and totalLessonVideos
    await ctx.db.patch(args.unitId, {
      lessonCounter: currentOrderCounter + 1,
      lessonNumberCounter: currentNumberCounter + 1,
      totalLessonVideos: unit.totalLessonVideos + 1,
    });

    const lessonId: Id<"lessons"> = await ctx.db.insert("lessons", {
      tenantId: args.tenantId,
      unitId: args.unitId,
      categoryId: unit.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      videoId: args.videoId,
      thumbnailUrl: args.thumbnailUrl,
      durationSeconds: args.durationSeconds || 0,
      order_index: nextOrderIndex,
      lessonNumber: nextLessonNumber,
      isPublished: args.isPublished,
    });

    return lessonId;
  },
});

/**
 * Update a lesson (tenant admin only)
 */
export const update = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("lessons"),
    unitId: v.id("units"),
    title: v.string(),
    description: v.string(),
    videoId: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    order_index: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify lesson belongs to this tenant
    const currentLesson = await ctx.db.get(args.id);
    if (!currentLesson) {
      throw new Error("Aula não encontrada");
    }
    if (currentLesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    // Verify target unit belongs to this tenant
    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }
    if (unit.tenantId !== args.tenantId) {
      throw new Error("Unidade não pertence a este tenant");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Check if slug already exists (excluding current lesson)
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma aula com este slug");
    }

    await ctx.db.patch(args.id, {
      unitId: args.unitId,
      categoryId: unit.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      videoId: args.videoId,
      thumbnailUrl: args.thumbnailUrl,
      durationSeconds: args.durationSeconds || 0,
      order_index: args.order_index,
      isPublished: args.isPublished,
    });

    return null;
  },
});

/**
 * Delete a lesson (tenant admin only)
 */
export const remove = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const lesson = await ctx.db.get(args.id);

    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Verify lesson belongs to this tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    await ctx.db.delete(args.id);

    // Update the total lessons count on the unit
    const unit = await ctx.db.get(lesson.unitId);
    if (unit && unit.totalLessonVideos > 0) {
      await ctx.db.patch(lesson.unitId, {
        totalLessonVideos: unit.totalLessonVideos - 1,
      });
    }

    return null;
  },
});

/**
 * Toggle publish status (tenant admin only)
 */
export const togglePublish = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const lesson = await ctx.db.get(args.id);

    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Verify lesson belongs to this tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    const newPublishStatus = !lesson.isPublished;

    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    return newPublishStatus;
  },
});

/**
 * Reorder lessons (tenant admin only)
 * Updates both order_index and lessonNumber to keep them in sync
 * OPTIMIZED: Limited to 50 lessons per operation to prevent transaction limits
 */
export const reorder = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    updates: v.array(
      v.object({
        id: v.id("lessons"),
        order_index: v.number(),
        lessonNumber: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // SCALE: Limit the number of updates per operation to prevent transaction limits
    if (args.updates.length > 50) {
      throw new Error(
        "Máximo de 50 itens por operação de reordenação. Para reordenar mais itens, divida em múltiplas operações.",
      );
    }

    // Verify all lessons belong to this tenant
    for (const update of args.updates) {
      const lesson = await ctx.db.get(update.id);
      if (!lesson) {
        throw new Error(`Aula não encontrada: ${update.id}`);
      }
      if (lesson.tenantId !== args.tenantId) {
        throw new Error("Uma das aulas não pertence a este tenant");
      }
    }

    // Update all lesson order_index and lessonNumber
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order_index: update.order_index,
        lessonNumber: update.lessonNumber,
      });
    }

    return null;
  },
});

/**
 * Migration: Backfill categoryId and tenantId for existing lessons
 */
export const backfillCategoryId = mutationWithTrigger({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    let updated = 0;
    let skipped = 0;

    for (const lesson of lessons) {
      if ("categoryId" in lesson && lesson.categoryId) {
        skipped++;
        continue;
      }

      const unit = await ctx.db.get(lesson.unitId);
      if (!unit) {
        console.warn(
          `Unit ${lesson.unitId} not found for lesson ${lesson._id}`,
        );
        skipped++;
        continue;
      }

      await ctx.db.patch(lesson._id, {
        categoryId: unit.categoryId,
      });
      updated++;
    }

    return { updated, skipped };
  },
});

/**
 * Migration: Initialize lessonNumberCounter for existing units
 */
export const backfillLessonNumberCounter = mutationWithTrigger({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const units = await ctx.db
      .query("units")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    let updated = 0;
    let skipped = 0;

    for (const unit of units) {
      if (
        unit.lessonNumberCounter !== undefined &&
        unit.lessonNumberCounter !== null
      ) {
        skipped++;
        continue;
      }

      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();

      const maxLessonNumber = lessons.reduce(
        (max, lesson) => Math.max(max, lesson.lessonNumber),
        0,
      );

      await ctx.db.patch(unit._id, {
        lessonNumberCounter: maxLessonNumber,
      });
      updated++;
    }

    return { updated, skipped };
  },
});
