import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

/**
 * Submit or update rating for a lesson (tenant-scoped)
 */
export const submitRating = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    rating: v.number(), // 1-5
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating deve ser entre 1 e 5");
    }

    // Verify lesson belongs to tenant
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.tenantId !== args.tenantId) {
      throw new Error("Aula não encontrada ou não pertence a este tenant");
    }

    // Check if user already rated this lesson in this tenant
    const existingRatings = await ctx.db
      .query("lessonRatings")
      .withIndex("by_tenantId_and_lessonId", (q) =>
        q.eq("tenantId", args.tenantId).eq("lessonId", args.lessonId),
      )
      .collect();

    const existingRating = existingRatings.find(
      (r) => r.userId === args.userId,
    );

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
        tenantId: args.tenantId,
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
    tenantId: v.id("tenants"),
    userId: v.string(),
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.object({
      _id: v.id("lessonRatings"),
      _creationTime: v.number(),
      createdAt: v.number(),
      userId: v.string(),
      tenantId: v.id("tenants"),
      unitId: v.id("units"),
      lessonId: v.id("lessons"),
      rating: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("lessonRatings")
      .withIndex("by_tenantId_and_lessonId", (q) =>
        q.eq("tenantId", args.tenantId).eq("lessonId", args.lessonId),
      )
      .collect();

    const rating = ratings.find((r) => r.userId === args.userId);
    return rating || null;
  },
});

/**
 * Get average rating for a lesson
 */
export const getLessonAverageRating = query({
  args: {
    tenantId: v.id("tenants"),
    lessonId: v.id("lessons"),
  },
  returns: v.object({
    average: v.number(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("lessonRatings")
      .withIndex("by_tenantId_and_lessonId", (q) =>
        q.eq("tenantId", args.tenantId).eq("lessonId", args.lessonId),
      )
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
 * Get all ratings with user and lesson information (tenant admin only) - Paginated
 */
export const getAllRatingsWithDetails = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
  },

  returns: v.object({
    page: v.array(
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
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Get all ratings for this tenant
    const paginatedRatings = await ctx.db
      .query("lessonRatings")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")

      .paginate(args.paginationOpts);

    const ratings = paginatedRatings.page;

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

    return {
      page: ratingsWithDetails,
      isDone: paginatedRatings.isDone,
      continueCursor: paginatedRatings.continueCursor,
    };
  },
});
