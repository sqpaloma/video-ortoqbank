import { ModulesInner } from "../_components/modules-inner";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Id } from "@/convex/_generated/dataModel";

interface ModulesPageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { categoryId } = await params;
  const categoryIdTyped = categoryId as Id<"categories">;

  try {
    // Get auth token for Convex (optional - queries may work without it)
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" }).catch(() => null);

    // Carregar apenas módulos PUBLICADOS da categoria PUBLICADA
    const preloadedModules = await preloadQuery(
      api.modules.listPublishedByCategory,
      { categoryId: categoryIdTyped },
      token ? { token } : undefined
    );

    // Buscar informações da categoria para mostrar o título
    const preloadedCategory = await preloadQuery(
      api.categories.getById,
      { id: categoryIdTyped },
      token ? { token } : undefined
    );

    // _valueJSON is already a parsed object, not a JSON string
    const categoryData = (preloadedCategory._valueJSON as unknown) as {
      title: string;
    } | null;
    const categoryTitle = categoryData?.title ?? "Categoria";

    return (
      <ModulesInner
        preloadedModules={preloadedModules}
        categoryTitle={categoryTitle}
      />
    );
  } catch (error) {
    console.error("Error loading modules:", error);
    // Fallback: return empty state
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar módulos</p>
        </div>
      </div>
    );
  }
}

