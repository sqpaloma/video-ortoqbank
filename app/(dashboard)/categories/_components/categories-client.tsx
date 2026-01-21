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

// Helper component that uses preloaded content stats
function PreloadedContentStatsProvider({
  preloaded,
  children,
}: {
  preloaded: Preloaded<typeof api.aggregate.getByTenant>;
  children: (data: { totalLessons: number; totalUnits: number; totalCategories: number; updatedAt: number }) => React.ReactNode;
}) {
  const data = usePreloadedQuery(preloaded);
  return <>{children(data)}</>;
}

// Helper component that uses preloaded completed count
function PreloadedCompletedCountProvider({
  preloaded,
  children,
}: {
  preloaded: Preloaded<typeof api.progress.queries.getCompletedPublishedLessonsCount>;
  children: (count: number) => React.ReactNode;
}) {
  const count = usePreloadedQuery(preloaded);
  return <>{children(count)}</>;
}

// Component for fetching content stats client-side
function FetchedContentStatsProvider({
  children,
}: {
  children: (data: { totalLessons: number; totalUnits: number; totalCategories: number; updatedAt: number } | undefined) => React.ReactNode;
}) {
  const data = useTenantQuery(api.aggregate.getByTenant, {});
  return <>{children(data)}</>;
}

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
            {/* Render progress bar with preloaded or fetched data */}
            {preloadedContentStats ? (
              <PreloadedContentStatsProvider preloaded={preloadedContentStats}>
                {(contentStats) => (
                  preloadedCompletedCount ? (
                    <PreloadedCompletedCountProvider preloaded={preloadedCompletedCount}>
                      {(completedCount) => (
                        <ProgressBar
                          totalLessons={contentStats.totalLessons}
                          completedLessons={completedCount}
                        />
                      )}
                    </PreloadedCompletedCountProvider>
                  ) : (
                    <ProgressBar
                      totalLessons={contentStats.totalLessons}
                      completedLessons={0}
                    />
                  )
                )}
              </PreloadedContentStatsProvider>
            ) : (
              <FetchedContentStatsProvider>
                {(contentStats) => (
                  <ProgressBar
                    totalLessons={contentStats?.totalLessons ?? 0}
                    completedLessons={0}
                  />
                )}
              </FetchedContentStatsProvider>
            )}
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

