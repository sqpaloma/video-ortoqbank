"use client";

import { ProgressBar } from "./progress-bar";
import { SearchBar } from "./search-bar";
import { CategoriesCard } from "./categories-card";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CategoriesInnerProps {
  preloadedCategories: Preloaded<typeof api.categories.list>;
  initialProgress: number;
}

export function CategoriesInner({ preloadedCategories, initialProgress }: CategoriesInnerProps) {
  const categories = usePreloadedQuery(preloadedCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Pesquisando por:", query);
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/modules/${categoryId}`);
  };

  // Filtrar categorias baseado na busca
  const filteredCategories = searchQuery
    ? categories.filter(
        (category) =>
          category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger no canto */}
      <SidebarTrigger className="absolute top-4 left-4 md:top-6 md:left-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light z-10" />

      <div className="px-12 sm:px-16 md:px-24 lg:px-24 xl:px-42 pb-4 pt-16 md:pt-14">
        {/* Barra de pesquisa com progresso total - alinhado com o grid */}
        <div className="mb-4 md:mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="col-span-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="hidden lg:block"></div>
          <div className="col-span-1">
            <ProgressBar/>
          </div>
        </div>

        {/* Grid de cards - 3 linhas de 3 categorias sem scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredCategories.map((category) => (
            <CategoriesCard
              key={category._id}
              title={category.title}
              description={category.description}
              imageUrl={category.iconUrl}
              onClick={() => handleCategoryClick(category._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

