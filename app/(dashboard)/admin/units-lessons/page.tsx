import { UnitsLessonsPage } from "./_components/units-lessons-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Units & Lessons Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex mutations (requireAdmin helper in backend)
 */
export default async function AdminUnitsLessonsPage() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  // Only preload categories - units and lessons will be loaded based on selected category
  const preloadedCategories = await preloadQuery(api.categories.list);

  return <UnitsLessonsPage preloadedCategories={preloadedCategories} />;
}
