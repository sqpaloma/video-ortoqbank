import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  getTenantBySlug,
  getTenantOrThrow,
  requireSuperAdmin,
  requireTenantAdmin,
  getUserTenantMemberships,
  getTenantMembers,
  getUserTenantMembership,
  hasActiveTenantAccess,
} from "./lib/tenantContext";
import { getCurrentUser } from "./users";

// ============================================================================
// PUBLIC QUERIES (for tenant resolution)
// ============================================================================

/**
 * Get tenant by slug (for subdomain resolution)
 * This is called early in the app to resolve the current tenant
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("tenants"),
      name: v.string(),
      slug: v.string(),
      domain: v.optional(v.string()),
      displayName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("suspended")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const tenant = await getTenantBySlug(ctx, args.slug);
    if (!tenant) {
      return null;
    }
    return {
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      displayName: tenant.displayName,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      status: tenant.status,
    };
  },
});

/**
 * Get tenant by ID
 */
export const getById = query({
  args: { tenantId: v.id("tenants") },
  returns: v.union(
    v.object({
      _id: v.id("tenants"),
      name: v.string(),
      slug: v.string(),
      domain: v.optional(v.string()),
      displayName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("suspended")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return null;
    }
    return {
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      displayName: tenant.displayName,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      status: tenant.status,
    };
  },
});

/**
 * List all active tenants (superadmin only)
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tenants"),
      name: v.string(),
      slug: v.string(),
      domain: v.optional(v.string()),
      displayName: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("suspended")),
    }),
  ),
  handler: async (ctx) => {
    // Require superadmin for listing all tenants
    await requireSuperAdmin(ctx);

    const tenants = await ctx.db.query("tenants").order("desc").collect();

    return tenants.map((t) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
      domain: t.domain,
      displayName: t.displayName,
      logoUrl: t.logoUrl,
      primaryColor: t.primaryColor,
      status: t.status,
    }));
  },
});

/**
 * Get tenants that the current user is a member of
 */
export const getMyTenants = query({
  args: {},
  returns: v.array(
    v.object({
      tenantId: v.id("tenants"),
      name: v.string(),
      slug: v.string(),
      domain: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      role: v.union(v.literal("member"), v.literal("admin")),
      hasActiveAccess: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const memberships = await getUserTenantMemberships(ctx, user._id);

    const results = [];
    for (const membership of memberships) {
      const tenant = await ctx.db.get(membership.tenantId);
      if (tenant && tenant.status === "active") {
        results.push({
          tenantId: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          logoUrl: tenant.logoUrl,
          role: membership.role,
          hasActiveAccess: membership.hasActiveAccess,
        });
      }
    }

    return results;
  },
});

// ============================================================================
// SUPERADMIN MUTATIONS (cross-tenant management)
// ============================================================================

/**
 * Create a new tenant (superadmin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
  },
  returns: v.id("tenants"),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(args.slug)) {
      throw new Error(
        "Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing/consecutive hyphens)",
      );
    }

    if (args.slug.length < 3 || args.slug.length > 50) {
      throw new Error("Slug must be between 3 and 50 characters");
    }

    // Check if slug is already taken
    const existing = await getTenantBySlug(ctx, args.slug);
    if (existing) {
      throw new Error("A tenant with this slug already exists");
    }

    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      domain: args.domain,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor,
      status: "active",
    });

    return tenantId;
  },
});

/**
 * Update a tenant (superadmin only)
 */
export const update = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const tenant = await getTenantOrThrow(ctx, args.tenantId);

    const updates: Partial<{
      name: string;
      domain: string;
      logoUrl: string;
      primaryColor: string;
    }> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.domain !== undefined) {
      updates.domain = args.domain;
    }
    if (args.logoUrl !== undefined) {
      updates.logoUrl = args.logoUrl;
    }
    if (args.primaryColor !== undefined) {
      updates.primaryColor = args.primaryColor;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(tenant._id, updates);
    }

    return null;
  },
});

/**
 * Suspend a tenant (superadmin only)
 */
export const suspend = mutation({
  args: { tenantId: v.id("tenants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    await ctx.db.patch(args.tenantId, { status: "suspended" });

    return null;
  },
});

/**
 * Activate a suspended tenant (superadmin only)
 */
export const activate = mutation({
  args: { tenantId: v.id("tenants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    await ctx.db.patch(args.tenantId, { status: "active" });

    return null;
  },
});

// ============================================================================
// MEMBERSHIP MANAGEMENT (tenant admin)
// ============================================================================

/**
 * List members of a tenant (tenant admin only)
 */
export const listMembers = query({
  args: { tenantId: v.id("tenants") },
  returns: v.array(
    v.object({
      membershipId: v.id("tenantMemberships"),
      userId: v.id("users"),
      email: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      role: v.union(v.literal("member"), v.literal("admin")),
      hasActiveAccess: v.boolean(),
      accessExpiresAt: v.optional(v.number()),
      joinedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);

    const memberships = await getTenantMembers(ctx, args.tenantId);

    const results = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        results.push({
          membershipId: membership._id,
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: membership.role,
          hasActiveAccess: membership.hasActiveAccess,
          accessExpiresAt: membership.accessExpiresAt,
          joinedAt: membership.joinedAt,
        });
      }
    }

    return results;
  },
});

/**
 * Add a member to a tenant (tenant admin only)
 */
export const addMember = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("admin")),
    hasActiveAccess: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
  },
  returns: v.id("tenantMemberships"),
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);

    // Check if membership already exists
    const existing = await getUserTenantMembership(
      ctx,
      args.userId,
      args.tenantId,
    );
    if (existing) {
      throw new Error("User is already a member of this tenant");
    }

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const membershipId = await ctx.db.insert("tenantMemberships", {
      tenantId: args.tenantId,
      userId: args.userId,
      role: args.role,
      hasActiveAccess: args.hasActiveAccess,
      accessExpiresAt: args.accessExpiresAt,
      joinedAt: Date.now(),
    });

    return membershipId;
  },
});

/**
 * Remove a member from a tenant (tenant admin only)
 */
export const removeMember = mutation({
  args: {
    tenantId: v.id("tenants"),
    membershipId: v.id("tenantMemberships"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireTenantAdmin(ctx, args.tenantId);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    if (membership.tenantId !== args.tenantId) {
      throw new Error("Membership does not belong to this tenant");
    }

    // Prevent removing yourself (last admin check could be added here)
    if (membership.userId === user._id && user.role !== "superadmin") {
      throw new Error("Cannot remove yourself from the tenant");
    }
    // Prevent removing the last admin
    // OPTIMIZED: Uses by_tenantId_and_role index instead of filter
    if (membership.role === "admin") {
      const adminMemberships = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId_and_role", (q) =>
          q.eq("tenantId", args.tenantId).eq("role", "admin"),
        )
        .collect();
      if (adminMemberships.length <= 1) {
        throw new Error("Cannot remove the last admin from the tenant");
      }
    }

    await ctx.db.delete(args.membershipId);

    return null;
  },
});

/**
 * Update member role (tenant admin only)
 */
export const updateMemberRole = mutation({
  args: {
    tenantId: v.id("tenants"),
    membershipId: v.id("tenantMemberships"),
    role: v.union(v.literal("member"), v.literal("admin")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireTenantAdmin(ctx, args.tenantId);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    if (membership.tenantId !== args.tenantId) {
      throw new Error("Membership does not belong to this tenant");
    }

    // Prevent demoting yourself unless superadmin
    if (
      membership.userId === user._id &&
      args.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      throw new Error("Cannot demote yourself");
    }
    // Prevent demoting the last admin
    // OPTIMIZED: Uses by_tenantId_and_role index instead of filter
    if (membership.role === "admin" && args.role === "member") {
      const adminCount = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId_and_role", (q) =>
          q.eq("tenantId", args.tenantId).eq("role", "admin"),
        )
        .collect();
      if (adminCount.length <= 1) {
        throw new Error("Cannot demote the last admin");
      }
    }

    await ctx.db.patch(args.membershipId, { role: args.role });

    return null;
  },
});

/**
 * Update member access (tenant admin only)
 */
export const updateMemberAccess = mutation({
  args: {
    tenantId: v.id("tenants"),
    membershipId: v.id("tenantMemberships"),
    hasActiveAccess: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    if (membership.tenantId !== args.tenantId) {
      throw new Error("Membership does not belong to this tenant");
    }

    await ctx.db.patch(args.membershipId, {
      hasActiveAccess: args.hasActiveAccess,
      accessExpiresAt: args.accessExpiresAt,
    });

    return null;
  },
});

// ============================================================================
// BRANDING MANAGEMENT (tenant admin)
// ============================================================================

/**
 * Update tenant branding (display name, logo, primary color, domain)
 * Only tenant admins can update their own tenant's branding
 */
export const updateBranding = mutation({
  args: {
    tenantId: v.id("tenants"),
    displayName: v.optional(v.string()),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require that the user is an admin of this specific tenant
    await requireTenantAdmin(ctx, args.tenantId);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Build update object with only provided fields
    const updates: Partial<{
      displayName: string;
      domain: string;
      logoUrl: string;
      primaryColor: string;
    }> = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName;
    }
    if (args.domain !== undefined) {
      updates.domain = args.domain;
    }
    if (args.logoUrl !== undefined) {
      updates.logoUrl = args.logoUrl;
    }
    if (args.primaryColor !== undefined) {
      updates.primaryColor = args.primaryColor;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.tenantId, updates);
    }

    return null;
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for system use)
// ============================================================================

/**
 * Create default tenant (for migration)
 * Called once during initial setup
 */
export const createDefaultTenant = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    domain: v.optional(v.string()),
  },
  returns: v.id("tenants"),
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await getTenantBySlug(ctx, args.slug);
    if (existing) {
      return existing._id;
    }

    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      domain: args.domain,
      status: "active",
    });

    return tenantId;
  },
});

/**
 * Add user to tenant (internal - for payment/provisioning flow)
 */
export const addMemberInternal = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("admin")),
    hasActiveAccess: v.boolean(),
    accessExpiresAt: v.optional(v.number()),
  },
  returns: v.id("tenantMemberships"),
  handler: async (ctx, args) => {
    // Check if membership already exists
    const existing = await getUserTenantMembership(
      ctx,
      args.userId,
      args.tenantId,
    );

    if (existing) {
      // Update existing membership
      await ctx.db.patch(existing._id, {
        hasActiveAccess: args.hasActiveAccess,
        accessExpiresAt: args.accessExpiresAt,
      });
      return existing._id;
    }

    // Create new membership
    const membershipId = await ctx.db.insert("tenantMemberships", {
      tenantId: args.tenantId,
      userId: args.userId,
      role: args.role,
      hasActiveAccess: args.hasActiveAccess,
      accessExpiresAt: args.accessExpiresAt,
      joinedAt: Date.now(),
    });

    return membershipId;
  },
});

/**
 * Check user access in tenant (public query for access checks)
 */
export const checkUserAccess = query({
  args: { tenantId: v.id("tenants") },
  returns: v.object({
    hasAccess: v.boolean(),
    role: v.optional(v.union(v.literal("member"), v.literal("admin"))),
    isSuperAdmin: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return { hasAccess: false, isSuperAdmin: false };
    }

    if (user.role === "superadmin") {
      return { hasAccess: true, isSuperAdmin: true, role: "admin" as const };
    }

    const hasAccess = await hasActiveTenantAccess(ctx, user._id, args.tenantId);
    const membership = await getUserTenantMembership(
      ctx,
      user._id,
      args.tenantId,
    );

    return {
      hasAccess,
      role: membership?.role,
      isSuperAdmin: false,
    };
  },
});
