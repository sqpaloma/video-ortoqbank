"use client";

import { ProgressBar } from "./progress-bar";
import { SearchBar } from "./search-bar";
import { CategoriesCard } from "./categories-card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface CategoriesPageProps {
  preloadedCategories: Preloaded<typeof api.categories.listPublished>;
}

export function CategoriesPage({ preloadedCategories }: CategoriesPageProps) {
  const categories = usePreloadedQuery(preloadedCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { state } = useSidebar();
  const { user } = useCurrentUser();

  // Fetch progress data on client side - simpler than conditional preloading
  // These queries only run when user is authenticated
  const contentStats = useQuery(api.aggregate.get, user ? {} : "skip");

  const completedCountResult = useQuery(
    api.progress.queries.getCompletedPublishedLessonsCount,
    user?.clerkUserId ? { userId: user.clerkUserId } : "skip",
  );

  // Buscar categorias usando a query avançada
  const searchResults = useQuery(
    api.search.searchCategories,
    searchQuery ? { query: searchQuery } : "skip",
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Pesquisando por:", query);
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/units/${categoryId}`);
  };

  // Usar resultados da busca avançada se houver query, senão mostrar todas
  const filteredCategories =
    searchQuery && searchResults ? searchResults : categories;

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      <div className="px-12 sm:px-16 md:px-24 lg:px-24 xl:px-42 pb-24 md:pb-3 pt-8 md:pt-8">
        {/* Barra de pesquisa com progresso total - alinhado com o grid */}
        <div className="mb-4 md:mb-8 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="col-span-1 flex items-center gap-2">
            <SearchBar onSearch={handleSearch} />
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                }}
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
              completedLessons={completedCountResult ?? 0}
            />
          </div>
        </div>

        {/* Grid de cards - 3 linhas de 3 categorias sem scroll */}
        {searchQuery && searchResults === undefined ? (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Pesquisando categorias"
          >
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-brand mx-auto mb-4"
                aria-hidden="true"
              ></div>
              <p className="text-muted-foreground">Pesquisando...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <CategoriesCard
                  key={category._id}
                  title={category.title}
                  description={category.description}
                  imageUrl={category.iconUrl}
                  onClick={() => handleCategoryClick(category._id)}
                />
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center py-20">
                <p className="text-muted-foreground text-center">
                  {searchQuery
                    ? "Nenhuma categoria encontrada com este filtro"
                    : "Nenhuma categoria encontrada"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
