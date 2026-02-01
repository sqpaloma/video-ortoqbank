import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { requireTenantAdmin } from "./lib/tenantContext";
import {
  mutationWithTrigger,
  internalMutationWithTrigger,
} from "./aggregate";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of documents to process per batch in cascade operations.
 * This prevents hitting Convex transaction limits.
 */
const BATCH_SIZE = 25;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all units for a tenant with pagination (ADMIN)
 */
export const listPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("units")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .paginate(args.paginationOpts);
  },
});

/**
 * List all units for a tenant (ADMIN - limited to 100)
 */
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("units")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .take(100);
    return units;
  },
});

/**
 * List only PUBLISHED units for a tenant (USER)
 * OPTIMIZED: Uses by_tenantId_and_isPublished index instead of filtering in memory
 */
export const listPublished = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("units")
      .withIndex("by_tenantId_and_isPublished", (q) =>
        q.eq("tenantId", args.tenantId).eq("isPublished", true),
      )
      .collect();

    return units;
  },
});

/**
 * List units by category with pagination (ADMIN)
 */
export const listByCategoryPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("units")
      .withIndex("by_tenantId_and_categoryId", (q) =>
        q.eq("tenantId", args.tenantId).eq("categoryId", args.categoryId),
      )
      .paginate(args.paginationOpts);
  },
});

/**
 * List units by category (ADMIN - limited to 100)
 */
export const listByCategory = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("units")
      .withIndex("by_tenantId_and_categoryId", (q) =>
        q.eq("tenantId", args.tenantId).eq("categoryId", args.categoryId),
      )
      .take(100);

    return units;
  },
});

/**
 * List only PUBLISHED units for a PUBLISHED category (USER)
 */
export const listPublishedByCategory = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Check if category is published
    const category = await ctx.db.get(args.categoryId);
    if (!category || !category.isPublished) {
      return [];
    }

    // Verify category belongs to tenant
    if (category.tenantId !== args.tenantId) {
      return [];
    }

    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId_and_isPublished", (q) =>
        q.eq("categoryId", args.categoryId).eq("isPublished", true),
      )
      .collect();

    return units;
  },
});

/**
 * Get a unit by ID
 */
export const getById = query({
  args: {
    id: v.id("units"),
    tenantId: v.optional(v.id("tenants")),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.id);
    return unit;
  },
});

/**
 * Get a unit by slug within a tenant
 */
export const getBySlug = query({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: We don't have a by_tenantId_and_slug index, so we filter after query
    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    // Verify tenant ownership
    if (unit && unit.tenantId !== args.tenantId) {
      return null;
    }

    return unit;
  },
});

/**
 * Get cascade delete info for a unit
 */
export const getCascadeDeleteInfo = query({
  args: { id: v.id("units") },
  handler: async (ctx, args) => {
    // Count lessons in this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    return {
      lessonsCount: lessons.length,
    };
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
 * Create a new unit (tenant admin only)
 */
export const create = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify category belongs to this tenant
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }
    if (category.tenantId !== args.tenantId) {
      throw new Error("Categoria não pertence a este tenant");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Check if slug already exists
    const existing = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma unidade com este slug");
    }

    // Auto-calculate next order_index for this category
    const unitsInCategory = await ctx.db
      .query("units")
      .withIndex("by_categoryId_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .collect();

    const maxOrderIndex = unitsInCategory.reduce(
      (max, unit) => Math.max(max, unit.order_index),
      -1,
    );
    const nextOrderIndex = maxOrderIndex + 1;

    const unitId: Id<"units"> = await ctx.db.insert("units", {
      tenantId: args.tenantId,
      categoryId: args.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      order_index: nextOrderIndex,
      totalLessonVideos: 0,
      lessonCounter: 0,
      lessonNumberCounter: 0,
      isPublished: category.isPublished ?? true,
    });

    return unitId;
  },
});

/**
 * Update a unit (tenant admin only)
 */
export const update = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("units"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
    order_index: v.number(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify unit belongs to this tenant
    const unit = await ctx.db.get(args.id);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }
    if (unit.tenantId !== args.tenantId) {
      throw new Error("Unidade não pertence a este tenant");
    }

    // Verify target category belongs to this tenant
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }
    if (category.tenantId !== args.tenantId) {
      throw new Error("Categoria não pertence a este tenant");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Check if slug already exists (excluding current unit)
    const existing = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma unidade com este slug");
    }

    await ctx.db.patch(args.id, {
      categoryId: args.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      order_index: args.order_index,
    });

    return null;
  },
});

/**
 * Delete a unit with cascade delete (tenant admin only)
 * OPTIMIZED: Uses batch processing for large cascades to prevent transaction limits
 */
export const remove = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("units"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify unit belongs to this tenant
    const unit = await ctx.db.get(args.id);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }
    if (unit.tenantId !== args.tenantId) {
      throw new Error("Unidade não pertence a este tenant");
    }

    // Get all lessons in this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    const needsBatchProcessing = lessons.length > BATCH_SIZE;

    if (needsBatchProcessing) {
      // Schedule cascade delete in batches
      await ctx.scheduler.runAfter(0, internal.units.deleteLessonsBatch, {
        unitId: args.id,
      });

      // Delete the unit immediately (lessons will be deleted async)
      await ctx.db.delete(args.id);

      return null;
    }

    // For small cascades, process synchronously
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    await ctx.db.delete(args.id);

    return null;
  },
});

/**
 * Internal: Delete lessons in batches for a unit
 * Called by scheduler when cascade is too large for single transaction
 */
export const deleteLessonsBatch = internalMutationWithTrigger({
  args: {
    unitId: v.id("units"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get next batch of lessons to delete
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.unitId))
      .take(BATCH_SIZE);

    if (lessons.length === 0) {
      // All done
      return null;
    }

    // Delete lessons in this batch
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    // Schedule next batch if there might be more
    if (lessons.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.units.deleteLessonsBatch, {
        unitId: args.unitId,
      });
    }

    return null;
  },
});

/**
 * Reorder units (tenant admin only)
 * OPTIMIZED: Limited to 50 units per operation to prevent transaction limits
 */
export const reorder = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    updates: v.array(
      v.object({
        id: v.id("units"),
        order_index: v.number(),
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

    // Verify all units belong to this tenant
    for (const update of args.updates) {
      const unit = await ctx.db.get(update.id);
      if (!unit) {
        throw new Error(`Unidade não encontrada: ${update.id}`);
      }
      if (unit.tenantId !== args.tenantId) {
        throw new Error("Uma das unidades não pertence a este tenant");
      }
    }

    // Update all unit order_index
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order_index: update.order_index,
      });
    }

    return null;
  },
});

/**
 * Toggle publish status (cascade to lessons) - tenant admin only
 * OPTIMIZED: Uses batch processing for large cascades to prevent transaction limits
 */
export const togglePublish = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("units"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const unit = await ctx.db.get(args.id);

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Verify unit belongs to this tenant
    if (unit.tenantId !== args.tenantId) {
      throw new Error("Unidade não pertence a este tenant");
    }

    const newPublishStatus = !unit.isPublished;

    // Update unit immediately
    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    // Get all lessons in this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    const needsBatchProcessing = lessons.length > BATCH_SIZE;

    if (needsBatchProcessing) {
      // Schedule cascade toggle in batches
      await ctx.scheduler.runAfter(
        0,
        internal.units.togglePublishLessonsBatch,
        {
          unitId: args.id,
          isPublished: newPublishStatus,
        },
      );

      return newPublishStatus;
    }

    // For small cascades, process synchronously
    for (const lesson of lessons) {
      if (lesson.isPublished !== newPublishStatus) {
        await ctx.db.patch(lesson._id, {
          isPublished: newPublishStatus,
        });
      }
    }

    return newPublishStatus;
  },
});

/**
 * Internal: Toggle publish status for lessons in batches
 * Called by scheduler when cascade is too large for single transaction
 */
export const togglePublishLessonsBatch = internalMutationWithTrigger({
  args: {
    unitId: v.id("units"),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get lessons that still need to be updated
    const lessonsToUpdate = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.unitId))
      .collect();

    // Filter to lessons that need updating
    const lessonsNeedingUpdate = lessonsToUpdate.filter(
      (l) => l.isPublished !== args.isPublished,
    );

    if (lessonsNeedingUpdate.length === 0) {
      // All done
      return null;
    }

    // Process a batch of lessons
    const batchLessons = lessonsNeedingUpdate.slice(0, BATCH_SIZE);

    for (const lesson of batchLessons) {
      await ctx.db.patch(lesson._id, {
        isPublished: args.isPublished,
      });
    }

    // Schedule next batch if needed
    if (lessonsNeedingUpdate.length > BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.units.togglePublishLessonsBatch,
        {
          unitId: args.unitId,
          isPublished: args.isPublished,
        },
      );
    }

    return null;
  },
});
