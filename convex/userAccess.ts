import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./users";

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

/**
 * Check if current user has paid for VIDEO APP access
 * This is specific to this app - checks hasActiveYearAccess
 */
export const checkUserPaid = query({
  args: {},
  returns: v.boolean(),
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return false;
    }

    // For this VIDEO app, check hasActiveYearAccess
    return user.hasActiveYearAccess === true && user.paid === true;
  },
});

/**
 * Get current user's payment details
 */
export const getUserPaymentDetails = query({
  args: {},
  returns: v.object({
    paid: v.boolean(),
    hasActiveYearAccess: v.boolean(),
    paymentId: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  }),
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        paid: false,
        hasActiveYearAccess: false,
        paymentStatus: "pending" as const,
      };
    }

    return {
      paid: user.paid,
      hasActiveYearAccess: user.hasActiveYearAccess,
      paymentId: user.paymentId,
      paymentDate: user.paymentDate,
      paymentStatus: user.paymentStatus,
    };
  },
});

/**
 * Update payment information (admin or payment webhook)
 */
export const updatePayment = mutation({
  args: {
    userId: v.id("users"),
    paid: v.boolean(),
    paymentDate: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    hasActiveYearAccess: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Partial<{
      paid: boolean;
      paymentStatus: "pending" | "completed" | "failed" | "refunded";
      hasActiveYearAccess: boolean;
      paymentDate?: number;
      paymentId?: string;
    }> = {
      paid: args.paid,
      paymentStatus: args.paymentStatus,
      hasActiveYearAccess: args.hasActiveYearAccess,
    };

    if (args.paymentDate !== undefined) {
      updates.paymentDate = args.paymentDate;
    }

    if (args.paymentId !== undefined) {
      updates.paymentId = args.paymentId;
    }

    await ctx.db.patch(args.userId, updates);
    return null;
  },
});

// ============================================================================
// VIDEO ACCESS FUNCTIONS
// ============================================================================

/**
 * Check if current user has active access to video platform
 * This is the main access check for the VIDEO app
 */
export const checkUserHasVideoAccess = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return false;
    }

    // For VIDEO app: user must be active, have paid, and have active year access
    return (
      user.status === "active" &&
      user.paid === true &&
      user.hasActiveYearAccess === true
    );
  },
});

/**
 * Get comprehensive video access information for current user
 */
export const getVideoAccessDetails = query({
  args: {},
  returns: v.object({
    hasAccess: v.boolean(),
    paid: v.boolean(),
    hasActiveYearAccess: v.boolean(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    paymentDate: v.optional(v.number()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    daysUntilExpiration: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    if (!user) {
      return {
        hasAccess: false,
        paid: false,
        hasActiveYearAccess: false,
        status: "inactive" as const,
        paymentStatus: "pending" as const,
      };
    }

    const hasAccess =
      user.status === "active" &&
      user.paid === true &&
      user.hasActiveYearAccess === true;

    // Calculate days until expiration if payment date exists
    // Assuming 1 year access from payment date
    let daysUntilExpiration: number | undefined = undefined;
    if (user.paymentDate && user.hasActiveYearAccess) {
      const expirationDate = user.paymentDate + (365 * 24 * 60 * 60 * 1000); // 1 year
      const now = Date.now();
      if (expirationDate > now) {
        daysUntilExpiration = Math.ceil((expirationDate - now) / (24 * 60 * 60 * 1000));
      }
    }

    return {
      hasAccess,
      paid: user.paid,
      hasActiveYearAccess: user.hasActiveYearAccess,
      status: user.status,
      paymentDate: user.paymentDate,
      paymentStatus: user.paymentStatus,
      daysUntilExpiration,
    };
  },
});

/**
 * Check if a specific user has video access (for admin use)
 */
export const checkUserHasVideoAccessById = query({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return false;
    }

    return (
      user.status === "active" &&
      user.paid === true &&
      user.hasActiveYearAccess === true
    );
  },
});

// ============================================================================
// ONBOARDING FUNCTIONS
// ============================================================================

/**
 * Complete onboarding for current user
 */
export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    await ctx.db.patch(user._id, { onboardingCompleted: true });
    return null;
  },
});

