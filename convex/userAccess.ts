import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./users";

/**
 * ============================================================================
 * ACCESS MODEL (VIDEO APP)
 *
 * Convex is the SOURCE OF TRUTH for paid access.
 * Clerk is used ONLY for authentication (identity).
 *
 * Rules for VIDEO app access:
 * - user.status === "active"
 * - user.paid === true
 * - user.hasActiveYearAccess === true
 * ============================================================================
 */

/**
 * Centralized access rule (DO NOT DUPLICATE LOGIC)
 */
function hasVideoAccess(user: {
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
// PUBLIC ACCESS CHECKS (used by UI, Server Components, API routes)
// ============================================================================

/**
 * Check if CURRENT authenticated user has access to VIDEO app
 * (Used in Server Components / client queries)
 */
export const checkUserHasVideoAccess = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    return hasVideoAccess(user);
  },
});

/**
 * Check access by Clerk user ID
 * IMPORTANT: This is the function you should call from:
 * - Server Components
 * - API Routes
 * - Server Actions
 */
export const checkUserHasVideoAccessByClerkId = query({
  args: { clerkUserId: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (!user) return false;

    return hasVideoAccess(user);
  },
});

// ============================================================================
// ACCESS DETAILS (UI / ACCOUNT / BILLING)
// ============================================================================

/**
 * Full access + billing info for current user
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
      hasAccess: hasVideoAccess(user),
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
 * Update payment info
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

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/**
 * Admin-only: check access by internal Convex user ID
 */
export const checkUserHasVideoAccessById = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    return hasVideoAccess(user);
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
