import { CategoriesInner } from "./_components/categories-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { requireVideoAccess } from "@/lib/access";

export default async function CategoriesPage() {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  // Preload only the categories list - progress data is fetched client-side
  // This simplifies the component and avoids conditional hook patterns
  const preloadedCategories = await preloadQuery(api.categories.listPublished);

  return <CategoriesInner preloadedCategories={preloadedCategories} />;
}
