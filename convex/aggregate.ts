import { v } from "convex/values";
import {
  query,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { DirectAggregate } from "@convex-dev/aggregate";
import { components, internal } from "./_generated/api";

/**
 * Aggregate instances for efficient counting
 * Using DirectAggregate since we're only tracking counts, not tied to specific table data
 */
export const lessonsAggregate = new DirectAggregate<{ Key: null; Id: string }>(
  components.aggregateLessons,
);

export const unitsAggregate = new DirectAggregate<{ Key: null; Id: string }>(
  components.aggregateUnits,
);

export const categoriesAggregate = new DirectAggregate<{
  Key: null;
  Id: string;
}>(components.aggregateCategories);

/**
 * Helper function to get total lessons count
 * Can be called from other Convex functions (queries/mutations)
 */
export async function getTotalLessonsCount(
  ctx: QueryCtx | MutationCtx,
): Promise<number> {
  return await lessonsAggregate.count(ctx);
}

/**
 * Get content statistics using aggregates
 * This is O(log n) instead of O(n) - much more efficient!
 */
export const get = query({
  args: {},
  returns: v.object({
    totalLessons: v.number(),
    totalUnits: v.number(),
    totalCategories: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    // Use aggregates to count efficiently
    const totalLessons = await getTotalLessonsCount(ctx);
    const totalUnits = await unitsAggregate.count(ctx);
    const totalCategories = await categoriesAggregate.count(ctx);

    return {
      totalLessons,
      totalUnits,
      totalCategories,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Internal mutation to increment lesson count
 */
export const incrementLessons = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Insert multiple items into aggregate to increment count
    for (let i = 0; i < args.amount; i++) {
      await lessonsAggregate.insert(ctx, {
        key: null, // We don't need ordering, just counting
        id: `lesson_${Date.now()}_${i}_${Math.random()}`, // Unique ID
      });
    }
    return null;
  },
});

/**
 * Internal mutation to decrement lesson count
 */
export const decrementLessons = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get items from aggregate and delete them
    const result = await lessonsAggregate.paginate(ctx, {
      pageSize: args.amount,
    });
    for (const item of result.page) {
      await lessonsAggregate.delete(ctx, { key: item.key, id: item.id });
    }
    return null;
  },
});

/**
 * Internal mutation to increment unit count
 */
export const incrementUnits = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (let i = 0; i < args.amount; i++) {
      await unitsAggregate.insert(ctx, {
        key: null,
        id: `unit_${Date.now()}_${i}_${Math.random()}`,
      });
    }
    return null;
  },
});

/**
 * Internal mutation to decrement unit count
 */
export const decrementUnits = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const result = await unitsAggregate.paginate(ctx, {
      pageSize: args.amount,
    });
    for (const item of result.page) {
      await unitsAggregate.delete(ctx, { key: item.key, id: item.id });
    }
    return null;
  },
});

/**
 * Internal mutation to increment category count
 */
export const incrementCategories = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (let i = 0; i < args.amount; i++) {
      await categoriesAggregate.insert(ctx, {
        key: null,
        id: `category_${Date.now()}_${i}_${Math.random()}`,
      });
    }
    return null;
  },
});

/**
 * Internal mutation to decrement category count
 */
export const decrementCategories = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const result = await categoriesAggregate.paginate(ctx, {
      pageSize: args.amount,
    });
    for (const item of result.page) {
      await categoriesAggregate.delete(ctx, { key: item.key, id: item.id });
    }
    return null;
  },
});

/**
 * Initialize content statistics (should be called once during setup)
 * Counts current content and populates aggregates
 */
export const initialize = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear existing aggregates
    const existingLessons = await lessonsAggregate.paginate(ctx, {
      pageSize: 1000,
    });
    for (const item of existingLessons.page) {
      await lessonsAggregate.delete(ctx, { key: item.key, id: item.id });
    }

    const existingUnits = await unitsAggregate.paginate(ctx, {
      pageSize: 1000,
    });
    for (const item of existingUnits.page) {
      await unitsAggregate.delete(ctx, { key: item.key, id: item.id });
    }

    const existingCategories = await categoriesAggregate.paginate(ctx, {
      pageSize: 1000,
    });
    for (const item of existingCategories.page) {
      await categoriesAggregate.delete(ctx, { key: item.key, id: item.id });
    }

    // Count current content (using take to limit)
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    const units = await ctx.db.query("units").take(1000);
    const categories = await ctx.db.query("categories").take(100);

    // Populate aggregates with current counts
    for (let i = 0; i < lessons.length; i++) {
      await lessonsAggregate.insert(ctx, {
        key: null,
        id: `lesson_init_${i}`,
      });
    }

    for (let i = 0; i < units.length; i++) {
      await unitsAggregate.insert(ctx, {
        key: null,
        id: `unit_init_${i}`,
      });
    }

    for (let i = 0; i < categories.length; i++) {
      await categoriesAggregate.insert(ctx, {
        key: null,
        id: `category_init_${i}`,
      });
    }

    console.log(
      `Initialized aggregates: ${lessons.length} lessons, ${units.length} units, ${categories.length} categories`,
    );
    return null;
  },
});

/**
 * Recalculate all statistics from scratch
 * This should be called if aggregates get out of sync
 */
export const recalculate = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Call initialize to clear and reinitialize
    await ctx.runMutation(internal.aggregate.initialize, {});
    return null;
  },
});
