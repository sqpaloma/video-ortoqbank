import { CategoriesInner } from "./_components/categories-inner";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

export default async function CategoriesPage() {
  // Carregar apenas categorias PUBLICADAS do Convex
  const preloadedCategories = await preloadQuery(api.categories.listPublished);

  const userProgress = 34;

  return <CategoriesInner preloadedCategories={preloadedCategories} initialProgress={userProgress} />;
}

