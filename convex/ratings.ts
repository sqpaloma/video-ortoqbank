import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Submit or update rating for a lesson
 */
export const submitRating = mutation({
  args: {
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    rating: v.number(), // 1-5
  },
  returns: v.id("lessonRatings"),
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating deve ser entre 1 e 5");
    }

    // Check if user already rated this lesson
    const existingRating = await ctx.db
      .query("lessonRatings")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .first();

    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        createdAt: Date.now(),
      });
      return existingRating._id;
    } else {
      // Create new rating
      const ratingId = await ctx.db.insert("lessonRatings", {
        userId: args.userId,
        lessonId: args.lessonId,
        unitId: args.unitId,
        rating: args.rating,
        createdAt: Date.now(),
      });
      return ratingId;
    }
  },
});

/**
 * Get user's rating for a lesson
 */
export const getUserRating = query({
  args: {
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      _id: v.id("lessonRatings"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      unitId: v.id("units"),
      rating: v.number(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const rating = await ctx.db
      .query("lessonRatings")
      .withIndex("by_userId_and_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId),
      )
      .first();

    return rating || null;
  },
});

/**
 * Get average rating for a lesson
 */
export const getLessonAverageRating = query({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.object({
    average: v.number(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("lessonRatings")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      count: ratings.length,
    };
  },
});
