import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { rateLimiter } from "./lib/rateLimits";
import { requireAdmin } from "./users";

/**
 * List all coupons for a tenant (ADMIN)
 */
export const list = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coupons")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();
  },
});

/**
 * Get coupon by code within a tenant
 */
export const getByCode = query({
  args: {
    tenantId: v.id("tenants"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase();
    const byCode = await ctx.db
      .query("coupons")
      .withIndex("by_tenantId_and_code", (q) =>
        q.eq("tenantId", args.tenantId).eq("code", code),
      )
      .unique();
    return byCode ?? null;
  },
});

export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    code: v.string(),
    type: v.union(
      v.literal("percentage"),
      v.literal("fixed"),
      v.literal("fixed_price"),
    ),
    value: v.number(),
    description: v.string(),
    active: v.boolean(),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require admin access
    await requireAdmin(ctx);

    const code = args.code.toUpperCase();
    // Ensure uniqueness
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (existing) {
      throw new Error("Coupon code already exists");
    }
    return await ctx.db.insert("coupons", { ...args, code });
  },
});

export const update = mutation({
  args: {
    id: v.id("coupons"),
    code: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("percentage"),
        v.literal("fixed"),
        v.literal("fixed_price"),
      ),
    ),
    value: v.optional(v.number()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
    validFrom: v.optional(v.union(v.number(), v.null())),
    validUntil: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    // SECURITY: Require admin access
    await requireAdmin(ctx);

    const { id, ...rest } = args;
    const updates: Record<string, unknown> = { ...rest };
    if (updates.code) updates.code = (updates.code as string).toUpperCase();
    // Normalize nulls to undefined to clear fields
    if (updates.validFrom === null) updates.validFrom = undefined;
    if (updates.validUntil === null) updates.validUntil = undefined;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    // SECURITY: Require admin access
    await requireAdmin(ctx);

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Validate and apply coupon to a price
 * Returns the final price after applying coupon discount
 * Note: This is for UI preview only. Server must re-validate on order creation.
 * Changed to mutation to support rate limiting.
 */
export const validateAndApplyCoupon = mutation({
  args: {
    tenantId: v.id("tenants"),
    code: v.string(),
    originalPrice: v.number(),
    userCpf: v.optional(v.string()), // For checking per-user limits
  },
  handler: async (ctx, args) => {
    const identifier = args.userCpf || "anonymous";

    const { ok, retryAfter } = await rateLimiter.limit(
      ctx,
      "coupon_validation",
      {
        key: identifier,
      },
    );

    if (!ok) {
      const waitSeconds = retryAfter ? Math.ceil(retryAfter / 1000) : 60;
      return {
        isValid: false,
        errorMessage: `Muitas tentativas. Aguarde ${waitSeconds} segundos.`,
      };
    }

    const code = args.code.toUpperCase().trim();

    if (!code) {
      return {
        isValid: false,
        errorMessage: "Código de cupom inválido",
      };
    }

    // Find the coupon within the tenant
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_tenantId_and_code", (q) =>
        q.eq("tenantId", args.tenantId).eq("code", code),
      )
      .unique();

    if (!coupon) {
      return {
        isValid: false,
        errorMessage: "Cupom não encontrado",
      };
    }

    // Check if coupon is active
    if (!coupon.active) {
      return {
        isValid: false,
        errorMessage: "Cupom inativo",
      };
    }

    // Check if coupon is within valid date range
    const now = Date.now();
    if (coupon.validFrom !== undefined && now < coupon.validFrom) {
      return {
        isValid: false,
        errorMessage: "Cupom ainda não está válido",
      };
    }
    if (coupon.validUntil !== undefined && now > coupon.validUntil) {
      return {
        isValid: false,
        errorMessage: "Cupom expirado",
      };
    }

    // Calculate discount
    let finalPrice: number;

    if (coupon.type === "fixed_price") {
      finalPrice = coupon.value;
    } else if (coupon.type === "percentage") {
      const discountAmount = (args.originalPrice * coupon.value) / 100;
      finalPrice = args.originalPrice - discountAmount;
    } else {
      // fixed discount
      finalPrice = args.originalPrice - coupon.value;
    }

    // Clamp finalPrice to valid range [0, originalPrice]
    // This prevents negative prices and prices exceeding the original
    finalPrice = Math.max(0, Math.min(finalPrice, args.originalPrice));

    // Derive discount amount from clamped final price
    let discountAmount = args.originalPrice - finalPrice;

    // Ensure discount is within valid bounds
    discountAmount = Math.max(0, Math.min(discountAmount, args.originalPrice));

    return {
      isValid: true,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      couponDescription: coupon.description,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
    };
  },
});
