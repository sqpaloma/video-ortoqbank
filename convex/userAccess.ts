import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./users";
import {
  hasActiveTenantAccess,
  getUserTenantMembership,
  requireTenantAdmin,
} from "./lib/tenantContext";

/**
 * ============================================================================
 * ACCESS MODEL (VIDEO APP) - MULTITENANCY ENABLED
 *
 * Access is now tenant-scoped:
 * - Users can belong to multiple tenants
 * - Each tenant membership has its own access settings
 * - Global user fields (paid, hasActiveYearAccess) are kept for backward compatibility
 * - Tenant-specific access is checked via tenantMemberships
 *
 * Rules for VIDEO app access within a tenant:
 * - user.status === "active" (global status)
 * - tenantMembership.hasActiveAccess === true (tenant-specific)
 * - tenantMembership.accessExpiresAt > now (if set)
 * ============================================================================
 */

/**
 * Centralized access rule (backward compatible - global)
 */
function hasVideoAccessGlobal(user: {
  status: string;
  paid: boolean;
  hasActiveYearAccess: boolean;
}): boolean {
  return (
    user.status === "active" &&
    user.paid === true &&
    user.hasActiveYearAccess === true
  );
}

// ============================================================================
// TENANT-SCOPED ACCESS CHECKS
// ============================================================================

/**
 * Check if CURRENT authenticated user has access to VIDEO app within a tenant
 */
export const checkUserHasTenantAccess = query({
  args: { tenantId: v.id("tenants") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    // Check tenant membership and access
    return await hasActiveTenantAccess(ctx, user._id, args.tenantId);
  },
});

/**
 * Check tenant access by Clerk user ID
 * Used in Server Components, API Routes, Server Actions
 */
export const checkUserHasTenantAccessByClerkId = query({
  args: {
    tenantId: v.id("tenants"),
    clerkUserId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user || user.status !== "active") return false;

    return await hasActiveTenantAccess(ctx, user._id, args.tenantId);
  },
});

/**
 * Full access + billing info for current user within a tenant
 */
export const getTenantAccessDetails = query({
  args: { tenantId: v.id("tenants") },
  returns: v.object({
    hasAccess: v.boolean(),
    role: v.union(v.literal("member"), v.literal("admin"), v.null()),
    hasActiveAccess: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
    daysUntilExpiration: v.optional(v.number()),
    userStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
  }),
  async handler(
    ctx,
    args,
  ): Promise<{
    hasAccess: boolean;
    role: "member" | "admin" | null;
    hasActiveAccess: boolean;
    accessExpiresAt?: number;
    daysUntilExpiration?: number;
    userStatus: "active" | "inactive" | "suspended";
  }> {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        hasAccess: false,
        role: null,
        hasActiveAccess: false,
        userStatus: "inactive",
      };
    }

    const membership = await getUserTenantMembership(
      ctx,
      user._id,
      args.tenantId,
    );

    if (!membership) {
      return {
        hasAccess: false,
        role: null,
        hasActiveAccess: false,
        userStatus: user.status,
      };
    }
    const now = Date.now();
    let daysUntilExpiration: number | undefined;

    if (membership.accessExpiresAt && membership.hasActiveAccess) {
      if (membership.accessExpiresAt > now) {
        daysUntilExpiration = Math.ceil(
          (membership.accessExpiresAt - now) / (24 * 60 * 60 * 1000),
        );
      }
    }

    const hasAccess =
      user.status === "active" &&
      membership.hasActiveAccess &&
      (!membership.accessExpiresAt || membership.accessExpiresAt > now);

    return {
      hasAccess,
      role: membership.role,
      hasActiveAccess: membership.hasActiveAccess,
      accessExpiresAt: membership.accessExpiresAt,
      daysUntilExpiration,
      userStatus: user.status,
    };
  },
});

// ============================================================================
// LEGACY / BACKWARD COMPATIBLE ACCESS CHECKS (global, non-tenant)
// ============================================================================

/**
 * Check if CURRENT authenticated user has access to VIDEO app (global)
 * @deprecated Use checkUserHasTenantAccess for tenant-scoped access
 */
export const checkUserHasVideoAccess = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    return hasVideoAccessGlobal(user);
  },
});

/**
 * Check access by Clerk user ID (global)
 * @deprecated Use checkUserHasTenantAccessByClerkId for tenant-scoped access
 */
export const checkUserHasVideoAccessByClerkId = query({
  args: { clerkUserId: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) return false;

    return hasVideoAccessGlobal(user);
  },
});

/**
 * Full access + billing info for current user (global)
 * @deprecated Use getTenantAccessDetails for tenant-scoped access
 */
export const getVideoAccessDetails = query({
  args: {},
  async handler(ctx): Promise<{
    hasAccess: boolean;
    paid: boolean;
    hasActiveYearAccess: boolean;
    status: "active" | "inactive" | "suspended";
    paymentStatus: "pending" | "completed" | "failed" | "refunded";
    paymentDate?: number | undefined;
    daysUntilExpiration?: number | undefined;
  }> {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        hasAccess: false,
        paid: false,
        hasActiveYearAccess: false,
        status: "inactive",
        paymentStatus: "pending",
      };
    }

    let daysUntilExpiration: number | undefined;

    if (user.paymentDate && user.hasActiveYearAccess) {
      const expiration = user.paymentDate + 365 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (expiration > now) {
        daysUntilExpiration = Math.ceil(
          (expiration - now) / (24 * 60 * 60 * 1000),
        );
      }
    }

    return {
      hasAccess: hasVideoAccessGlobal(user),
      paid: user.paid,
      hasActiveYearAccess: user.hasActiveYearAccess,
      status: user.status,
      paymentDate: user.paymentDate,
      paymentStatus: user.paymentStatus,
      daysUntilExpiration,
    };
  },
});

// ============================================================================
// PAYMENT / WEBHOOK / ADMIN MUTATIONS
// ============================================================================

/**
 * Update payment info (global user level)
 * Used by:
 * - Payment webhooks
 * - Admin tools
 */
export const updatePayment = mutation({
  args: {
    userId: v.id("users"),
    paid: v.boolean(),
    hasActiveYearAccess: v.boolean(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    paymentDate: v.optional(v.number()),
    paymentId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    await requireAdmin(ctx);

    await ctx.db.patch(args.userId, {
      paid: args.paid,
      hasActiveYearAccess: args.hasActiveYearAccess,
      paymentStatus: args.paymentStatus,
      paymentDate: args.paymentDate,
      paymentId: args.paymentId,
    });

    return null;
  },
});

/**
 * Update tenant-specific access for a user
 * Used by tenant admins
 */
export const updateTenantAccess = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    hasActiveAccess: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);

    const membership = await getUserTenantMembership(
      ctx,
      args.userId,
      args.tenantId,
    );
    if (!membership) {
      throw new Error("User is not a member of this tenant");
    }

    await ctx.db.patch(membership._id, {
      hasActiveAccess: args.hasActiveAccess,
      accessExpiresAt: args.accessExpiresAt,
    });

    return;
  },
});

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/**
 * Admin-only: check access by internal Convex user ID (global)
 */
export const checkUserHasVideoAccessById = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    return hasVideoAccessGlobal(user);
  },
});

/**
 * Tenant admin: check user access within tenant
 */
export const checkUserTenantAccessById = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);
    return await hasActiveTenantAccess(ctx, args.userId, args.tenantId);
  },
});

// ============================================================================
// ONBOARDING
// ============================================================================

export const completeOnboarding = mutation({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
    });

    return null;
  },
});
