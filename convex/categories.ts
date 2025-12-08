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
    iconUrl: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    // Validate input lengths
    if (args.title.trim().length < 3) {
      throw new Error("Título deve ter pelo menos 3 caracteres");
    }
    
    if (args.slug.trim().length < 3) {
      throw new Error("Slug deve ter pelo menos 3 caracteres");
    }
    
    if (args.description.trim().length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Verificar se já existe uma categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Auto-assign position with retry logic to handle concurrent insertions
    // This prevents race conditions where multiple simultaneous creates
    // could calculate the same position value
    let categoryId: Id<"categories"> | null = null;
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Get the current max position (fresh read on each attempt)
      const allCategories = await ctx.db.query("categories").collect();
      const maxPosition = allCategories.length > 0 
        ? Math.max(...allCategories.map(c => c.position))
        : 0;
      const nextPosition = maxPosition + 1;

      // Insert with the calculated position
      categoryId = await ctx.db.insert("categories", {
        title: args.title,
        slug: args.slug,
        description: args.description,
        position: nextPosition,
        iconUrl: args.iconUrl,
      });

      // Verify no concurrent insertion created a duplicate position
      // by checking if another category was created with the same position
      // in the small time window between our read and insert
      const categoriesWithSamePosition = await ctx.db
        .query("categories")
        .withIndex("by_position", (q) => q.eq("position", nextPosition))
        .collect();

      // If we're the only one with this position, we're done
      if (categoriesWithSamePosition.length === 1) {
        break;
      }

      // Conflict detected - another concurrent insert got the same position
      // Delete our insert and retry with a fresh position calculation
      await ctx.db.delete(categoryId);
      categoryId = null;
      
      // The next iteration will re-read the categories and calculate a new position
    }

    if (!categoryId) {
      throw new Error("Não foi possível criar a categoria devido a conflitos concorrentes. Tente novamente.");
    }

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
    iconUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate input lengths
    if (args.title.trim().length < 3) {
      throw new Error("Título deve ter pelo menos 3 caracteres");
    }
    
    if (args.slug.trim().length < 3) {
      throw new Error("Slug deve ter pelo menos 3 caracteres");
    }
    
    if (args.description.trim().length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Verificar se já existe outra categoria com o mesmo slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe uma categoria com este slug");
    }

    // Get current category to preserve position
    const currentCategory = await ctx.db.get(args.id);
    if (!currentCategory) {
      throw new Error("Categoria não encontrada");
    }

    // Prepare update object
    // Note: iconUrl is always included (even if undefined) to allow clearing the icon
    await ctx.db.patch(args.id, {
      title: args.title,
      slug: args.slug,
      description: args.description,
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

