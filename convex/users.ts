import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  type MutationCtx,
  query,
  type QueryCtx as QueryContext,
} from "./_generated/server";

// ============================================================================
// CURRENT USER QUERIES
// ============================================================================

/**
 * Get the current authenticated user
 */
export const current = query({
  args: {},
  handler: async (context) => {
    return await getCurrentUser(context);
  },
});

/**
 * Ensure the current user exists in Convex
 * This is a fallback in case the webhook hasn't fired yet
 */
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const existingUser = await userByClerkUserId(ctx, identity.subject);
    if (existingUser) {
      return existingUser._id;
    }

    // Create user from Clerk identity
    const userId = await ctx.db.insert("users", {
      firstName: identity.givenName || "",
      lastName: identity.familyName || "",
      email: identity.email || "",
      clerkUserId: identity.subject,
      imageUrl: identity.pictureUrl,
      onboardingCompleted: false,
      role: "user",
      status: "active",
      paid: false,
      paymentStatus: "pending",
      hasActiveYearAccess: false,
    });

    return userId;
  },
});

/**
 * Get user by Clerk ID (internal use)
 */
export const getUserByClerkId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await userByClerkUserId(ctx, args.clerkUserId);
  },
});

// ============================================================================
// CLERK WEBHOOK HANDLERS
// ============================================================================

/**
 * Upsert user from Clerk webhook
 * This handles both user creation and updates from Clerk
 */
export const upsertFromClerk = internalMutation({
  args: {
    data: v.object({
      id: v.string(),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      email_addresses: v.optional(
        v.array(
          v.object({
            email_address: v.string(),
          }),
        ),
      ),
      image_url: v.optional(v.string()),
      public_metadata: v.optional(
        v.object({
          paid: v.optional(v.boolean()),
          paymentId: v.optional(v.union(v.string(), v.number())),
          paymentDate: v.optional(v.number()),
          paymentStatus: v.optional(v.string()),
          hasActiveYearAccess: v.optional(v.boolean()),
        }),
      ),
    }),
  },
  async handler(context, { data }) {
    // Extract any payment data from Clerk's public metadata
    const publicMetadata = data.public_metadata || {};
    const isPaidFromClerk = publicMetadata.paid === true;

    // Get existing user to preserve payment data if it exists
    const existingUser = await userByClerkUserId(context, data.id);

    // Base user data to update or insert
    const userData = {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email_addresses?.[0]?.email_address,
      clerkUserId: data.id,
      imageUrl: data.image_url,
    };

    if (existingUser !== null) {
      // Update existing user, preserving payment data if it exists
      // and not overriding with new payment data from Clerk
      const paymentData = isPaidFromClerk
        ? {
            paid: true,
            paymentId: publicMetadata.paymentId?.toString(),
            paymentDate: publicMetadata.paymentDate,
            paymentStatus:
              (publicMetadata.paymentStatus as
                | "pending"
                | "completed"
                | "failed"
                | "refunded") || "completed",
            hasActiveYearAccess: publicMetadata.hasActiveYearAccess === true,
          }
        : {
            // Keep existing payment data if it exists
            paid: existingUser.paid,
            paymentId: existingUser.paymentId,
            paymentDate: existingUser.paymentDate,
            paymentStatus: existingUser.paymentStatus,
            hasActiveYearAccess: existingUser.hasActiveYearAccess,
          };

      return await context.db.patch(existingUser._id, {
        ...userData,
        ...paymentData,
      });
    }

    // Create new user with payment data if it exists in Clerk
    if (isPaidFromClerk) {
      return await context.db.insert("users", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || "",
        clerkUserId: userData.clerkUserId,
        imageUrl: userData.imageUrl,
        onboardingCompleted: false,
        role: "user",
        status: "active",
        paid: true,
        paymentId: publicMetadata.paymentId?.toString(),
        paymentDate: publicMetadata.paymentDate,
        paymentStatus:
          (publicMetadata.paymentStatus as
            | "pending"
            | "completed"
            | "failed"
            | "refunded") || "completed",
        hasActiveYearAccess: publicMetadata.hasActiveYearAccess === true,
      });
    }

    // Create new user without payment data
    return await context.db.insert("users", {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email || "",
      clerkUserId: userData.clerkUserId,
      imageUrl: userData.imageUrl,
      onboardingCompleted: false,
      role: "user",
      status: "active",
      paid: false,
      paymentStatus: "pending",
      hasActiveYearAccess: false,
    });
  },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(context, { clerkUserId }) {
    const user = await userByClerkUserId(context, clerkUserId);

    if (user === null) {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    } else {
      await context.db.delete(user._id);
    }

    return null;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safe version - returns user or null (no throwing)
 * Use this for queries that should gracefully handle unauthenticated users
 */
export async function getCurrentUser(context: QueryContext) {
  const identity = await context.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByClerkUserId(context, identity.subject);
}

/**
 * Protected version - throws if no user
 * Use this for mutations and queries that require authentication
 */
export async function getCurrentUserOrThrow(context: QueryContext) {
  const userRecord = await getCurrentUser(context);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

/**
 * Internal helper to get user by Clerk user ID
 */
async function userByClerkUserId(context: QueryContext, clerkUserId: string) {
  return await context.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

/**
 * Require admin access - throws if not admin
 * This helper is exported for use in other files
 */
export async function requireAdmin(
  context: QueryContext | MutationCtx,
): Promise<void> {
  const user = await getCurrentUser(context);
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }

  if (user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
}

// ============================================================================
// ADMIN QUERIES AND MUTATIONS
// ============================================================================

/**
 * Get all users (admin only)
 */
export const getUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit || 100);

    return users;
  },
});

/**
 * Set user role (admin only)
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.userId, {
      role: args.role || "user",
    });
  },
});
