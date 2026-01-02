import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

// ADMIN: List all units with pagination
export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("units").paginate(args.paginationOpts);
  },
});

// Query para listar todas as unidades (ADMIN - deprecated, use listPaginated)
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    // DEPRECATED: Use listPaginated for better performance
    const units = await ctx.db.query("units").take(100); // Limited to 100
    return units;
  },
});

// Query para listar apenas unidades PUBLICADAS (USER)
export const listPublished = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const units = await ctx.db
      .query("units")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();
    return units;
  },
});

// ADMIN: List units by category with pagination
export const listByCategoryPaginated = query({
  args: {
    categoryId: v.id("categories"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("units")
      .withIndex("by_categoryId_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .paginate(args.paginationOpts);
  },
});

// Query para listar unidades de uma categoria específica (ADMIN - deprecated)
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("units")
      .withIndex("by_categoryId_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .take(100);

    return units;
  },
});

// Query para listar apenas unidades PUBLICADAS de uma categoria PUBLICADA (USER)
export const listPublishedByCategory = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    // Check if category is published
    const category = await ctx.db.get(args.categoryId);
    if (!category || !category.isPublished) {
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

// Query para buscar uma unidade por ID
export const getById = query({
  args: { id: v.id("units") },
  returns: v.union(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.id);
    return unit;
  },
});

// Query para buscar uma unidade por slug
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("units"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
      isPublished: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return unit;
  },
});

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mutation para criar uma nova unidade
export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
  },
  returns: v.id("units"),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe uma unidade com o mesmo slug
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

    // Get category to inherit isPublished status
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const unitId: Id<"units"> = await ctx.db.insert("units", {
      categoryId: args.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      order_index: nextOrderIndex,
      totalLessonVideos: 0,
      lessonCounter: 0,
      isPublished: category.isPublished ?? true, // Inherit from category, default to true
    });

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.aggregate.incrementUnits, {
      amount: 1,
    });

    return unitId;
  },
});

// Mutation para atualizar uma unidade
export const update = mutation({
  args: {
    id: v.id("units"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
    order_index: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe outra unidade com o mesmo slug
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

// Query para obter informações sobre exclusão em cascata
export const getCascadeDeleteInfo = query({
  args: { id: v.id("units") },
  returns: v.object({
    lessonsCount: v.number(),
  }),
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

// Mutation para deletar uma unidade (cascade delete)
export const remove = mutation({
  args: {
    id: v.id("units"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all lessons in this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    let publishedLessonsCount = 0;

    // Delete all lessons
    for (const lesson of lessons) {
      if (lesson.isPublished) {
        publishedLessonsCount++;
      }
      await ctx.db.delete(lesson._id);
    }

    // Delete the unit
    await ctx.db.delete(args.id);

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.aggregate.decrementUnits, {
      amount: 1,
    });
    if (publishedLessonsCount > 0) {
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
        amount: publishedLessonsCount,
      });
    }

    return null;
  },
});

// Mutation para reordenar unidades
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("units"),
        order_index: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update all unit order_index
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order_index: update.order_index,
      });
    }

    return null;
  },
});

// Mutation para alternar publicação de unidade (cascade)
export const togglePublish = mutation({
  args: {
    id: v.id("units"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.id);

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    const newPublishStatus = !unit.isPublished;

    // Update unit
    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    // Get and update all lessons in this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    let publishedLessonsChange = 0;

    for (const lesson of lessons) {
      // Only count if changing from published to unpublished or vice versa
      if (lesson.isPublished !== newPublishStatus) {
        await ctx.db.patch(lesson._id, {
          isPublished: newPublishStatus,
        });
        publishedLessonsChange += newPublishStatus ? 1 : -1;
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
