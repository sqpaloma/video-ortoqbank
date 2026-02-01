import { v } from "convex/values";
import { query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
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
 * List all categories for a tenant, ordered by position (ADMIN - shows all)
 */
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_position", (q) =>
        q.eq("tenantId", args.tenantId),
      )
      .order("asc")
      .collect();

    return categories;
  },
});

/**
 * List only PUBLISHED categories for a tenant (USER - shows only published)
 */
export const listPublished = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_isPublished", (q) =>
        q.eq("tenantId", args.tenantId).eq("isPublished", true),
      )
      .collect();

    // Sort by position
    return categories.sort((a, b) => a.position - b.position);
  },
});

/**
 * Get a category by ID within a specific tenant
 *
 * SECURITY: Always validates that the category belongs to the specified tenant.
 * Returns null if category doesn't exist or belongs to a different tenant.
 *
 * @param id - The category ID
 * @param tenantId - The tenant ID (auto-injected by useTenantQuery)
 * @returns The category if found and owned by tenant, null otherwise
 */
export const getById = query({
  args: {
    id: v.id("categories"),
    tenantId: v.id("tenants"), // Required for tenant isolation
  },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      tenantId: v.id("tenants"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
      isPublished: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);

    // Always verify tenant ownership
    if (!category || category.tenantId !== args.tenantId) {
      return null;
    }

    return category;
  },
});

/**
 * Get a category by slug within a tenant
 */
export const getBySlug = query({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", args.slug),
      )
      .unique();

    return category;
  },
});

/**
 * Get cascade delete info for a category
 */
export const getCascadeDeleteInfo = query({
  args: {
    id: v.id("categories"),
    tenantId: v.id("tenants"),
  },
  returns: v.object({
    unitsCount: v.number(),
    lessonsCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category || category.tenantId !== args.tenantId) {
      throw new Error("Categoria não encontrada");
    }
    // Get all units in this category
    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    const unitsCount = units.length;
    let lessonsCount = 0;

    // Count lessons in all units
    for (const unit of units) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();
      lessonsCount += lessons.length;
    }

    return {
      unitsCount,
      lessonsCount,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Atomically get and increment the category position counter for a tenant.
 * Uses a unique index to ensure single-counter document and atomic patch operations.
 */
async function getNextPosition(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
): Promise<number> {
  // Use tenant-specific counter ID
  const COUNTER_ID = `tenant_${tenantId}`;

  // Query for the counter document using unique index
  let counter = await ctx.db
    .query("categoryPositionCounter")
    .withIndex("by_counterId", (q) => q.eq("counterId", COUNTER_ID))
    .unique();

  // Initialize counter if it doesn't exist
  if (!counter) {
    // Get current max position for this tenant to initialize counter
    const maxPositionCategory = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_position", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .first();
    const initialPosition = (maxPositionCategory?.position ?? 0) + 1;

    // Try to create the counter
    try {
      await ctx.db.insert("categoryPositionCounter", {
        counterId: COUNTER_ID,
        nextPosition: initialPosition,
      });
    } catch {
      // Another request may have created it concurrently, re-query
      counter = await ctx.db
        .query("categoryPositionCounter")
        .withIndex("by_counterId", (q) => q.eq("counterId", COUNTER_ID))
        .unique();

      if (!counter) {
        throw new Error("Failed to initialize position counter");
      }
    }

    // Re-query to get the counter (either we created it or another request did)
    counter = await ctx.db
      .query("categoryPositionCounter")
      .withIndex("by_counterId", (q) => q.eq("counterId", COUNTER_ID))
      .unique();

    if (!counter) {
      throw new Error(
        "Failed to retrieve position counter after initialization",
      );
    }
  }

  // Read current value and compute next
  const currentPosition = counter.nextPosition;
  const nextPosition = currentPosition + 1;

  // Atomically update the counter using patch
  await ctx.db.patch(counter._id, {
    nextPosition: nextPosition,
  });

  return nextPosition;
}

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
 * Create a new category (tenant admin only)
 */
export const create = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Validate input lengths
    if (args.title.trim().length < 3) {
      throw new Error("Título deve ter pelo menos 3 caracteres");
    }

    if (args.description.trim().length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    if (slug.length < 3) {
      throw new Error(
        "Não foi possível gerar um slug válido a partir do título",
      );
    }

    // Check if slug already exists in this tenant
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", slug),
      )
      .first();

    if (existing) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Atomically get the next position using the counter
    const nextPosition = await getNextPosition(ctx, args.tenantId);

    // Insert with the calculated position
    const categoryId = await ctx.db.insert("categories", {
      tenantId: args.tenantId,
      title: args.title,
      slug: slug,
      description: args.description,
      position: nextPosition,
      iconUrl: args.iconUrl,
      isPublished: true, // Default to published
    });

    // Final verification: ensure our inserted category has the expected position
    const insertedCategory = await ctx.db.get(categoryId);
    if (!insertedCategory || insertedCategory.position !== nextPosition) {
      throw new Error(
        "Failed to verify category insertion with expected position",
      );
    }

    return categoryId;
  },
});

/**
 * Update a category (tenant admin only)
 */
export const update = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("categories"),
    title: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Validate input lengths
    if (args.title.trim().length < 3) {
      throw new Error("Título deve ter pelo menos 3 caracteres");
    }

    if (args.description.trim().length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Get current category to verify tenant ownership
    const currentCategory = await ctx.db.get(args.id);
    if (!currentCategory) {
      throw new Error("Categoria não encontrada");
    }

    // Verify category belongs to this tenant
    if (currentCategory.tenantId !== args.tenantId) {
      throw new Error("Categoria não pertence a este tenant");
    }

    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    if (slug.length < 3) {
      throw new Error(
        "Não foi possível gerar um slug válido a partir do título",
      );
    }

    // Check if slug already exists in this tenant (excluding current category)
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_tenantId_and_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", slug),
      )
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Update the category
    await ctx.db.patch(args.id, {
      title: args.title,
      slug: slug,
      description: args.description,
      iconUrl: args.iconUrl,
    });

    return null;
  },
});

/**
 * Delete a category with cascade delete (tenant admin only)
 * OPTIMIZED: Uses batch processing for large cascades to prevent transaction limits
 */
export const remove = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    // Verify category belongs to this tenant
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }
    if (category.tenantId !== args.tenantId) {
      throw new Error("Categoria não pertence a este tenant");
    }

    // Get all units in this category to determine if batch processing is needed
    const allUnits = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    const needsBatchProcessing = allUnits.length > BATCH_SIZE;

    if (needsBatchProcessing) {
      // Schedule cascade delete in batches
      await ctx.scheduler.runAfter(0, internal.categories.deleteCascadeBatch, {
        categoryId: args.id,
      });

      // Delete the category immediately (children will be deleted async)
      await ctx.db.delete(args.id);

      return null;
    }

    // For small cascades, process synchronously
    for (const unit of allUnits) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();

      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }

      await ctx.db.delete(unit._id);
    }

    await ctx.db.delete(args.id);

    return null;
  },
});

/**
 * Internal: Delete units and lessons in batches for a category
 * Called by scheduler when cascade is too large for single transaction
 */
export const deleteCascadeBatch = internalMutationWithTrigger({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get next batch of units to delete
    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .take(BATCH_SIZE);

    if (units.length === 0) {
      // All done
      return null;
    }

    // Delete lessons and units in this batch
    for (const unit of units) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .take(50); // Limit lessons per unit in batch

      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }

      await ctx.db.delete(unit._id);
    }

    // Schedule next batch if there might be more
    if (units.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.categories.deleteCascadeBatch, {
        categoryId: args.categoryId,
      });
    }

    return null;
  },
});

/**
 * Reorder categories (tenant admin only)
 * OPTIMIZED: Limited to 50 categories per operation to prevent transaction limits
 */
export const reorder = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    updates: v.array(
      v.object({
        id: v.id("categories"),
        position: v.number(),
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

    // Verify all categories belong to this tenant
    for (const update of args.updates) {
      const category = await ctx.db.get(update.id);
      if (!category) {
        throw new Error(`Categoria não encontrada: ${update.id}`);
      }
      if (category.tenantId !== args.tenantId) {
        throw new Error("Uma das categorias não pertence a este tenant");
      }
    }

    // Update all category positions
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        position: update.position,
      });
    }

    return null;
  },
});

/**
 * Toggle publish status (cascade to units and lessons) - tenant admin only
 * OPTIMIZED: Uses batch processing for large cascades to prevent transaction limits
 */
export const togglePublish = mutationWithTrigger({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require tenant admin access
    await requireTenantAdmin(ctx, args.tenantId);

    const category = await ctx.db.get(args.id);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    // Verify category belongs to this tenant
    if (category.tenantId !== args.tenantId) {
      throw new Error("Categoria não pertence a este tenant");
    }

    const newPublishStatus = !category.isPublished;

    // Update category immediately
    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    // Get all units in this category to check if batch processing is needed
    const allUnits = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    const needsBatchProcessing = allUnits.length > BATCH_SIZE;

    if (needsBatchProcessing) {
      // Schedule cascade toggle in batches
      await ctx.scheduler.runAfter(
        0,
        internal.categories.togglePublishCascadeBatch,
        {
          categoryId: args.id,
          isPublished: newPublishStatus,
        },
      );

      return newPublishStatus;
    }

    // For small cascades, process synchronously
    for (const unit of allUnits) {
      await ctx.db.patch(unit._id, {
        isPublished: newPublishStatus,
      });

      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();

      for (const lesson of lessons) {
        if (lesson.isPublished !== newPublishStatus) {
          await ctx.db.patch(lesson._id, {
            isPublished: newPublishStatus,
          });
        }
      }
    }

    return newPublishStatus;
  },
});

/**
 * Internal: Toggle publish status for units and lessons in batches
 * Called by scheduler when cascade is too large for single transaction
 */
export const togglePublishCascadeBatch = internalMutationWithTrigger({
  args: {
    categoryId: v.id("categories"),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get units that still need to be updated (those with different publish status)
    const unitsToUpdate = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    // Filter to units that need updating
    const unitsNeedingUpdate = unitsToUpdate.filter(
      (u) => u.isPublished !== args.isPublished,
    );

    if (unitsNeedingUpdate.length === 0) {
      // All done
      return null;
    }

    // Process a batch of units
    const batchUnits = unitsNeedingUpdate.slice(0, BATCH_SIZE);

    for (const unit of batchUnits) {
      await ctx.db.patch(unit._id, {
        isPublished: args.isPublished,
      });

      // Update lessons in this unit
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .take(50); // Limit lessons per unit in batch

      for (const lesson of lessons) {
        if (lesson.isPublished !== args.isPublished) {
          await ctx.db.patch(lesson._id, {
            isPublished: args.isPublished,
          });
        }
      }
    }

    // Schedule next batch if needed
    if (unitsNeedingUpdate.length > BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.categories.togglePublishCascadeBatch,
        {
          categoryId: args.categoryId,
          isPublished: args.isPublished,
        },
      );
    }

    return null;
  },
});
