import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
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
 * Get all users (admin only) - DEPRECATED: Use getTenantUsers for tenant-scoped queries
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
 * Get users that belong to a specific tenant (admin only)
 * Filters users by their membership in the tenant
 */
export const getTenantUsers = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated and has admin access to this tenant
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) {
      throw new Error("Unauthorized: User not found");
    }

    // Check if user is superadmin or admin of this tenant
    const isSuperAdmin = currentUser.role === "superadmin";

    if (!isSuperAdmin) {
      // Check tenant membership
      const membership = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_userId_and_tenantId", (q) =>
          q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
        )
        .unique();

      if (!membership || membership.role !== "admin") {
        throw new Error("Unauthorized: Admin access required for this tenant");
      }
    }

    // Get all memberships for this tenant
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Get the users from the memberships
    const users = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;
        return {
          ...user,
          membershipId: membership._id,
          tenantRole: membership.role,
          hasActiveAccess: membership.hasActiveAccess,
          accessExpiresAt: membership.accessExpiresAt,
        };
      })
    );

    // Filter out null values and apply limit
    const validUsers = users.filter((u) => u !== null);

    // Sort by creation time descending
    validUsers.sort((a, b) => b._creationTime - a._creationTime);

    return validUsers.slice(0, args.limit || 100);
  },
});

/**
 * Maximum number of tenant members to scan when search is applied.
 * This defensive limit prevents O(n) reads on very large tenants.
 * For tenants exceeding this limit, search results will be based on
 * the most recent members only.
 */
const TENANT_MEMBER_SEARCH_LIMIT = 1000;

/**
 * Get users that belong to a specific tenant with pagination (admin only)
 * Supports search by name or email
 *
 * PERFORMANCE NOTES:
 * - When no search is applied: Uses database-level pagination for O(pageSize) reads
 * - When search is applied: Loads up to TENANT_MEMBER_SEARCH_LIMIT members for in-memory filtering
 *   (search on joined user data requires in-memory filtering since we're searching across tables)
 */
export const getTenantUsersPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check if user is authenticated and has admin access to this tenant
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }

    const currentUser = await userByClerkUserId(ctx, identity.subject);
    if (!currentUser) {
      throw new Error("Unauthorized: User not found");
    }

    // Check if user is superadmin or admin of this tenant
    const isSuperAdmin = currentUser.role === "superadmin";

    if (!isSuperAdmin) {
      // Check tenant membership
      const membership = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_userId_and_tenantId", (q) =>
          q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
        )
        .unique();

      if (!membership || membership.role !== "admin") {
        throw new Error("Unauthorized: Admin access required for this tenant");
      }
    }

    const hasSearch = args.search && args.search.trim().length > 0;

    // =========================================================================
    // NON-SEARCH CASE: Use database-level pagination for efficiency
    // =========================================================================
    if (!hasSearch) {
      // Use proper database pagination on tenantMemberships
      const membershipsResult = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .order("desc")
        .paginate(args.paginationOpts);

      // Fetch users for this page only (O(pageSize) reads)
      const usersWithMembership = await Promise.all(
        membershipsResult.page.map(async (membership) => {
          const user = await ctx.db.get(membership.userId);
          if (!user) return null;
          return {
            ...user,
            membershipId: membership._id,
            tenantRole: membership.role,
            hasActiveAccess: membership.hasActiveAccess,
            accessExpiresAt: membership.accessExpiresAt,
          };
        })
      );

      // Filter out null values (users that may have been deleted)
      const validUsers = usersWithMembership.filter((u) => u !== null);

      return {
        page: validUsers,
        isDone: membershipsResult.isDone,
        continueCursor: membershipsResult.continueCursor,
      };
    }

    // =========================================================================
    // SEARCH CASE: Use defensive limit to prevent O(n) reads on large tenants
    // =========================================================================
    // Since search requires filtering by user fields (name, email) which are in
    // a different table, we must load memberships and join with users in memory.
    // We use a size cap to prevent unbounded reads.

    const allMemberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .take(TENANT_MEMBER_SEARCH_LIMIT);

    // Get the users from the memberships
    const usersWithMembership = await Promise.all(
      allMemberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;
        return {
          ...user,
          membershipId: membership._id,
          tenantRole: membership.role,
          hasActiveAccess: membership.hasActiveAccess,
          accessExpiresAt: membership.accessExpiresAt,
        };
      })
    );

    // Filter out null values
    let validUsers = usersWithMembership.filter((u) => u !== null);

    // Apply search filter
    const searchLower = args.search!.toLowerCase().trim();
    validUsers = validUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });

    // Implement manual pagination on the filtered results
    // (offset-based since we're doing in-memory filtering)
    const numItems = args.paginationOpts.numItems;
    const cursor = args.paginationOpts.cursor;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + numItems;

    const page = validUsers.slice(startIndex, endIndex);
    const isDone = endIndex >= validUsers.length;
    const continueCursor = isDone ? undefined : endIndex.toString();

    return {
      page,
      isDone,
      continueCursor,
    };
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

/**
 * Get the CPF of the current user from their order data.
 * Used for video watermark display.
 * Returns null if user is not authenticated or has no CPF on record.
 */
export const getCurrentUserCpf = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const clerkUserId = user.clerkUserId;
    const userEmail = user.email;

    // Try pending orders by userId first (most reliable for linked accounts)
    if (clerkUserId) {
      const orderByUserId = await ctx.db
        .query("pendingOrders")
        .withIndex("by_user_id", (q) => q.eq("userId", clerkUserId))
        .first();

      if (orderByUserId?.cpf) {
        return orderByUserId.cpf;
      }
    }

    // Try pending orders by accountEmail
    if (userEmail) {
      const orderByAccountEmail = await ctx.db
        .query("pendingOrders")
        .withIndex("by_account_email", (q) => q.eq("accountEmail", userEmail))
        .first();

      if (orderByAccountEmail?.cpf) {
        return orderByAccountEmail.cpf;
      }

      // Try pending orders by checkout email
      const orderByEmail = await ctx.db
        .query("pendingOrders")
        .withIndex("by_email", (q) => q.eq("email", userEmail))
        .first();

      if (orderByEmail?.cpf) {
        return orderByEmail.cpf;
      }
    }

    return null;
  },
});
