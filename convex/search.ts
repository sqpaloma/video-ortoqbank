import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Search for units and lessons by title/description
 * Uses .take() to limit results and batch gets for efficiency
 *
 * Note: Full-text search indexes would be ideal here, but requires
 * defining searchIndex in schema. For now, we use optimized filtering.
 */
export const getSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return { units: [], lessons: [] };
    }

    // Fetch limited units (max 50, then filter)
    const units = await ctx.db
      .query("units")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .take(50);

    // Fetch limited lessons (max 50, then filter)
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .take(50);

    // Filter units by search query
    const matchedUnits = units
      .filter(
        (unit) =>
          unit.title.toLowerCase().includes(searchQuery) ||
          unit.description.toLowerCase().includes(searchQuery),
      )
      .slice(0, 5);

    // Filter lessons by search query
    const matchedLessons = lessons
      .filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(searchQuery) ||
          lesson.description.toLowerCase().includes(searchQuery),
      )
      .slice(0, 5);

    // Batch get categories for units
    const unitCategoryIds = [...new Set(matchedUnits.map((u) => u.categoryId))];
    const unitCategories = await Promise.all(
      unitCategoryIds.map((id) => ctx.db.get(id)),
    );
    const unitCategoryMap = new Map(
      unitCategories.filter((c) => c && c.isPublished).map((c) => [c!._id, c!]),
    );

    // Batch get units for lessons
    const lessonUnitIds = [...new Set(matchedLessons.map((l) => l.unitId))];
    const lessonUnits = await Promise.all(
      lessonUnitIds.map((id) => ctx.db.get(id)),
    );
    const lessonUnitMap = new Map(
      lessonUnits.filter((u) => u && u.isPublished).map((u) => [u!._id, u!]),
    );

    // Batch get categories for lesson units
    const lessonCategoryIds = [
      ...new Set(lessonUnits.filter((u) => u).map((u) => u!.categoryId)),
    ];
    const lessonCategories = await Promise.all(
      lessonCategoryIds.map((id) => ctx.db.get(id)),
    );
    const lessonCategoryMap = new Map(
      lessonCategories
        .filter((c) => c && c.isPublished)
        .map((c) => [c!._id, c!]),
    );

    // Build final results with category titles
    const unitsWithCategories = matchedUnits
      .map((unit) => {
        const category = unitCategoryMap.get(unit.categoryId);
        if (!category) return null;
        return {
          _id: unit._id,
          title: unit.title,
          description: unit.description,
          categoryId: unit.categoryId,
          categoryTitle: category.title,
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    const lessonsWithDetails = matchedLessons
      .map((lesson) => {
        const unit = lessonUnitMap.get(lesson.unitId);
        if (!unit) return null;
        const category = lessonCategoryMap.get(unit.categoryId);
        if (!category) return null;
        return {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          unitId: lesson.unitId,
          unitTitle: unit.title,
          categoryId: unit.categoryId,
          categoryTitle: category.title,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return {
      units: unitsWithCategories,
      lessons: lessonsWithDetails,
    };
  },
});

/**
 * Search categories by title/description
 * Simplified version that only searches categories directly
 */
export const searchCategories = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();

    // If no query, return all published categories (limited)
    if (!searchQuery) {
      return await ctx.db
        .query("categories")
        .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
        .take(20);
    }

    // Fetch limited categories and filter
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .take(20);

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(searchQuery) ||
        category.description.toLowerCase().includes(searchQuery),
    );
  },
});
