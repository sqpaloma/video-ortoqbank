import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
export const seedCategories = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if categories already exist
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      console.log("Categories already seeded");
      return null;
    }

    // Sample categories
    const categories = [
      {
        title: "Ciências Básicas em Ortopedia",
        slug: "ciencias-basicas-em-ortopedia",
        description: "Fundamentos anatômicos, biomecânicos e fisiológicos aplicados à ortopedia",
        position: 1,
      },
      {
        title: "Trauma Ortopédico",
        slug: "trauma-ortopedico",
        description: "Avaliação e tratamento de fraturas, luxações e lesões traumáticas",
        position: 2,
      },
      {
        title: "Cirurgia de Mão",
        slug: "cirurgia-de-mao",
        description: "Anatomia, patologias e técnicas cirúrgicas da mão e punho",
        position: 3,
      },
      {
        title: "Artroscopia",
        slug: "artroscopia",
        description: "Técnicas minimamente invasivas para diagnóstico e tratamento articular",
        position: 4,
      },
      {
        title: "Coluna Vertebral",
        slug: "coluna-vertebral",
        description: "Patologias da coluna e técnicas de tratamento conservador e cirúrgico",
        position: 5,
      },
      {
        title: "Ortopedia Pediátrica",
        slug: "ortopedia-pediatrica",
        description: "Alterações musculoesqueléticas na infância e adolescência",
        position: 6,
      },
      {
        title: "Medicina Esportiva",
        slug: "medicina-esportiva",
        description: "Lesões esportivas, prevenção e reabilitação do atleta",
        position: 7,
      },
      {
        title: "Tumores Músculoesqueléticos",
        slug: "tumores-musculoesqueleticos",
        description: "Diagnóstico e tratamento de tumores ósseos e de partes moles",
        position: 8,
      },
      {
        title: "Reconstrução Articular",
        slug: "reconstrucao-articular",
        description: "Artroplastias e procedimentos reconstrutivos das articulações",
        position: 9,
      },
    ];

    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }

    console.log("Sample categories seeded successfully!");
    return null;
  },
});

/**
 * Clear all categories (for testing)
 */
export const clearCategories = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    console.log("Categories cleared successfully!");
    return null;
  },
});

/**
 * Seed the database with sample modules
 */
export const seedModules = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if modules already exist
    const existingModules = await ctx.db.query("modules").first();
    if (existingModules) {
      console.log("Modules already seeded");
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
            order_index: 1,
          },
          {
            title: "Biomecânica Aplicada",
            slug: "biomecanica-aplicada",
            description: "Princípios biomecânicos aplicados à ortopedia",
            order_index: 2,
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
            order_index: 1,
          },
          {
            title: "Fraturas de Membros Inferiores",
            slug: "fraturas-de-membros-inferiores",
            description: "Avaliação e tratamento de fraturas do membro inferior",
            order_index: 2,
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
            order_index: 1,
          },
          {
            title: "Lesões Traumáticas da Mão",
            slug: "lesoes-traumaticas-da-mao",
            description: "Manejo de traumas da mão",
            order_index: 2,
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
            totalLessonVideos: 0, // Será atualizado quando criarmos as lessons
          });
        }
      }
    }

    console.log("Sample modules seeded successfully!");
    return null;
  },
});

/**
 * Clear all modules (for testing)
 */
export const clearModules = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const modules = await ctx.db.query("modules").collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    console.log("Modules cleared successfully!");
    return null;
  },
});

/**
 * Seed the database with sample lessons
 */
export const seedLessons = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if lessons already exist
    const existingLessons = await ctx.db.query("lessons").first();
    if (existingLessons) {
      console.log("Lessons already seeded");
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

    console.log(`${lessonCount} sample lessons seeded successfully!`);
    return null;
  },
});

/**
 * Clear all lessons (for testing)
 */
export const clearLessons = mutation({
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

    console.log("Lessons cleared successfully!");
    return null;
  },
});

/**
 * Seed everything at once (categories -> modules -> lessons)
 */
export const seedAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if already seeded
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      console.log("Database already seeded. Use clear functions to reset.");
      return null;
    }

    console.log("Seeding categories...");
    await ctx.runMutation(api.seed.seedCategories, {});
    
    console.log("Seeding modules...");
    await ctx.runMutation(api.seed.seedModules, {});
    
    console.log("Seeding lessons...");
    await ctx.runMutation(api.seed.seedLessons, {});

    console.log("All data seeded successfully!");
    return null;
  },
});

/**
 * Clear everything at once
 */
export const clearAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("Clearing lessons...");
    await ctx.runMutation(api.seed.clearLessons, {});
    
    console.log("Clearing modules...");
    await ctx.runMutation(api.seed.clearModules, {});
    
    console.log("Clearing categories...");
    await ctx.runMutation(api.seed.clearCategories, {});

    console.log("All data cleared successfully!");
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
    console.log("Initializing content statistics...");
    await ctx.runMutation(api.contentStats.recalculate, {});
    console.log("Content statistics initialized successfully!");
    return null;
  },
});

