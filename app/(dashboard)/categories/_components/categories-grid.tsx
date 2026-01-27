"use client";

import { CategoriesCard } from "./categories-card";

interface Category {
  _id: string;
  title: string;
  description: string;
  iconUrl?: string;
}

export function CategoriesGrid({
  categories,
  isSearching,
  searchQuery,
  onCategoryClick,
}: {
  categories: Category[];
  isSearching: boolean;
  searchQuery: string;
  onCategoryClick: (id: string) => void;
}) {
  if (isSearching) {
    return (
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
          />
          <p className="text-muted-foreground">Pesquisando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {categories.length > 0 ? (
        categories.map((category) => (
          <CategoriesCard
            key={category._id}
            title={category.title}
            description={category.description}
            imageUrl={category.iconUrl}
            onClick={() => onCategoryClick(category._id)}
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
  );
}
