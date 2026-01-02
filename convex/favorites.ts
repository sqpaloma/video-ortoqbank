import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Favorites - Optimized with batch gets
 */

export const addFavorite = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.id("favorites"),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Aula não encontrada");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (existing) return existing._id;

    const favoriteId: Id<"favorites"> = await ctx.db.insert("favorites", {
      userId: args.userId,
      lessonId: args.lessonId,
    });

    return favoriteId;
  },
});

export const removeFavorite = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return null;
  },
});

export const toggleFavorite = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      const lesson = await ctx.db.get(args.lessonId);
      if (!lesson) throw new Error("Aula não encontrada");

      await ctx.db.insert("favorites", {
        userId: args.userId,
        lessonId: args.lessonId,
      });
      return true;
    }
  },
});

export const isFavorited = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .unique();

    return !!favorite;
  },
});

export const getUserFavorites = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
    }),
  ),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return favorites;
  },
});

/**
 * Get favorite lessons with full details
 * OPTIMIZED: Uses batch gets instead of N+1 queries
 */
export const getUserFavoriteLessons = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      lesson: v.object({
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
      unit: v.object({
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
      category: v.object({
        _id: v.id("categories"),
        _creationTime: v.number(),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        position: v.number(),
        iconUrl: v.optional(v.string()),
        isPublished: v.boolean(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // BEFORE: Loop with individual gets (N+1 problem)
    // AFTER: Batch gets

    // Batch 1: Get all lessons
    const lessons = await Promise.all(
      favorites.map((f) => ctx.db.get(f.lessonId)),
    );
    const validLessons = lessons.filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );

    // Batch 2: Get all units
    const units = await Promise.all(
      validLessons.map((l) => ctx.db.get(l.unitId)),
    );
    const validUnits = units.filter(
      (u): u is NonNullable<typeof u> => u !== null,
    );

    // Batch 3: Get all categories
    const categories = await Promise.all(
      validUnits.map((u) => ctx.db.get(u.categoryId)),
    );

    // Build result
    const result = [];
    for (let i = 0; i < favorites.length; i++) {
      const favorite = favorites[i];
      const lesson = lessons[i];
      if (!lesson) continue;

      const unit = units.find((u) => u?._id === lesson.unitId);
      if (!unit) continue;

      const category = categories.find((c) => c?._id === unit.categoryId);
      if (!category) continue;

      result.push({
        _id: favorite._id,
        _creationTime: favorite._creationTime,
        lesson,
        unit,
        category,
      });
    }

    return result;
  },
});

export const getFavoritesCount = query({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return favorites.length;
  },
});

export const getLessonFavoritesCount = query({
  args: { lessonId: v.id("lessons") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    return favorites.length;
  },
});

export const clearUserFavorites = mutation({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    return favorites.length;
  },
});
