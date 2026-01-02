import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

// ADMIN: List all lessons with pagination
export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("lessons").paginate(args.paginationOpts);
  },
});

// Query para listar todas as lessons (ADMIN - deprecated)
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").take(100);
    return lessons;
  },
});

// Query para listar apenas lessons PUBLICADAS (USER)
export const listPublished = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();
    return lessons;
  },
});

// ADMIN: List lessons by unit with pagination
export const listByUnitPaginated = query({
  args: {
    unitId: v.id("units"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_unitId_and_order", (q) => q.eq("unitId", args.unitId))
      .paginate(args.paginationOpts);
  },
});

// Query para listar lessons de uma unidade específica (deprecated)
export const listByUnit = query({
  args: { unitId: v.id("units") },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unitId_and_order", (q) => q.eq("unitId", args.unitId))
      .take(100);

    return lessons;
  },
});

// Query para listar todas as lessons de uma categoria (ADMIN - mostra todas)
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Use the categoryId index for efficient querying
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_categoryId_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .collect();

    return lessons;
  },
});

// Query para listar apenas lessons PUBLICADAS de uma unidade PUBLICADA (USER)
export const listPublishedByUnit = query({
  args: { unitId: v.id("units") },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Check if unit is published
    const unit = await ctx.db.get(args.unitId);
    if (!unit || !unit.isPublished) {
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

// Query para buscar uma lesson por ID
export const getById = query({
  args: { id: v.id("lessons") },
  returns: v.union(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    return lesson;
  },
});

// Query para buscar uma lesson por slug
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      unitId: v.id("units"),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      bunnyStoragePath: v.optional(v.string()),
      publicUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      durationSeconds: v.number(),
      order_index: v.number(),
      lessonNumber: v.number(),
      isPublished: v.boolean(),
      tags: v.optional(v.array(v.string())),
      videoId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return lesson;
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

// Mutation para criar uma nova lesson
export const create = mutation({
  args: {
    unitId: v.id("units"),
    title: v.string(),
    description: v.string(),
    bunnyStoragePath: v.optional(v.string()),
    publicUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    lessonNumber: v.number(),
    isPublished: v.boolean(),
    tags: v.optional(v.array(v.string())),
    videoId: v.optional(v.string()),
  },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe uma lesson com o mesmo slug
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma aula com este slug");
    }

    // Atomically increment the lesson counter on the unit document
    // to get a unique order_index (prevents race conditions on concurrent creates)
    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Initialize lessonCounter if it doesn't exist (for backward compatibility)
    const currentCounter = unit.lessonCounter ?? 0;
    const nextOrderIndex = currentCounter;

    // Atomically increment both the counter and totalLessonVideos
    await ctx.db.patch(args.unitId, {
      lessonCounter: currentCounter + 1,
      totalLessonVideos: unit.totalLessonVideos + 1,
    });

    const lessonId: Id<"lessons"> = await ctx.db.insert("lessons", {
      unitId: args.unitId,
      categoryId: unit.categoryId, // Denormalized for efficient querying
      title: args.title,
      slug: slug,
      description: args.description,
      bunnyStoragePath: args.bunnyStoragePath,
      publicUrl: args.publicUrl,
      thumbnailUrl: args.thumbnailUrl,
      durationSeconds: args.durationSeconds || 0,
      order_index: nextOrderIndex,
      lessonNumber: args.lessonNumber,
      isPublished: args.isPublished,
      tags: args.tags,
      videoId: args.videoId,
    });

    // Atualizar contentStats se a lesson foi publicada
    if (args.isPublished) {
      await ctx.scheduler.runAfter(0, internal.aggregate.incrementLessons, {
        amount: 1,
      });
    }

    return lessonId;
  },
});

// Mutation para atualizar uma lesson
export const update = mutation({
  args: {
    id: v.id("lessons"),
    unitId: v.id("units"),
    title: v.string(),
    description: v.string(),
    bunnyStoragePath: v.optional(v.string()),
    publicUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    order_index: v.number(),
    lessonNumber: v.number(),
    isPublished: v.boolean(),
    tags: v.optional(v.array(v.string())),
    videoId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe outra lesson com o mesmo slug
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma aula com este slug");
    }

    // Get current lesson to check if publish status changed
    const currentLesson = await ctx.db.get(args.id);
    const wasPublished = currentLesson?.isPublished || false;
    const willBePublished = args.isPublished;

    // Get the unit to get the categoryId
    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    await ctx.db.patch(args.id, {
      unitId: args.unitId,
      categoryId: unit.categoryId, // Update categoryId when unit changes
      title: args.title,
      slug: slug,
      description: args.description,
      bunnyStoragePath: args.bunnyStoragePath,
      publicUrl: args.publicUrl,
      thumbnailUrl: args.thumbnailUrl,
      durationSeconds: args.durationSeconds || 0,
      order_index: args.order_index,
      lessonNumber: args.lessonNumber,
      isPublished: args.isPublished,
      tags: args.tags,
      videoId: args.videoId,
    });

    // Update contentStats if publish status changed
    if (!wasPublished && willBePublished) {
      // Was unpublished, now published
      await ctx.scheduler.runAfter(0, internal.aggregate.incrementLessons, {
        amount: 1,
      });
    } else if (wasPublished && !willBePublished) {
      // Was published, now unpublished
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
        amount: 1,
      });
    }

    return null;
  },
});

// Mutation para deletar uma lesson
export const remove = mutation({
  args: {
    id: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);

    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    const wasPublished = lesson.isPublished;

    await ctx.db.delete(args.id);

    // Atualizar o total de lessons na unidade
    const unit = await ctx.db.get(lesson.unitId);
    if (unit && unit.totalLessonVideos > 0) {
      await ctx.db.patch(lesson.unitId, {
        totalLessonVideos: unit.totalLessonVideos - 1,
      });
    }

    // Update contentStats if lesson was published
    if (wasPublished) {
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
        amount: 1,
      });
    }

    return null;
  },
});

// Mutation para alternar o status de publicação de uma lesson
export const togglePublish = mutation({
  args: {
    id: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);

    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    const newPublishStatus = !lesson.isPublished;

    await ctx.db.patch(args.id, {
      isPublished: newPublishStatus,
    });

    // Update contentStats
    if (newPublishStatus) {
      // Now published
      await ctx.scheduler.runAfter(0, internal.aggregate.incrementLessons, {
        amount: 1,
      });
    } else {
      // Now unpublished
      await ctx.scheduler.runAfter(0, internal.aggregate.decrementLessons, {
        amount: 1,
      });
    }

    return newPublishStatus;
  },
});

// Mutation para reordenar lessons
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("lessons"),
        order_index: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update all lesson order_index
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order_index: update.order_index,
      });
    }

    return null;
  },
});

// Migration: Backfill categoryId for existing lessons
export const backfillCategoryId = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    let updated = 0;
    let skipped = 0;

    for (const lesson of lessons) {
      // Check if categoryId is already set
      if ("categoryId" in lesson && lesson.categoryId) {
        skipped++;
        continue;
      }

      // Get the unit to find the categoryId
      const unit = await ctx.db.get(lesson.unitId);
      if (!unit) {
        console.warn(
          `Unit ${lesson.unitId} not found for lesson ${lesson._id}`,
        );
        skipped++;
        continue;
      }

      // Patch the lesson with the categoryId
      await ctx.db.patch(lesson._id, {
        categoryId: unit.categoryId,
      });
      updated++;
    }

    return { updated, skipped };
  },
});
