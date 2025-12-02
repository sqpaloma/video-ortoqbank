import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Query para listar todas as categorias ordenadas por position
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_position")
      .collect();

    return categories;
  },
});

// Query para buscar uma categoria por ID
export const getById = query({
  args: { id: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    return category;
  },
});

// Query para buscar uma categoria por slug
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      position: v.number(),
      iconUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return category;
  },
});

// Mutation para criar uma nova categoria
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    position: v.number(),
    iconUrl: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    // Verificar se já existe uma categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma categoria com este slug");
    }

    const categoryId: Id<"categories"> = await ctx.db.insert("categories", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      position: args.position,
      iconUrl: args.iconUrl,
    });

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.contentStats.incrementCategories, { amount: 1 });

    return categoryId;
  },
});

// Mutation para atualizar uma categoria
export const update = mutation({
  args: {
    id: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    position: v.number(),
    iconUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verificar se já existe outra categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma categoria com este slug");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      slug: args.slug,
      description: args.description,
      position: args.position,
      iconUrl: args.iconUrl,
    });

    return null;
  },
});

// Mutation para deletar uma categoria
export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.contentStats.decrementCategories, { amount: 1 });

    return null;
  },
});

