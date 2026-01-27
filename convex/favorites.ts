import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

/**
 * Favorites - Optimized with batch gets (tenant-scoped)
 */

export const addFavorite = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.id("favorites"),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Aula não encontrada");

    // Verify lesson belongs to tenant
    if (lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não pertence a este tenant");
    }

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    const found = existing.find((f) => f.lessonId === args.lessonId);
    if (found) return found._id;

    const favoriteId: Id<"favorites"> = await ctx.db.insert("favorites", {
      tenantId: args.tenantId,
      userId: args.userId,
      lessonId: args.lessonId,
    });

    return favoriteId;
  },
});

export const removeFavorite = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    const favorite = favorites.find((f) => f.lessonId === args.lessonId);

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return null;
  },
});

export const toggleFavorite = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    const existing = favorites.find((f) => f.lessonId === args.lessonId);

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      const lesson = await ctx.db.get(args.lessonId);
      if (!lesson) throw new Error("Aula não encontrada");

      // Verify lesson belongs to tenant
      if (lesson.tenantId !== args.tenantId) {
        throw new Error("Aula não pertence a este tenant");
      }

      await ctx.db.insert("favorites", {
        tenantId: args.tenantId,
        userId: args.userId,
        lessonId: args.lessonId,
      });
      return true;
    }
  },
});

export const isFavorited = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    return favorites.some((f) => f.lessonId === args.lessonId);
  },
});

export const getUserFavorites = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      tenantId: v.id("tenants"),
      userId: v.string(),
      lessonId: v.id("lessons"),
    }),
  ),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    return favorites;
  },
});

/**
 * Get favorite lessons with full details (PAGINATED)
 * OPTIMIZED: Uses batch gets instead of N+1 queries
 */
export const getUserFavoriteLessons = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("favorites"),
        _creationTime: v.number(),
        lesson: v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          tenantId: v.id("tenants"),
          unitId: v.id("units"),
          categoryId: v.id("categories"),
          title: v.string(),
          slug: v.string(),
          description: v.string(),
          videoId: v.optional(v.string()),
          thumbnailUrl: v.optional(v.string()),
          durationSeconds: v.number(),
          order_index: v.number(),
          lessonNumber: v.number(),
          isPublished: v.boolean(),
        }),
        unit: v.object({
          _id: v.id("units"),
          _creationTime: v.number(),
          tenantId: v.id("tenants"),
          categoryId: v.id("categories"),
          title: v.string(),
          slug: v.string(),
          description: v.string(),
          order_index: v.number(),
          totalLessonVideos: v.number(),
          lessonCounter: v.optional(v.number()),
          lessonNumberCounter: v.optional(v.number()),
          isPublished: v.boolean(),
        }),
        category: v.object({
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
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get all favorites for this tenant/user first
    const allFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .order("desc")
      .collect();

    // Manual pagination
    const numToSkip = args.paginationOpts.numItems
      ? args.paginationOpts.cursor
        ? parseInt(args.paginationOpts.cursor as string)
        : 0
      : 0;
    const favorites = allFavorites.slice(
      numToSkip,
      numToSkip + (args.paginationOpts.numItems || 10),
    );

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
    const page = [];
    for (let i = 0; i < favorites.length; i++) {
      const favorite = favorites[i];
      const lesson = lessons[i];
      if (!lesson) continue;

      const unit = units.find((u) => u?._id === lesson.unitId);
      if (!unit) continue;

      const category = categories.find((c) => c?._id === unit.categoryId);
      if (!category) continue;

      page.push({
        _id: favorite._id,
        _creationTime: favorite._creationTime,
        lesson,
        unit,
        category,
      });
    }

    const hasMore = numToSkip + favorites.length < allFavorites.length;

    return {
      page,
      isDone: !hasMore,
      continueCursor: hasMore
        ? String(numToSkip + favorites.length)
        : undefined,
    };
  },
});

export const getFavoritesCount = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    return favorites.length;
  },
});

export const getLessonFavoritesCount = query({
  args: {
    tenantId: v.id("tenants"),
    lessonId: v.id("lessons"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Filter by tenant
    return favorites.filter((f) => f.tenantId === args.tenantId).length;
  },
});

export const clearUserFavorites = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_tenantId_and_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId),
      )
      .collect();

    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    return favorites.length;
  },
});
