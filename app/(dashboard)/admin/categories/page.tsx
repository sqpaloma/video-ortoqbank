import { CategoriesPage } from "./_components/categories-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Categories Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex mutations (requireAdmin helper in backend)
 */
export default async function AdminCategoriesPage() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  // Preload categories data on the server
  const preloadedCategories = await preloadQuery(api.categories.list);

  return <CategoriesPage preloadedCategories={preloadedCategories} />;
}
