import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAdmin } from "./users";

// ============================================================================
// CLERK WEBHOOK HANDLERS
// ============================================================================

/**
 * Upsert user from Clerk webhook
 */
export const upsertFromClerk = mutation({
  args: {
    data: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkUser = args.data;
    
    // Extract user information from Clerk data
    const clerkUserId = clerkUser.id;
    const email = clerkUser.email_addresses?.[0]?.email_address || "";
    const firstName = clerkUser.first_name || "";
    const lastName = clerkUser.last_name || "";
    const imageUrl = clerkUser.image_url;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        imageUrl,
      });
    } else {
      // Create new user with default values
      await ctx.db.insert("users", {
        clerkUserId,
        email,
        firstName,
        lastName,
        imageUrl,
        onboardingCompleted: false,
        role: "user",
        status: "active",
        hasActiveYearAccess: false,
        paid: false,
        paymentStatus: "pending",
      });
    }

    return null;
  },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the user by clerkUserId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (user) {
      // Delete the user
      await ctx.db.delete(user._id);
    }

    return null;
  },
});

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Get current user's role
 */
export const getCurrentUserRole = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user?.role || null;
  },
});

/**
 * Check if current user has a specific role
 */
export const hasRole = query({
  args: { role: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return user?.role === args.role;
  },
});

/**
 * Set user role (admin only)
 */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
    return null;
  },
});

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * Set user status (admin only)
 */
export const setUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { status: args.status });
    return null;
  },
});

/**
 * Approve user access - grant them video access (admin only)
 * This sets paid=true and hasActiveYearAccess=true
 */
export const approveUserAccess = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const now = Date.now();
    
    await ctx.db.patch(args.userId, {
      paid: true,
      hasActiveYearAccess: true,
      paymentStatus: "completed",
      paymentDate: now,
      status: "active",
    });
    
    return null;
  },
});

/**
 * Revoke user access - remove video access (admin only)
 */
export const revokeUserAccess = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.userId, {
      paid: false,
      hasActiveYearAccess: false,
      paymentStatus: "pending",
    });
    
    return null;
  },
});

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/**
 * Get all users for admin interface
 */
export const getAllUsersForAdmin = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      clerkUserId: v.string(),
      onboardingCompleted: v.boolean(),
      role: v.union(v.literal("user"), v.literal("admin")),
      status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
      hasActiveYearAccess: v.boolean(),
      paid: v.boolean(),
      paymentDate: v.optional(v.number()),
      paymentId: v.optional(v.string()),
      paymentStatus: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      testeId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdmin(ctx);

    const limit = args.limit || 50; // Default limit

    return await ctx.db.query("users").order("desc").take(limit);
  },
});

/**
 * Search users by email/name for admin interface
 */
export const searchUsersForAdmin = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      clerkUserId: v.string(),
      onboardingCompleted: v.boolean(),
      role: v.union(v.literal("user"), v.literal("admin")),
      status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
      hasActiveYearAccess: v.boolean(),
      paid: v.boolean(),
      paymentDate: v.optional(v.number()),
      paymentId: v.optional(v.string()),
      paymentStatus: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      testeId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdmin(ctx);

    const limit = args.limit || 50; // Default limit
    const query = args.searchQuery.toLowerCase();

    // Get all users and filter by email/name in memory
    const allUsers = await ctx.db.query("users").order("desc").collect();

    const filteredUsers = allUsers.filter((user) => {
      const email = user.email?.toLowerCase() || "";
      const firstName = user.firstName?.toLowerCase() || "";
      const lastName = user.lastName?.toLowerCase() || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return (
        email.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });

    return filteredUsers.slice(0, limit);
  },
});

/**
 * Get all users with active video app access (admin only)
 */
export const getUsersWithActiveAccess = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      hasActiveYearAccess: v.boolean(),
      paid: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .withIndex("by_hasActiveYearAccess", (q) => q.eq("hasActiveYearAccess", true))
      .collect();

    return users.map((user) => ({
      _id: user._id,
      _creationTime: user._creationTime,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      hasActiveYearAccess: user.hasActiveYearAccess,
      paid: user.paid,
    }));
  },
});

