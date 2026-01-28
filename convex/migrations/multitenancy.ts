import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { requireSuperAdmin } from "../lib/tenantContext";

/**
 * ============================================================================
 * MULTITENANCY MIGRATION SCRIPT
 *
 * This script migrates existing data to the multitenancy schema.
 * It should be run once after deploying the schema changes.
 *
 * Steps:
 * 1. Create default tenant (e.g., "Ortoclub" with slug "app")
 * 2. Add tenantId to all existing content records
 * 3. Create tenantMemberships for all existing users
 * ============================================================================
 */

/**
 * Step 1: Create the default tenant
 * Run this first to get the default tenant ID
 */
export const createDefaultTenant = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  returns: v.id("tenants"),
  handler: async (ctx, args) => {
    // Check if tenant already exists
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      console.log(
        `Tenant "${args.slug}" already exists with ID: ${existing._id}`,
      );
      return existing._id;
    }

    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      status: "active",
    });

    console.log(`Created default tenant "${args.name}" with ID: ${tenantId}`);
    return tenantId;
  },
});

/**
 * Step 2: Migrate categories to include tenantId
 */
export const migrateCategories = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    // Use pagination to ensure progress across batches
    const categories = await ctx.db
      .query("categories")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const category of categories.page) {
      // Check if already has tenantId (using type assertion for migration)
      const cat = category as typeof category & { tenantId?: Id<"tenants"> };
      if (cat.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(category._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Categories: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !categories.isDone,
      cursor: categories.continueCursor,
    };
  },
});

/**
 * Step 2b: Migrate units to include tenantId
 */
export const migrateUnits = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const units = await ctx.db
      .query("units")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const unit of units.page) {
      const u = unit as typeof unit & { tenantId?: Id<"tenants"> };
      if (u.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(unit._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Units: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !units.isDone,
      cursor: units.continueCursor,
    };
  },
});

/**
 * Step 2c: Migrate lessons to include tenantId
 */
export const migrateLessons = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const lessons = await ctx.db
      .query("lessons")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const lesson of lessons.page) {
      const l = lesson as typeof lesson & { tenantId?: Id<"tenants"> };
      if (l.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(lesson._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Lessons: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !lessons.isDone,
      cursor: lessons.continueCursor,
    };
  },
});

/**
 * Step 2d: Migrate videos to include tenantId
 */
export const migrateVideos = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const videos = await ctx.db
      .query("videos")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const video of videos.page) {
      const vid = video as typeof video & { tenantId?: Id<"tenants"> };
      if (vid.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(video._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Videos: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !videos.isDone,
      cursor: videos.continueCursor,
    };
  },
});

/**
 * Step 2e: Migrate pricing plans to include tenantId
 */
export const migratePricingPlans = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const plans = await ctx.db
      .query("pricingPlans")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const plan of plans.page) {
      const p = plan as typeof plan & { tenantId?: Id<"tenants"> };
      if (p.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(plan._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Pricing Plans: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !plans.isDone,
      cursor: plans.continueCursor,
    };
  },
});

/**
 * Step 2f: Migrate coupons to include tenantId
 */
export const migrateCoupons = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const coupons = await ctx.db
      .query("coupons")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const coupon of coupons.page) {
      const c = coupon as typeof coupon & { tenantId?: Id<"tenants"> };
      if (c.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(coupon._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Coupons: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !coupons.isDone,
      cursor: coupons.continueCursor,
    };
  },
});

/**
 * Step 3: Create tenant memberships for existing users
 */
export const createUserMemberships = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const users = await ctx.db
      .query("users")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let created = 0;
    let skipped = 0;

    for (const user of users.page) {
      // Check if membership already exists
      const existing = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_userId_and_tenantId", (q) =>
          q.eq("userId", user._id).eq("tenantId", args.tenantId),
        )
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      // Determine role: admins become tenant admins
      const role =
        user.role === "admin" || user.role === "superadmin"
          ? ("admin" as const)
          : ("member" as const);

      await ctx.db.insert("tenantMemberships", {
        userId: user._id,
        tenantId: args.tenantId,
        role,
        hasActiveAccess: user.hasActiveYearAccess,
        joinedAt: Date.now(),
      });
      created++;
    }

    console.log(`User Memberships: created ${created}, skipped ${skipped}`);
    return {
      created,
      skipped,
      hasMore: !users.isDone,
      cursor: users.continueCursor,
    };
  },
});

/**
 * Step 4: Migrate user progress tables
 */
export const migrateUserProgress = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const progress = await ctx.db
      .query("userProgress")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const p of progress.page) {
      const prog = p as typeof p & { tenantId?: Id<"tenants"> };
      if (prog.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(p._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`User Progress: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !progress.isDone,
      cursor: progress.continueCursor,
    };
  },
});

/**
 * Step 4b: Migrate unit progress
 */
export const migrateUnitProgress = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const progress = await ctx.db
      .query("unitProgress")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const p of progress.page) {
      const prog = p as typeof p & { tenantId?: Id<"tenants"> };
      if (prog.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(p._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Unit Progress: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !progress.isDone,
      cursor: progress.continueCursor,
    };
  },
});

/**
 * Step 4c: Migrate global progress
 */
export const migrateGlobalProgress = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const progress = await ctx.db
      .query("userGlobalProgress")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const p of progress.page) {
      const prog = p as typeof p & { tenantId?: Id<"tenants"> };
      if (prog.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(p._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Global Progress: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !progress.isDone,
      cursor: progress.continueCursor,
    };
  },
});

/**
 * Step 5: Migrate favorites and recent views
 */
export const migrateFavorites = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const favorites = await ctx.db
      .query("favorites")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const f of favorites.page) {
      const fav = f as typeof f & { tenantId?: Id<"tenants"> };
      if (fav.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(f._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Favorites: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !favorites.isDone,
      cursor: favorites.continueCursor,
    };
  },
});

export const migrateRecentViews = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const views = await ctx.db
      .query("recentViews")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const view of views.page) {
      const rv = view as typeof view & { tenantId?: Id<"tenants"> };
      if (rv.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(view._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Recent Views: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !views.isDone,
      cursor: views.continueCursor,
    };
  },
});

/**
 * Step 6: Migrate orders and invoices
 */
export const migratePendingOrders = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const orders = await ctx.db
      .query("pendingOrders")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const o of orders.page) {
      const order = o as typeof o & { tenantId?: Id<"tenants"> };
      if (order.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(o._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Pending Orders: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !orders.isDone,
      cursor: orders.continueCursor,
    };
  },
});

export const migrateInvoices = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const invoices = await ctx.db
      .query("invoices")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const i of invoices.page) {
      const inv = i as typeof i & { tenantId?: Id<"tenants"> };
      if (inv.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(i._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Invoices: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !invoices.isDone,
      cursor: invoices.continueCursor,
    };
  },
});

/**
 * Step 7: Migrate remaining tables
 */
export const migrateFeedback = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const feedback = await ctx.db
      .query("lessonFeedback")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const f of feedback.page) {
      const fb = f as typeof f & { tenantId?: Id<"tenants"> };
      if (fb.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(f._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Lesson Feedback: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !feedback.isDone,
      cursor: feedback.continueCursor,
    };
  },
});

export const migrateRatings = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const ratings = await ctx.db
      .query("lessonRatings")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const r of ratings.page) {
      const rating = r as typeof r & { tenantId?: Id<"tenants"> };
      if (rating.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(r._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Lesson Ratings: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !ratings.isDone,
      cursor: ratings.continueCursor,
    };
  },
});

export const migrateCouponUsage = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const usages = await ctx.db
      .query("couponUsage")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const u of usages.page) {
      const usage = u as typeof u & { tenantId?: Id<"tenants"> };
      if (usage.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(u._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Coupon Usage: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !usages.isDone,
      cursor: usages.continueCursor,
    };
  },
});

export const migrateEmailInvitations = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    hasMore: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const invitations = await ctx.db
      .query("emailInvitations")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    let skipped = 0;

    for (const i of invitations.page) {
      const inv = i as typeof i & { tenantId?: Id<"tenants"> };
      if (inv.tenantId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(i._id, {
        tenantId: args.tenantId,
      });
      migrated++;
    }

    console.log(`Email Invitations: migrated ${migrated}, skipped ${skipped}`);
    return {
      migrated,
      skipped,
      hasMore: !invitations.isDone,
      cursor: invitations.continueCursor,
    };
  },
});

/**
 * Remove createdAt field from all tenants (cleanup migration)
 */
export const removeCreatedAtFromTenants = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
  }),
  handler: async (ctx) => {
    const tenants = await ctx.db.query("tenants").collect();

    let updated = 0;
    for (const tenant of tenants) {
      const t = tenant as typeof tenant & { createdAt?: number };
      if (t.createdAt !== undefined) {
        // Remove the createdAt field by patching without it
        const {
          _id: _unusedId,
          _creationTime: _unusedCreationTime,
          ...rest
        } = tenant;
        const { createdAt: _unusedCreatedAt, ...cleanData } =
          rest as typeof rest & {
            createdAt?: number;
          };
        await ctx.db.replace(tenant._id, cleanData);
        updated++;
      }
    }

    console.log(`Removed createdAt from ${updated} tenants`);
    return { updated };
  },
});

/**
 * Public mutation to run the full migration (superadmin only)
 * This orchestrates all migration steps
 */
export const runFullMigration = mutation({
  args: {
    tenantName: v.string(),
    tenantSlug: v.string(),
  },
  returns: v.object({
    message: v.string(),
    instructions: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Require superadmin for migration
    await requireSuperAdmin(ctx);

    return {
      message: "Migration must be run via internal mutations",
      instructions: [
        '1. npx convex run migrations/multitenancy:createDefaultTenant --args \'{"name":"Ortoclub","slug":"app"}\'',
        "2. Use the returned tenant ID for subsequent migrations",
        "3. Run each migrate* function with the tenant ID",
      ],
    };
  },
});
