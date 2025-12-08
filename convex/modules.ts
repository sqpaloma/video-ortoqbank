import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Query para listar todos os módulos
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("modules"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const modules = await ctx.db.query("modules").collect();
    return modules;
  },
});

// Query para listar módulos de uma categoria específica
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  returns: v.array(
    v.object({
      _id: v.id("modules"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_categoryId_and_order", (q) => 
        q.eq("categoryId", args.categoryId)
      )
      .collect();

    return modules;
  },
});

// Query para buscar um módulo por ID
export const getById = query({
  args: { id: v.id("modules") },
  returns: v.union(
    v.object({
      _id: v.id("modules"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.id);
    return module;
  },
});

// Query para buscar um módulo por slug
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("modules"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      order_index: v.number(),
      totalLessonVideos: v.number(),
      lessonCounter: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const module = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return module;
  },
});

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mutation para criar um novo módulo
export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
  },
  returns: v.id("modules"),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe um módulo com o mesmo slug
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error("Já existe um módulo com este slug");
    }

    // Auto-calculate next order_index for this category
    const modulesInCategory = await ctx.db
      .query("modules")
      .withIndex("by_categoryId_and_order", (q) => 
        q.eq("categoryId", args.categoryId)
      )
      .collect();
    
    const maxOrderIndex = modulesInCategory.reduce(
      (max, module) => Math.max(max, module.order_index),
      -1
    );
    const nextOrderIndex = maxOrderIndex + 1;

    const moduleId: Id<"modules"> = await ctx.db.insert("modules", {
      categoryId: args.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      order_index: nextOrderIndex,
      totalLessonVideos: 0,
      lessonCounter: 0,
    });

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.contentStats.incrementModules, { amount: 1 });

    return moduleId;
  },
});

// Mutation para atualizar um módulo
export const update = mutation({
  args: {
    id: v.id("modules"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.string(),
    order_index: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Auto-generate slug from title
    const slug = generateSlug(args.title);

    // Verificar se já existe outro módulo com o mesmo slug
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Já existe um módulo com este slug");
    }

    await ctx.db.patch(args.id, {
      categoryId: args.categoryId,
      title: args.title,
      slug: slug,
      description: args.description,
      order_index: args.order_index,
    });

    return null;
  },
});

// Mutation para deletar um módulo
export const remove = mutation({
  args: {
    id: v.id("modules"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verificar se existem lessons associadas
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.id))
      .first();

    if (lessons) {
      throw new Error("Não é possível deletar um módulo que possui aulas associadas");
    }

    await ctx.db.delete(args.id);

    // Update contentStats
    await ctx.scheduler.runAfter(0, internal.contentStats.decrementModules, { amount: 1 });

    return null;
  },
});

