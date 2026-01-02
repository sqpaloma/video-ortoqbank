import { mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

/**
 * Seed the database with sample video data for testing
 * DEPRECATED: Use seedLessons instead
 */
export const seedVideos = mutation({
  args: {},
  returns: v.null(),
  handler: async () => {
    console.log(
      "⚠️  Esta função está depreciada. Use seedLessons() ou seedAll() em vez disso.",
    );
    console.log("A estrutura agora é: Categories -> Units -> Lessons");
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
  handler: async () => {
    console.log(
      "⚠️  Esta função está depreciada. A tabela 'progress' foi removida.",
    );
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
  handler: async () => {
    console.log(
      "⚠️  Esta função está depreciada. Use clearLessons() ou clearAll() em vez disso.",
    );
    console.log("A estrutura agora é: Categories -> Units -> Lessons");
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
        description:
          "Fundamentos anatômicos, biomecânicos e fisiológicos aplicados à ortopedia",
        position: 1,
        isPublished: true,
      },
      {
        title: "Trauma Ortopédico",
        slug: "trauma-ortopedico",
        description:
          "Avaliação e tratamento de fraturas, luxações e lesões traumáticas",
        position: 2,
        isPublished: true,
      },
      {
        title: "Cirurgia de Mão",
        slug: "cirurgia-de-mao",
        description:
          "Anatomia, patologias e técnicas cirúrgicas da mão e punho",
        position: 3,
        isPublished: true,
      },
      {
        title: "Artroscopia",
        slug: "artroscopia",
        description:
          "Técnicas minimamente invasivas para diagnóstico e tratamento articular",
        position: 4,
        isPublished: true,
      },
      {
        title: "Coluna Vertebral",
        slug: "coluna-vertebral",
        description:
          "Patologias da coluna e técnicas de tratamento conservador e cirúrgico",
        position: 5,
        isPublished: true,
      },
      {
        title: "Ortopedia Pediátrica",
        slug: "ortopedia-pediatrica",
        description:
          "Alterações musculoesqueléticas na infância e adolescência",
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
        description:
          "Diagnóstico e tratamento de tumores ósseos e de partes moles",
        position: 8,
        isPublished: true,
      },
      {
        title: "Reconstrução Articular",
        slug: "reconstrucao-articular",
        description:
          "Artroplastias e procedimentos reconstrutivos das articulações",
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
 * Seed the database with sample units
 */
export const seedUnits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if units already exist
    const existingUnits = await ctx.db.query("units").first();
    if (existingUnits) {
      return null;
    }

    // Get categories first
    const categories = await ctx.db.query("categories").collect();

    if (categories.length === 0) {
      throw new Error(
        "Você precisa criar categorias primeiro. Execute seedCategories()",
      );
    }

    // Create 2-3 units for each category
    const unitsData = [
      // Ciências Básicas
      {
        categorySlug: "ciencias-basicas-em-ortopedia",
        units: [
          {
            title: "Anatomia do Sistema Musculoesquelético",
            slug: "anatomia-do-sistema-musculoesqueletico",
            description:
              "Estudo detalhado da anatomia óssea, articular e muscular",
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
        units: [
          {
            title: "Fraturas de Membros Superiores",
            slug: "fraturas-de-membros-superiores",
            description:
              "Avaliação e tratamento de fraturas do membro superior",
            order_index: 0,
          },
          {
            title: "Fraturas de Membros Inferiores",
            slug: "fraturas-de-membros-inferiores",
            description:
              "Avaliação e tratamento de fraturas do membro inferior",
            order_index: 1,
          },
        ],
      },
      // Cirurgia de Mão
      {
        categorySlug: "cirurgia-de-mao",
        units: [
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

    for (const categoryData of unitsData) {
      const category = categories.find(
        (c) => c.slug === categoryData.categorySlug,
      );

      if (category) {
        for (const unitData of categoryData.units) {
          await ctx.db.insert("units", {
            categoryId: category._id,
            title: unitData.title,
            slug: unitData.slug,
            description: unitData.description,
            order_index: unitData.order_index,
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
 * Clear all units (for testing)
 */
export const clearUnits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const units = await ctx.db.query("units").collect();
    for (const unit of units) {
      await ctx.db.delete(unit._id);
    }

    return null;
  },
});

/**
 * Seed the database with sample lessons for MODULES
 */
/**
 * Seed the database with sample lessons for UNITS
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

    // Get units first
    const units = await ctx.db.query("units").collect();

    if (units.length === 0) {
      throw new Error(
        "Você precisa criar unidades primeiro. Execute seedUnits()",
      );
    }

    // Create 3-5 lessons for each unit
    for (const unit of units) {
      const numLessons = 4; // 4 aulas por unidade

      for (let i = 1; i <= numLessons; i++) {
        await ctx.db.insert("lessons", {
          unitId: unit._id,
          categoryId: unit.categoryId, // IMPORTANT: categoryId from parent unit
          title: `${unit.title} - Aula ${i}`,
          slug: `${unit.slug}-aula-${i}`,
          description: `Nesta aula você vai aprender conceitos importantes sobre ${unit.title.toLowerCase()}. Vamos explorar os fundamentos e aplicações práticas.`,
          durationSeconds: 600 + i * 120, // 10 min + 2 min por aula
          order_index: i,
          lessonNumber: i,
          isPublished: true,
          tags: ["ortopedia", "medicina"],
        });
      }

      // Atualizar o total de lessons no unidade
      await ctx.db.patch(unit._id, {
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

    // Reset totalLessonVideos in all units
    const units = await ctx.db.query("units").collect();
    for (const unit of units) {
      await ctx.db.patch(unit._id, {
        totalLessonVideos: 0,
      });
    }

    return null;
  },
});

/**
 * Seed everything (categories -> units -> lessons -> pricing plans)
 */
export const seedAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.seedCategories, {});
    await ctx.runMutation(internal.seed.seedUnits, {});
    await ctx.runMutation(internal.seed.seedLessons, {});
    await ctx.runMutation(internal.seed.seedPricingPlans, {});
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
    await ctx.runMutation(internal.seed.clearUnits, {});
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
    await ctx.runMutation(internal.aggregate.recalculate, {});
    return null;
  },
});

/**
 * Seed pricing plans (public mutation for easy access)
 */
export const seedPricingPlansPublic = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.seedPricingPlans, {});
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

    for (const category of categories) {
      if (category.isPublished === undefined) {
        await ctx.db.patch(category._id, {
          isPublished: true,
        });
      }
    }

    return null;
  },
});

/**
 * Adiciona o campo isPublished a todos os unidades existentes
 */
export const migrateUnits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const units = await ctx.db.query("units").collect();

    for (const unit of units) {
      if (unit.isPublished === undefined) {
        await ctx.db.patch(unit._id, {
          isPublished: true,
        });
      }
    }

    return null;
  },
});

/**
 * Deleta TODAS as aulas órfãs (sem unidade pai)
 */
export const cleanOrphanLessons = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();

    for (const lesson of lessons) {
      // Verificar se o unidade pai existe
      const unit = await ctx.db.get(lesson.unitId);
      if (!unit) {
        await ctx.db.delete(lesson._id);
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
    units: v.number(),
    lessons: v.number(),
    orphanedLessons: v.number(),
  }),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const units = await ctx.db.query("units").collect();
    const lessons = await ctx.db.query("lessons").collect();

    const orphanedLessons = lessons.filter((l) => {
      const unit = units.find((m) => m._id === l.unitId);
      return !unit;
    });

    return {
      categories: categories.length,
      units: units.length,
      lessons: lessons.length,
      orphanedLessons: orphanedLessons.length,
    };
  },
});

/**
 * Recria apenas os unidades (se você já tem categorias)
 */
export const recreateUnits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const units = await ctx.db.query("units").collect();
    for (const unit of units) {
      await ctx.db.delete(unit._id);
    }
    await ctx.runMutation(internal.seed.seedUnits, {});
    return null;
  },
});

/**
 * Seed the database with sample pricing plans
 */
export const seedPricingPlans = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if pricing plans already exist
    const existingPlans = await ctx.db.query("pricingPlans").first();
    if (existingPlans) {
      return null;
    }

    // Sample pricing plans
    const pricingPlans = [
      {
        name: "Plano Básico",
        badge: "1",
        originalPrice: "R$ 1.497,00",
        price: "R$ 997,00",
        installments: "12x de R$ 83,08",
        installmentDetails: "ou R$ 897,30 à vista no PIX",
        description: "Ideal para quem está começando a preparação para o TEOT",
        features: [
          "Acesso a todas as videoaulas",
          "Material complementar em PDF",
          "Acesso por 12 meses",
          "Suporte via email",
        ],
        buttonText: "Assinar Agora",
        productId: "ortoqbank_basico_2025",
        category: "year_access" as const,
        year: 2025,
        regularPriceNum: 997.0,
        pixPriceNum: 897.3,
        accessYears: [2025],
        isActive: true,
        displayOrder: 1,
      },
      {
        name: "Plano Premium",
        badge: "2",
        originalPrice: "R$ 1.997,00",
        price: "R$ 1.497,00",
        installments: "12x de R$ 124,75",
        installmentDetails: "ou R$ 1.347,30 à vista no PIX",
        description: "Para quem quer se preparar com mais recursos e suporte",
        features: [
          "Acesso a todas as videoaulas",
          "Material complementar em PDF",
          "Acesso por 12 meses",
          "Suporte prioritário",
          "Simulados exclusivos",
          "Grupo VIP de estudos",
        ],
        buttonText: "Assinar Agora",
        productId: "ortoqbank_premium_2025",
        category: "premium_pack" as const,
        year: 2025,
        regularPriceNum: 1497.0,
        pixPriceNum: 1347.3,
        accessYears: [2025],
        isActive: true,
        displayOrder: 2,
      },
      {
        name: "Plano Completo",
        badge: "3",
        originalPrice: "R$ 2.497,00",
        price: "R$ 1.997,00",
        installments: "12x de R$ 166,42",
        installmentDetails: "ou R$ 1.797,30 à vista no PIX",
        description: "A opção mais completa para sua aprovação no TEOT",
        features: [
          "Acesso a todas as videoaulas",
          "Material complementar em PDF",
          "Acesso por 24 meses",
          "Suporte prioritário 24/7",
          "Simulados exclusivos",
          "Grupo VIP de estudos",
          "Mentoria individual mensal",
          "Revisões ao vivo",
        ],
        buttonText: "Assinar Agora",
        productId: "ortoqbank_completo_2025",
        category: "year_access" as const,
        year: 2025,
        regularPriceNum: 1997.0,
        pixPriceNum: 1797.3,
        accessYears: [2025, 2026],
        isActive: true,
        displayOrder: 3,
      },
    ];

    for (const plan of pricingPlans) {
      await ctx.db.insert("pricingPlans", plan);
    }

    return null;
  },
});

/**
 * Limpa todos os planos de preço (for testing)
 */
export const clearPricingPlans = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const plans = await ctx.db.query("pricingPlans").collect();
    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }

    return null;
  },
});

/**
 * Limpa TUDO: categorias, unidades e aulas
 */
export const clearEverything = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear lessons first
    const lessons = await ctx.db.query("lessons").collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    // Clear units
    const units = await ctx.db.query("units").collect();
    for (const unit of units) {
      await ctx.db.delete(unit._id);
    }

    // Clear categories last
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    return null;
  },
});
