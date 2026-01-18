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

/**
 * Get all ratings with user and lesson information (admin only)
 */
export const getAllRatingsWithDetails = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessonRatings"),
      _creationTime: v.number(),
      userId: v.string(),
      lessonId: v.id("lessons"),
      unitId: v.id("units"),
      rating: v.number(),
      createdAt: v.number(),
      userName: v.string(),
      userEmail: v.string(),
      lessonTitle: v.string(),
      unitTitle: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const ratings = await ctx.db.query("lessonRatings").order("desc").collect();

    const ratingsWithDetails = await Promise.all(
      ratings.map(async (rating) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", rating.userId),
          )
          .first();

        const lesson = await ctx.db.get(rating.lessonId);
        const unit = await ctx.db.get(rating.unitId);

        return {
          _id: rating._id,
          _creationTime: rating._creationTime,
          userId: rating.userId,
          lessonId: rating.lessonId,
          unitId: rating.unitId,
          rating: rating.rating,
          createdAt: rating.createdAt,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : "Usuário desconhecido",
          userEmail: user?.email || "N/A",
          lessonTitle: lesson?.title || "Aula não encontrada",
          unitTitle: unit?.title || "Unidade não encontrada",
        };
      }),
    );

    return ratingsWithDetails;
  },
});
