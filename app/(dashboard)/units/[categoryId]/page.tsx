import { UnitsPage } from "../_components/units-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Id } from "@/convex/_generated/dataModel";
import { requireVideoAccess } from "@/lib/access";

interface UnitsPageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

export default async function Page({ params }: UnitsPageProps) {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  const { categoryId } = await params;
  const categoryIdTyped = categoryId as Id<"categories">;

  try {
    // Get auth token for Convex (optional - queries may work without it)
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" }).catch(() => null);

    // Carregar apenas unidades PUBLICADAS da categoria PUBLICADA
    const preloadedUnits = await preloadQuery(
      api.units.listPublishedByCategory,
      { categoryId: categoryIdTyped },
      token ? { token } : undefined,
    );

    // Buscar informações da categoria para mostrar o título
    const preloadedCategory = await preloadQuery(
      api.categories.getById,
      { id: categoryIdTyped },
      token ? { token } : undefined,
    );

    // _valueJSON is already a parsed object, not a JSON string
    const categoryData = preloadedCategory._valueJSON as unknown as {
      title: string;
    } | null;
    const categoryTitle = categoryData?.title ?? "Categoria";

    return (
      <UnitsPage
        preloadedUnits={preloadedUnits}
        categoryTitle={categoryTitle}
      />
    );
  } catch (error) {
    console.error("Error loading units:", error);
    // Fallback: return empty state
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar unidades</p>
        </div>
      </div>
    );
  }
}
