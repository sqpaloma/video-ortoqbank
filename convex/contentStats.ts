import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Get content statistics
 */
export const get = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("contentStats"),
      _creationTime: v.number(),
      totalLessons: v.number(),
      totalModules: v.number(),
      totalCategories: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // There should only be one contentStats document
    const stats = await ctx.db.query("contentStats").first();
    return stats;
  },
});

/**
 * Initialize content statistics (should be called once during setup)
 */
export const initialize = mutation({
  args: {},
  returns: v.id("contentStats"),
  handler: async (ctx) => {
    // Check if already initialized
    const existing = await ctx.db.query("contentStats").first();
    if (existing) {
      return existing._id;
    }

    // Count current content
    const lessons = await ctx.db.query("lessons").collect();
    const publishedLessons = lessons.filter((l) => l.isPublished);
    const modules = await ctx.db.query("modules").collect();
    const categories = await ctx.db.query("categories").collect();

    const statsId = await ctx.db.insert("contentStats", {
      totalLessons: publishedLessons.length,
      totalModules: modules.length,
      totalCategories: categories.length,
      updatedAt: Date.now(),
    });

    return statsId;
  },
});

/**
 * Recalculate all statistics from scratch
 */
export const recalculate = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const stats = await ctx.db.query("contentStats").first();

    // Count current content
    const lessons = await ctx.db.query("lessons").collect();
    const publishedLessons = lessons.filter((l) => l.isPublished);
    const modules = await ctx.db.query("modules").collect();
    const categories = await ctx.db.query("categories").collect();

    if (stats) {
      // Update existing
      await ctx.db.patch(stats._id, {
        totalLessons: publishedLessons.length,
        totalModules: modules.length,
        totalCategories: categories.length,
        updatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("contentStats", {
        totalLessons: publishedLessons.length,
        totalModules: modules.length,
        totalCategories: categories.length,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Internal mutation to increment lesson count
 */
export const incrementLessons = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalLessons: stats.totalLessons + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      // Initialize if doesn't exist
      await ctx.db.insert("contentStats", {
        totalLessons: args.amount,
        totalModules: 0,
        totalCategories: 0,
        updatedAt: Date.now(),
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
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalLessons: Math.max(0, stats.totalLessons - args.amount),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Internal mutation to increment module count
 */
export const incrementModules = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalModules: stats.totalModules + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      // Initialize if doesn't exist
      await ctx.db.insert("contentStats", {
        totalLessons: 0,
        totalModules: args.amount,
        totalCategories: 0,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Internal mutation to decrement module count
 */
export const decrementModules = internalMutation({
  args: { amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalModules: Math.max(0, stats.totalModules - args.amount),
        updatedAt: Date.now(),
      });
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
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalCategories: stats.totalCategories + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      // Initialize if doesn't exist
      await ctx.db.insert("contentStats", {
        totalLessons: 0,
        totalModules: 0,
        totalCategories: args.amount,
        updatedAt: Date.now(),
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
    const stats = await ctx.db.query("contentStats").first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalCategories: Math.max(0, stats.totalCategories - args.amount),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

