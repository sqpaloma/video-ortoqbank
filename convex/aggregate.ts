import { v } from "convex/values";
import {
  query,
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "./_generated/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import {
  customMutation,
  customCtx,
} from "convex-helpers/server/customFunctions";

// ============================================================================
// CONTENT AGGREGATES (per tenant) - for total counts / denominators
// ============================================================================

/**
 * Aggregate for counting total lessons per tenant
 * Used as denominator for progress percentage calculations
 */
export const totalLessonsPerTenant = new TableAggregate<{
  Namespace: Id<"tenants">;
  Key: null;
  DataModel: DataModel;
  TableName: "lessons";
}>(components.aggregateLessons, {
  namespace: (doc) => doc.tenantId,
  sortKey: () => null,
});

/**
 * Aggregate for counting total units per tenant
 */
export const totalUnitsPerTenant = new TableAggregate<{
  Namespace: Id<"tenants">;
  Key: null;
  DataModel: DataModel;
  TableName: "units";
}>(components.aggregateUnits, {
  namespace: (doc) => doc.tenantId,
  sortKey: () => null,
});

/**
 * Aggregate for counting total categories per tenant
 */
export const totalCategoriesPerTenant = new TableAggregate<{
  Namespace: Id<"tenants">;
  Key: null;
  DataModel: DataModel;
  TableName: "categories";
}>(components.aggregateCategories, {
  namespace: (doc) => doc.tenantId,
  sortKey: () => null,
});

// ============================================================================
// USER PROGRESS AGGREGATE (per tenant + user) - for completed counts / numerators
// ============================================================================

/**
 * Aggregate for counting completed lessons per user per tenant
 * Namespace is a tuple of [tenantId, clerkUserId] for per-user counting
 * Uses sumValue to only count documents where completed: true
 */
export const completedLessonsPerUser = new TableAggregate<{
  Namespace: [Id<"tenants">, string]; // [tenantId, clerkUserId]
  Key: null;
  DataModel: DataModel;
  TableName: "userProgress";
}>(components.aggregateUserProgress, {
  namespace: (doc) => [doc.tenantId, doc.userId],
  sortKey: () => null,
  // Only include completed lessons in the sum
  sumValue: (doc) => (doc.completed ? 1 : 0),
});

/**
 * Aggregate for counting completed lessons per user per unit
 * Namespace is a tuple of [tenantId, clerkUserId, unitId] for per-unit counting
 * Uses sumValue to only count documents where completed: true
 */
export const completedLessonsPerUserPerUnit = new TableAggregate<{
  Namespace: [Id<"tenants">, string, Id<"units">]; // [tenantId, clerkUserId, unitId]
  Key: null;
  DataModel: DataModel;
  TableName: "userProgress";
}>(components.aggregateUnitProgress, {
  namespace: (doc) => [doc.tenantId, doc.userId, doc.unitId],
  sortKey: () => null,
  // Only include completed lessons in the sum
  sumValue: (doc) => (doc.completed ? 1 : 0),
});

// ============================================================================
// TRIGGERS - Automatic sync on table changes
// ============================================================================

const triggers = new Triggers<DataModel>();
triggers.register("lessons", totalLessonsPerTenant.trigger());
triggers.register("units", totalUnitsPerTenant.trigger());
triggers.register("categories", totalCategoriesPerTenant.trigger());
triggers.register("userProgress", completedLessonsPerUser.trigger());
triggers.register("userProgress", completedLessonsPerUserPerUnit.trigger());

// ============================================================================
// CUSTOM MUTATION WRAPPERS - Use these for mutations that modify tracked tables
// ============================================================================

/**
 * Custom mutation wrapper that automatically syncs aggregates via triggers
 * Use this instead of `mutation` for functions that modify:
 * - lessons table
 * - units table
 * - categories table
 * - userProgress table
 */
export const mutationWithTrigger = customMutation(
  rawMutation,
  customCtx(triggers.wrapDB),
);

/**
 * Custom internal mutation wrapper that automatically syncs aggregates via triggers
 * Use this instead of `internalMutation` for internal functions that modify tracked tables
 */
export const internalMutationWithTrigger = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB),
);

// ============================================================================
// QUERY FUNCTIONS - Read aggregate data
// ============================================================================

/**
 * Get content statistics for a specific tenant using O(log n) aggregates
 */
export const getByTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.object({
    totalLessons: v.number(),
    totalUnits: v.number(),
    totalCategories: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const totalLessons = await totalLessonsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });
    const totalUnits = await totalUnitsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });
    const totalCategories = await totalCategoriesPerTenant.count(ctx, {
      namespace: args.tenantId,
    });

    return {
      totalLessons,
      totalUnits,
      totalCategories,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get user progress with percentage calculation
 * Returns completed lessons count, total lessons, and progress percentage
 */
export const getUserProgress = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  returns: v.object({
    completedLessons: v.number(),
    totalLessons: v.number(),
    progressPercent: v.number(),
  }),
  handler: async (ctx, args) => {
    // Completed lessons for this user (numerator)
    const completed = await completedLessonsPerUser.sum(ctx, {
      namespace: [args.tenantId, args.userId],
    });

    // Total lessons in tenant (denominator)
    const total = await totalLessonsPerTenant.count(ctx, {
      namespace: args.tenantId,
    });

    // Calculate percentage
    const progressPercent =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completedLessons: completed,
      totalLessons: total,
      progressPercent,
    };
  },
});

// ============================================================================
// BACKFILL / MIGRATION FUNCTIONS
// ============================================================================

/**
 * Backfill all aggregates from existing table data
 * Run this once after deploying the TableAggregate changes
 * Uses insertIfDoesNotExist for idempotent backfill
 */
export const backfillAggregates = internalMutationWithTrigger({
  args: {
    cursor: v.optional(v.string()),
    table: v.union(
      v.literal("lessons"),
      v.literal("units"),
      v.literal("categories"),
      v.literal("userProgress"),
    ),
  },
  returns: v.object({
    isDone: v.boolean(),
    cursor: v.optional(v.string()),
    processed: v.number(),
  }),
  handler: async (ctx, args) => {
    const batchSize = 100;

    if (args.table === "lessons") {
      const result = await ctx.db
        .query("lessons")
        .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

      for (const doc of result.page) {
        await totalLessonsPerTenant.insertIfDoesNotExist(ctx, doc);
      }

      return {
        isDone: result.isDone,
        cursor: result.continueCursor,
        processed: result.page.length,
      };
    }

    if (args.table === "units") {
      const result = await ctx.db
        .query("units")
        .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

      for (const doc of result.page) {
        await totalUnitsPerTenant.insertIfDoesNotExist(ctx, doc);
      }

      return {
        isDone: result.isDone,
        cursor: result.continueCursor,
        processed: result.page.length,
      };
    }

    if (args.table === "categories") {
      const result = await ctx.db
        .query("categories")
        .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

      for (const doc of result.page) {
        await totalCategoriesPerTenant.insertIfDoesNotExist(ctx, doc);
      }

      return {
        isDone: result.isDone,
        cursor: result.continueCursor,
        processed: result.page.length,
      };
    }

    // userProgress - insert into both user-level and unit-level aggregates
    const result = await ctx.db
      .query("userProgress")
      .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

    for (const doc of result.page) {
      await completedLessonsPerUser.insertIfDoesNotExist(ctx, doc);
      await completedLessonsPerUserPerUnit.insertIfDoesNotExist(ctx, doc);
    }

    return {
      isDone: result.isDone,
      cursor: result.continueCursor,
      processed: result.page.length,
    };
  },
});

/**
 * Clear all aggregates and prepare for fresh backfill
 * Use this if aggregates are out of sync and need full reset
 */
export const clearAllAggregates = internalMutationWithTrigger({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Content aggregates: rootLazy: false for faster reads (admin writes are infrequent)
    await totalLessonsPerTenant.clearAll(ctx, {
      maxNodeSize: 16,
      rootLazy: false,
    });
    await totalUnitsPerTenant.clearAll(ctx, {
      maxNodeSize: 16,
      rootLazy: false,
    });
    await totalCategoriesPerTenant.clearAll(ctx, {
      maxNodeSize: 16,
      rootLazy: false,
    });
    // User progress aggregates: rootLazy: true with larger maxNodeSize to reduce write conflicts
    await completedLessonsPerUser.clearAll(ctx, {
      maxNodeSize: 32,
      rootLazy: true,
    });
    await completedLessonsPerUserPerUnit.clearAll(ctx, {
      maxNodeSize: 32,
      rootLazy: true,
    });

    console.log("All aggregates cleared. Run backfillAggregates to repopulate.");
    return null;
  },
});
