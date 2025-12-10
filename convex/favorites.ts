import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Add a lesson to user's favorites
 */
export const addFavorite = mutation({
  args: {
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  },
  returns: v.id("favorites"),
  handler: async (ctx, args) => {
    // Check if lesson exists
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Aula não encontrada");
    }

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (existing) {
      // Already favorited, return existing ID
      return existing._id;
    }

    // Create new favorite
    const favoriteId: Id<"favorites"> = await ctx.db.insert("favorites", {
      userId: args.userId,
      lessonId: args.lessonId,
    });

    return favoriteId;
  },
});

/**
 * Remove a lesson from user's favorites
 */
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
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return null;
  },
});

/**
 * Toggle favorite status (add if not favorited, remove if favorited)
 */
export const toggleFavorite = mutation({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(), // true if favorited, false if unfavorited
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // Check if lesson exists
      const lesson = await ctx.db.get(args.lessonId);
      if (!lesson) {
        throw new Error("Aula não encontrada");
      }

      // Add favorite
      await ctx.db.insert("favorites", {
        userId: args.userId,
        lessonId: args.lessonId,
      });
      return true;
    }
  },
});

/**
 * Check if a lesson is favorited by a user
 */
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
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    return !!favorite;
  },
});

/**
 * Get all favorites for a user
 */
export const getUserFavorites = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
    })
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
 * Get all favorite lessons with full lesson details for a user
 */
export const getUserFavoriteLessons = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      lesson: v.object({
        _id: v.id("lessons"),
        _creationTime: v.number(),
        moduleId: v.id("modules"),
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
      module: v.object({
        _id: v.id("modules"),
        _creationTime: v.number(),
        categoryId: v.id("categories"),
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        order_index: v.number(),
        totalLessonVideos: v.number(),
        isPublished: v.boolean(),
        lessonCounter: v.number(),
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
    })
  ),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const favoritesWithDetails = await Promise.all(
      favorites.map(async (favorite) => {
        const lesson = await ctx.db.get(favorite.lessonId);
        if (!lesson) {
          return null;
        }

        const module = await ctx.db.get(lesson.moduleId);
        if (!module) {
          return null;
        }

        const category = await ctx.db.get(module.categoryId);
        if (!category) {
          return null;
        }

        return {
          _id: favorite._id,
          _creationTime: favorite._creationTime,
          lesson,
          module,
          category,
        };
      })
    );

    // Filter out null values (lessons that were deleted)
    return favoritesWithDetails.filter((f) => f !== null) as Array<{
      _id: Id<"favorites">;
      _creationTime: number;
      lesson: {
        _id: Id<"lessons">;
        _creationTime: number;
        moduleId: Id<"modules">;
        title: string;
        slug: string;
        description: string;
        bunnyStoragePath?: string;
        publicUrl?: string;
        thumbnailUrl?: string;
        durationSeconds: number;
        order_index: number;
        lessonNumber: number;
        isPublished: boolean;
        tags?: string[];
        videoId?: string;
      };
      module: {
        _id: Id<"modules">;
        _creationTime: number;
        categoryId: Id<"categories">;
        title: string;
        slug: string;
        description: string;
        order_index: number;
        totalLessonVideos: number;
        isPublished: boolean;
        lessonCounter: number;
      };
      category: {
        _id: Id<"categories">;
        _creationTime: number;
        title: string;
        slug: string;
        description: string;
        position: number;
        iconUrl?: string;
        isPublished: boolean;
      };
    }>;
  },
});

/**
 * Get count of favorites for a user
 */
export const getFavoritesCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return favorites.length;
  },
});

/**
 * Get count of how many users favorited a specific lesson
 */
export const getLessonFavoritesCount = query({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    return favorites.length;
  },
});

/**
 * Remove all favorites for a user (useful for cleanup/testing)
 */
export const clearUserFavorites = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.number(), // returns count of removed favorites
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

