import { UnitsLessonsPage } from "./_components/units-lessons-page";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

export default async function AdminUnitsLessonsPage() {
  // Only preload categories - units and lessons will be loaded based on selected category
  const preloadedCategories = await preloadQuery(api.categories.list);

  return <UnitsLessonsPage preloadedCategories={preloadedCategories} />;
}
