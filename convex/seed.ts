import { mutation, internalMutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

/**
 * Seed the database with sample video data for testing
 * DEPRECATED: Use seedLessons instead
 */
export const seedVideos = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("⚠️  Esta função está depreciada. Use seedLessons() ou seedAll() em vez disso.");
    console.log("A estrutura agora é: Categories -> Modules -> Lessons");
    return null;
  },
});

/**
 * Clear all data from progress table (for testing)
 * DEPRECATED: Progress table was removed
 */
export const clearUserData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("⚠️  Esta função está depreciada. A tabela 'progress' foi removida.");
    return null;
  },
});

/**
 * Clear all videos (for testing)
 * DEPRECATED: Use clearLessons instead
 */
export const clearVideos = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("⚠️  Esta função está depreciada. Use clearLessons() ou clearAll() em vez disso.");
    console.log("A estrutura agora é: Categories -> Modules -> Lessons");
    return null;
  },
});

/**
 * Seed the database with sample categories
 */
export const seedCategories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if categories already exist
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      return null;
    }

    // Sample categories
    const categories = [
      {
        title: "Ciências Básicas em Ortopedia",
        slug: "ciencias-basicas-em-ortopedia",
        description: "Fundamentos anatômicos, biomecânicos e fisiológicos aplicados à ortopedia",
        position: 1,
        isPublished: true,
      },
      {
        title: "Trauma Ortopédico",
        slug: "trauma-ortopedico",
        description: "Avaliação e tratamento de fraturas, luxações e lesões traumáticas",
        position: 2,
        isPublished: true,
      },
      {
        title: "Cirurgia de Mão",
        slug: "cirurgia-de-mao",
        description: "Anatomia, patologias e técnicas cirúrgicas da mão e punho",
        position: 3,
        isPublished: true,
      },
      {
        title: "Artroscopia",
        slug: "artroscopia",
        description: "Técnicas minimamente invasivas para diagnóstico e tratamento articular",
        position: 4,
        isPublished: true,
      },
      {
        title: "Coluna Vertebral",
        slug: "coluna-vertebral",
        description: "Patologias da coluna e técnicas de tratamento conservador e cirúrgico",
        position: 5,
        isPublished: true,
      },
      {
        title: "Ortopedia Pediátrica",
        slug: "ortopedia-pediatrica",
        description: "Alterações musculoesqueléticas na infância e adolescência",
        position: 6,
        isPublished: true,
      },
      {
        title: "Medicina Esportiva",
        slug: "medicina-esportiva",
        description: "Lesões esportivas, prevenção e reabilitação do atleta",
        position: 7,
        isPublished: true,
      },
      {
        title: "Tumores Músculoesqueléticos",
        slug: "tumores-musculoesqueleticos",
        description: "Diagnóstico e tratamento de tumores ósseos e de partes moles",
        position: 8,
        isPublished: true,
      },
      {
        title: "Reconstrução Articular",
        slug: "reconstrucao-articular",
        description: "Artroplastias e procedimentos reconstrutivos das articulações",
        position: 9,
        isPublished: true,
      },
    ];

    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }

    return null;
  },
});

/**
 * Clear all categories (for testing)
 */
export const clearCategories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    return null;
  },
});

/**
 * Seed the database with sample modules
 */
export const seedModules = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if modules already exist
    const existingModules = await ctx.db.query("modules").first();
    if (existingModules) {
      return null;
    }

    // Get categories first
    const categories = await ctx.db.query("categories").collect();
    
    if (categories.length === 0) {
      throw new Error("Você precisa criar categorias primeiro. Execute seedCategories()");
    }

    // Create 2-3 modules for each category
    const modulesData = [
      // Ciências Básicas
      {
        categorySlug: "ciencias-basicas-em-ortopedia",
        modules: [
          {
            title: "Anatomia do Sistema Musculoesquelético",
            slug: "anatomia-do-sistema-musculoesqueletico",
            description: "Estudo detalhado da anatomia óssea, articular e muscular",
            order_index: 0,
          },
          {
            title: "Biomecânica Aplicada",
            slug: "biomecanica-aplicada",
            description: "Princípios biomecânicos aplicados à ortopedia",
            order_index: 1,
          },
        ],
      },
      // Trauma
      {
        categorySlug: "trauma-ortopedico",
        modules: [
          {
            title: "Fraturas de Membros Superiores",
            slug: "fraturas-de-membros-superiores",
            description: "Avaliação e tratamento de fraturas do membro superior",
            order_index: 0,
          },
          {
            title: "Fraturas de Membros Inferiores",
            slug: "fraturas-de-membros-inferiores",
            description: "Avaliação e tratamento de fraturas do membro inferior",
            order_index: 1,
          },
        ],
      },
      // Cirurgia de Mão
      {
        categorySlug: "cirurgia-de-mao",
        modules: [
          {
            title: "Anatomia da Mão e Punho",
            slug: "anatomia-da-mao-e-punho",
            description: "Anatomia detalhada da mão e punho",
            order_index: 0,
          },
          {
            title: "Lesões Traumáticas da Mão",
            slug: "lesoes-traumaticas-da-mao",
            description: "Manejo de traumas da mão",
            order_index: 1,
          },
        ],
      },
    ];

    for (const categoryData of modulesData) {
      const category = categories.find(c => c.slug === categoryData.categorySlug);
      
      if (category) {
        for (const moduleData of categoryData.modules) {
          await ctx.db.insert("modules", {
            categoryId: category._id,
            title: moduleData.title,
            slug: moduleData.slug,
            description: moduleData.description,
            order_index: moduleData.order_index,
            totalLessonVideos: 0,
            isPublished: true,
            lessonCounter: 0,
          });
        }
      }
    }

    return null;
  },
});

/**
 * Clear all modules (for testing)
 */
export const clearModules = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const modules = await ctx.db.query("modules").collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    return null;
  },
});

/**
 * Seed the database with sample lessons
 */
export const seedLessons = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if lessons already exist
    const existingLessons = await ctx.db.query("lessons").first();
    if (existingLessons) {
      return null;
    }

    // Get modules first
    const modules = await ctx.db.query("modules").collect();
    
    if (modules.length === 0) {
      throw new Error("Você precisa criar módulos primeiro. Execute seedModules()");
    }

    // Create 3-5 lessons for each module
    let lessonCount = 0;

    for (const module of modules) {
      const numLessons = 4; // 4 aulas por módulo
      
      for (let i = 1; i <= numLessons; i++) {
        lessonCount++;
        await ctx.db.insert("lessons", {
          moduleId: module._id,
          title: `${module.title} - Aula ${i}`,
          slug: `${module.slug}-aula-${i}`,
          description: `Nesta aula você vai aprender conceitos importantes sobre ${module.title.toLowerCase()}. Vamos explorar os fundamentos e aplicações práticas.`,
          durationSeconds: 600 + (i * 120), // 10 min + 2 min por aula
          order_index: i,
          lessonNumber: i,
          isPublished: true,
          tags: ["ortopedia", "medicina"],
        });
      }

      // Atualizar o total de lessons no módulo
      await ctx.db.patch(module._id, {
        totalLessonVideos: numLessons,
      });
    }

    return null;
  },
});

/**
 * Clear all lessons (for testing)
 */
export const clearLessons = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    // Reset totalLessonVideos in all modules
    const modules = await ctx.db.query("modules").collect();
    for (const module of modules) {
      await ctx.db.patch(module._id, {
        totalLessonVideos: 0,
      });
    }

    return null;
  },
});

/**
 * Seed everything at once (categories -> modules -> lessons)
 */
export const seedAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.seedCategories, {});
    await ctx.runMutation(internal.seed.seedModules, {});
    await ctx.runMutation(internal.seed.seedLessons, {});
    await ctx.runMutation(api.seed.initializeContentStats, {});
    return null;
  },
});

/**
 * Reseed completo - limpa tudo e recria
 */
export const reseedAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.clearEverything, {});
    await ctx.runMutation(internal.seed.seedAll, {});
    return null;
  },
});

/**
 * Clear everything at once
 */
export const clearAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.clearLessons, {});
    await ctx.runMutation(internal.seed.clearModules, {});
    await ctx.runMutation(internal.seed.clearCategories, {});
    return null;
  },
});

/**
 * Initialize or recalculate content statistics
 */
export const initializeContentStats = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(api.contentStats.recalculate, {});
    return null;
  },
});

/**
 * Adiciona o campo isPublished a todas as categorias existentes
 */
export const migrateCategories = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    
    let updated = 0;
    for (const category of categories) {
      if (category.isPublished === undefined) {
        await ctx.db.patch(category._id, {
          isPublished: true,
        });
        updated++;
      }
    }
    
    return null;
  },
});

/**
 * Adiciona o campo isPublished a todos os módulos existentes
 */
export const migrateModules = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const modules = await ctx.db.query("modules").collect();
    
    let updated = 0;
    for (const module of modules) {
      if (module.isPublished === undefined) {
        await ctx.db.patch(module._id, {
          isPublished: true,
        });
        updated++;
      }
    }
    
    return null;
  },
});

/**
 * Deleta TODAS as aulas órfãs (sem módulo pai)
 */
export const cleanOrphanLessons = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    
    let deleted = 0;
    for (const lesson of lessons) {
      // Verificar se o módulo pai existe
      const module = await ctx.db.get(lesson.moduleId);
      if (!module) {
        await ctx.db.delete(lesson._id);
        deleted++;
      }
    }
    
    return null;
  },
});

/**
 * Deleta TODAS as aulas do banco
 */
export const deleteAllLessons = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }
    
    return null;
  },
});

/**
 * Debug: Mostra estado atual do banco de dados
 */
export const debugDatabase = internalQuery({
  args: {},
  returns: v.object({
    categories: v.number(),
    modules: v.number(),
    lessons: v.number(),
    orphanedLessons: v.number(),
  }),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const modules = await ctx.db.query("modules").collect();
    const lessons = await ctx.db.query("lessons").collect();

    const orphanedLessons = lessons.filter(l => {
      const module = modules.find(m => m._id === l.moduleId);
      return !module;
    });
    
    return {
      categories: categories.length,
      modules: modules.length,
      lessons: lessons.length,
      orphanedLessons: orphanedLessons.length,
    };
  },
});

/**
 * Recria apenas os módulos (se você já tem categorias)
 */
export const recreateModules = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const modules = await ctx.db.query("modules").collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }
    await ctx.runMutation(internal.seed.seedModules, {});
    return null;
  },
});

/**
 * Limpa TUDO: categorias, módulos e aulas
 */
export const clearEverything = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    const modules = await ctx.db.query("modules").collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    return null;
  },
});

