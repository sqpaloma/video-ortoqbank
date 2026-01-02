import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

// Query para listar todas as categorias ordenadas por position (ADMIN - mostra todas)
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_position")
      .order("asc")
      .collect();

    return categories;
  },
});

// Query para listar apenas categorias PUBLICADAS (USER - mostra apenas publicadas)
export const listPublished = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    // Sort by position
    return categories.sort((a, b) => a.position - b.position);
  },
});

// Query para buscar uma categoria por ID
export const getById = query({
  args: { id: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
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
    return category;
  },
});

// Query para buscar uma categoria por slug
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
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
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return category;
  },
});

/**
 * Atomically get and increment the category position counter.
 * Uses a unique index to ensure single-counter document and atomic patch operations.
 */
async function getNextPosition(ctx: MutationCtx): Promise<number> {
  const COUNTER_ID = "global";

  // Query for the counter document using unique index
  let counter = await ctx.db
    .query("categoryPositionCounter")
    .withIndex("by_counterId", (q) => q.eq("counterId", COUNTER_ID))
    .unique();

  // Initialize counter if it doesn't exist
  if (!counter) {
    // Get current max position to initialize counter
    const maxPositionCategory = await ctx.db
      .query("categories")
      .withIndex("by_position")
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

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mutation para criar uma nova categoria
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
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

    // Verificar se já existe uma categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Atomically get the next position using the counter
    const nextPosition = await getNextPosition(ctx);

    // Insert with the calculated position
    const categoryId = await ctx.db.insert("categories", {
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

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.aggregate.incrementCategories, {
      amount: 1,
    });

    return categoryId;
  },
});

// Mutation para atualizar uma categoria
export const update = mutation({
  args: {
    id: v.id("categories"),
    title: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

    // Verificar se já existe outra categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Get current category to preserve position
    const currentCategory = await ctx.db.get(args.id);
    if (!currentCategory) {
      throw new Error("Categoria não encontrada");
    }

    // Prepare update object
    // Note: iconUrl is always included (even if undefined) to allow clearing the icon
    await ctx.db.patch(args.id, {
      title: args.title,
      slug: slug,
      description: args.description,
      iconUrl: args.iconUrl,
    });

    return null;
  },
});

// Query para obter informações sobre exclusão em cascata
export const getCascadeDeleteInfo = query({
  args: { id: v.id("categories") },
  returns: v.object({
    unitsCount: v.number(),
    lessonsCount: v.number(),
  }),
  handler: async (ctx, args) => {
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

// Mutation para deletar uma categoria (cascade delete)
export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all units in this category
    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    let totalPublishedLessons = 0;

    // Delete all lessons in all units
    for (const unit of units) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();

      for (const lesson of lessons) {
        if (lesson.isPublished) {
          totalPublishedLessons++;
        }
        await ctx.db.delete(lesson._id);
      }

      // Delete the unit
      await ctx.db.delete(unit._id);
    }

    // Delete the category
    await ctx.db.delete(args.id);

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.aggregate.decrementCategories, {
      amount: 1,
    });
    if (units.length > 0) {
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementUnits, {
        amount: units.length,
      });
    }
    if (totalPublishedLessons > 0) {
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
        amount: totalPublishedLessons,
      });
    }

    return null;
  },
});

// Mutation para reordenar categorias
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("categories"),
        position: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update all category positions
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        position: update.position,
      });
    }

    return null;
  },
});

// Mutation para alternar publicação de categoria (cascade)
export const togglePublish = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const newPublishStatus = !category.isPublished;

    // Update category
    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    // Get all units in this category

    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    let publishedLessonsChange = 0;

    // Update all units and their lessons
    for (const unit of units) {
      // Update unit
      await ctx.db.patch(unit._id, {
        isPublished: newPublishStatus,
      });

      // Get and update all lessons in this unit
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_unitId", (q) => q.eq("unitId", unit._id))
        .collect();

      for (const lesson of lessons) {
        // Only count if changing from published to unpublished or vice versa
        if (lesson.isPublished !== newPublishStatus) {
          await ctx.db.patch(lesson._id, {
            isPublished: newPublishStatus,
          });
          publishedLessonsChange += newPublishStatus ? 1 : -1;
        }
      }
    }

    // Update contentStats if there were changes
    if (publishedLessonsChange !== 0) {
      if (publishedLessonsChange > 0) {
        await ctx.scheduler.runAfter(0, internal.aggregate.incrementLessons, {
          amount: publishedLessonsChange,
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
          amount: Math.abs(publishedLessonsChange),
        });
      }
    }

    return newPublishStatus;
  },
});
