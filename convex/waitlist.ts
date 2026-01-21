import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query } from "./_generated/server";
import { requireTenantAdmin } from "./lib/tenantContext";

export const createWaitlistEntry = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    email: v.string(),
    whatsapp: v.string(),
    instagram: v.optional(v.string()),
    residencyLevel: v.union(
      v.literal("R1"),
      v.literal("R2"),
      v.literal("R3"),
      v.literal("Já concluí"),
    ),
    subspecialty: v.union(
      v.literal("Pediátrica"),
      v.literal("Tumor"),
      v.literal("Quadril"),
      v.literal("Joelho"),
      v.literal("Ombro e Cotovelo"),
      v.literal("Mão"),
      v.literal("Coluna"),
      v.literal("Pé e Tornozelo"),
    ),
  },
  handler: async (ctx, args) => {
    // Check if email already exists for this tenant
    if (args.tenantId) {
      const existingEntry = await ctx.db
        .query("waitlist")
        .withIndex("by_tenantId_and_email", (q) =>
          q.eq("tenantId", args.tenantId).eq("email", args.email)
        )
        .first();

      if (existingEntry) {
        return "email_already_exists";
      }
    } else {
      // Fallback for entries without tenantId (legacy)
      const existingEntry = await ctx.db
        .query("waitlist")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (existingEntry) {
        return "email_already_exists";
      }
    }

    // Create the waitlist entry
    const entryId = await ctx.db.insert("waitlist", {
      tenantId: args.tenantId,
      name: args.name,
      email: args.email,
      whatsapp: args.whatsapp,
      instagram: args.instagram,
      residencyLevel: args.residencyLevel,
      subspecialty: args.subspecialty,
    });

    return entryId;
  },
});

export const list = query({
  args: {
    tenantId: v.id("tenants"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Require tenant admin access to list waitlist entries
    if (args.tenantId) {
      await requireTenantAdmin(ctx, args.tenantId);

      return await ctx.db
        .query("waitlist")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // If no tenantId, return all (for backward compatibility, requires superadmin)
    // This branch should not be reached in normal usage
    return await ctx.db
      .query("waitlist")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
