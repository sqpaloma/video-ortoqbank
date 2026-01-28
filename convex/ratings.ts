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
    rating: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ), // 1-5
  },
  handler: async (ctx, args) => {
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
      .unique();

    if (existingRatings) {
      // Update existing rating
      await ctx.db.patch(existingRatings._id, {
        rating: args.rating,
      });
      return existingRatings._id;
    } else {
      // Create new rating
      const ratingId = await ctx.db.insert("lessonRatings", {
        tenantId: args.tenantId,
        userId: args.userId,
        lessonId: args.lessonId,
        unitId: args.unitId,
        rating: args.rating,
      });
      return ratingId;
    }
  },
});

export const getUserRating = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  },
  returns: v.union(
    v.literal(1),
    v.literal(2),
    v.literal(3),
    v.literal(4),
    v.literal(5),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const rating = await ctx.db
      .query("lessonRatings")
      .withIndex("by_tenantId_and_lessonId", (q) =>
        q.eq("tenantId", args.tenantId).eq("lessonId", args.lessonId),
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    return rating?.rating ?? null;
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
 * Get all categories with their average ratings (tenant admin)
 * Returns: categoryId, title, average, ratingCount
 */
export const getCategoriesWithAverageRatings = query({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.array(
    v.object({
      categoryId: v.id("categories"),
      title: v.string(),
      average: v.number(),
      ratingCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all categories for tenant
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // For each category, calculate average rating across all its lessons
    const categoriesWithRatings = await Promise.all(
      categories.map(async (category) => {
        // Get all lessons for this category
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
          .collect();

        // Get all ratings for these lessons
        let totalRating = 0;
        let ratingCount = 0;

        for (const lesson of lessons) {
          const ratings = await ctx.db
            .query("lessonRatings")
            .withIndex("by_tenantId_and_lessonId", (q) =>
              q.eq("tenantId", args.tenantId).eq("lessonId", lesson._id),
            )
            .collect();

          for (const rating of ratings) {
            totalRating += rating.rating;
            ratingCount++;
          }
        }

        const average =
          ratingCount > 0
            ? Math.round((totalRating / ratingCount) * 10) / 10
            : 0;

        return {
          categoryId: category._id,
          title: category.title,
          average,
          ratingCount,
        };
      }),
    );

    // Sort by title
    return categoriesWithRatings.sort((a, b) => a.title.localeCompare(b.title));
  },
});

/**
 * Get all units for a category with their average ratings (tenant admin)
 * Returns: unitId, title, average, ratingCount
 */
export const getUnitsWithAverageRatings = query({
  args: {
    tenantId: v.id("tenants"),
    categoryId: v.id("categories"),
  },
  returns: v.array(
    v.object({
      unitId: v.id("units"),
      title: v.string(),
      average: v.number(),
      ratingCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all units for this category
    const units = await ctx.db
      .query("units")
      .withIndex("by_tenantId_and_categoryId", (q) =>
        q.eq("tenantId", args.tenantId).eq("categoryId", args.categoryId),
      )
      .collect();

    // For each unit, calculate average rating across all its lessons
    const unitsWithRatings = await Promise.all(
      units.map(async (unit) => {
        // Get all lessons for this unit
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_tenantId_and_unitId", (q) =>
            q.eq("tenantId", args.tenantId).eq("unitId", unit._id),
          )
          .collect();

        // Get all ratings for these lessons
        let totalRating = 0;
        let ratingCount = 0;

        for (const lesson of lessons) {
          const ratings = await ctx.db
            .query("lessonRatings")
            .withIndex("by_tenantId_and_lessonId", (q) =>
              q.eq("tenantId", args.tenantId).eq("lessonId", lesson._id),
            )
            .collect();

          for (const rating of ratings) {
            totalRating += rating.rating;
            ratingCount++;
          }
        }

        const average =
          ratingCount > 0
            ? Math.round((totalRating / ratingCount) * 10) / 10
            : 0;

        return {
          unitId: unit._id,
          title: unit.title,
          average,
          ratingCount,
        };
      }),
    );

    // Sort by order_index
    return unitsWithRatings;
  },
});

/**
 * Get all lessons for a unit with their average ratings (tenant admin)
 * Returns: lessonId, title, average, ratingCount
 */
export const getLessonsWithAverageRatings = query({
  args: {
    tenantId: v.id("tenants"),
    unitId: v.id("units"),
  },
  returns: v.array(
    v.object({
      lessonId: v.id("lessons"),
      title: v.string(),
      average: v.number(),
      ratingCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all lessons for this unit
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId_and_unitId", (q) =>
        q.eq("tenantId", args.tenantId).eq("unitId", args.unitId),
      )
      .collect();

    // For each lesson, calculate average rating
    const lessonsWithRatings = await Promise.all(
      lessons.map(async (lesson) => {
        const ratings = await ctx.db
          .query("lessonRatings")
          .withIndex("by_tenantId_and_lessonId", (q) =>
            q.eq("tenantId", args.tenantId).eq("lessonId", lesson._id),
          )
          .collect();

        let totalRating = 0;
        const ratingCount = ratings.length;

        for (const rating of ratings) {
          totalRating += rating.rating;
        }

        const average =
          ratingCount > 0
            ? Math.round((totalRating / ratingCount) * 10) / 10
            : 0;

        return {
          lessonId: lesson._id,
          title: lesson.title,
          average,
          ratingCount,
        };
      }),
    );

    return lessonsWithRatings;
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
        rating: v.union(
          v.literal(1),
          v.literal(2),
          v.literal(3),
          v.literal(4),
          v.literal(5),
        ),
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

/**
 * Search units and lessons by name with their average ratings (tenant admin)
 * Returns units and lessons that match the search query
 */
export const searchUnitsAndLessonsWithRatings = query({
  args: {
    tenantId: v.id("tenants"),
    searchQuery: v.string(),
  },
  returns: v.object({
    units: v.array(
      v.object({
        unitId: v.id("units"),
        title: v.string(),
        categoryId: v.id("categories"),
        categoryTitle: v.string(),
        average: v.number(),
        ratingCount: v.number(),
      }),
    ),
    lessons: v.array(
      v.object({
        lessonId: v.id("lessons"),
        title: v.string(),
        unitId: v.id("units"),
        unitTitle: v.string(),
        categoryId: v.id("categories"),
        categoryTitle: v.string(),
        average: v.number(),
        ratingCount: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const searchLower = args.searchQuery.toLowerCase().trim();

    if (!searchLower) {
      return { units: [], lessons: [] };
    }

    // Get all units for tenant and filter by search
    const allUnits = await ctx.db
      .query("units")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const matchingUnits = allUnits.filter((unit) =>
      unit.title.toLowerCase().includes(searchLower),
    );

    // Get all lessons for tenant and filter by search
    const allLessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const matchingLessons = allLessons.filter((lesson) =>
      lesson.title.toLowerCase().includes(searchLower),
    );

    // Process matching units with ratings
    const unitsWithRatings = await Promise.all(
      matchingUnits.slice(0, 10).map(async (unit) => {
        const category = await ctx.db.get(unit.categoryId);

        // Get all lessons for this unit
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_tenantId_and_unitId", (q) =>
            q.eq("tenantId", args.tenantId).eq("unitId", unit._id),
          )
          .collect();

        // Get all ratings for these lessons
        let totalRating = 0;
        let ratingCount = 0;

        for (const lesson of lessons) {
          const ratings = await ctx.db
            .query("lessonRatings")
            .withIndex("by_tenantId_and_lessonId", (q) =>
              q.eq("tenantId", args.tenantId).eq("lessonId", lesson._id),
            )
            .collect();

          for (const rating of ratings) {
            totalRating += rating.rating;
            ratingCount++;
          }
        }

        const average =
          ratingCount > 0
            ? Math.round((totalRating / ratingCount) * 10) / 10
            : 0;

        return {
          unitId: unit._id,
          title: unit.title,
          categoryId: unit.categoryId,
          categoryTitle: category?.title || "Categoria não encontrada",
          average,
          ratingCount,
        };
      }),
    );

    // Process matching lessons with ratings
    const lessonsWithRatings = await Promise.all(
      matchingLessons.slice(0, 10).map(async (lesson) => {
        const unit = await ctx.db.get(lesson.unitId);
        const category = await ctx.db.get(lesson.categoryId);

        const ratings = await ctx.db
          .query("lessonRatings")
          .withIndex("by_tenantId_and_lessonId", (q) =>
            q.eq("tenantId", args.tenantId).eq("lessonId", lesson._id),
          )
          .collect();

        let totalRating = 0;
        const ratingCount = ratings.length;

        for (const rating of ratings) {
          totalRating += rating.rating;
        }

        const average =
          ratingCount > 0
            ? Math.round((totalRating / ratingCount) * 10) / 10
            : 0;

        return {
          lessonId: lesson._id,
          title: lesson.title,
          unitId: lesson.unitId,
          unitTitle: unit?.title || "Unidade não encontrada",
          categoryId: lesson.categoryId,
          categoryTitle: category?.title || "Categoria não encontrada",
          average,
          ratingCount,
        };
      }),
    );

    return {
      units: unitsWithRatings,
      lessons: lessonsWithRatings,
    };
  },
});
