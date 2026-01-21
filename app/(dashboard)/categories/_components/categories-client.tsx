"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useTenantQuery } from "@/hooks/use-tenant-convex";
import { SearchBar } from "./search-bar";
import { ProgressBar } from "./progress-bar";
import { CategoriesGrid } from "./categories-grid";
import { Button } from "@/components/ui/button";

export function CategoriesClientPage({
  preloadedCategories,
  preloadedContentStats,
  preloadedCompletedCount,
}: {
  preloadedCategories: Preloaded<typeof api.categories.listPublished>;
  preloadedContentStats: Preloaded<typeof api.aggregate.getByTenant> | null;
  preloadedCompletedCount: Preloaded<
    typeof api.progress.queries.getCompletedPublishedLessonsCount
  > | null;
}) {
  // Use preloaded queries for reactivity
  const categories = usePreloadedQuery(preloadedCategories);

  // Use regular queries for optional preloaded data to avoid conditional hook calls
  const contentStats = useTenantQuery(
    api.aggregate.getByTenant,
    preloadedContentStats ? "skip" : {}
  );
  const completedCount = useTenantQuery(
    api.progress.queries.getCompletedPublishedLessonsCount,
    preloadedCompletedCount ? "skip" : {}
  );

  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { state } = useSidebar();

  // Search query (still client-side reactive)
  const searchResults = useTenantQuery(
    api.search.searchCategories,
    searchQuery ? { query: searchQuery } : "skip",
  );

  const filteredCategories =
    searchQuery && searchResults ? searchResults : categories || [];

  // Handlers
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/units/${categoryId}`);
  };

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand hover:bg-blue-brand transition-[left] duration-200 ease-linear z-10 ${state === "collapsed"
          ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
          : "left-[calc(var(--sidebar-width)+0.25rem)]"
          }`}
      />

      <div className="px-12 sm:px-16 md:px-24 lg:px-24 xl:px-42 pb-24 md:pb-3 pt-8 md:pt-8">
        {/* Search and Progress Bar */}
        <div className="mb-4 md:mb-8 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="col-span-1 flex items-center gap-2">
            <SearchBar onSearch={handleSearch} />
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="text-blue-brand hover:text-blue-brand-dark hover:bg-transparent px-3 whitespace-nowrap shrink-0"
              >
                Limpar filtro
              </Button>
            )}
          </div>
          <div className="hidden lg:block"></div>
          <div className="col-span-1">
            <ProgressBar
              totalLessons={contentStats?.totalLessons ?? 0}
              completedLessons={completedCount ?? 0}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <CategoriesGrid
          categories={filteredCategories}
          isSearching={!!searchQuery && searchResults === undefined}
          searchQuery={searchQuery}
          onCategoryClick={handleCategoryClick}
        />
      </div>
    </div>
  );
}

