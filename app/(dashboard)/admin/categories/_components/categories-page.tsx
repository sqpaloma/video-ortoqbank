"use client";

import { CategoryForm } from "../../_components/category-form";
import { CategoryList } from "../../_components/category-list";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CategoriesPageProps {
  preloadedCategories: Preloaded<typeof api.categories.list>;
}

export function CategoriesPage({ preloadedCategories }: CategoriesPageProps) {
  const categories = usePreloadedQuery(preloadedCategories);
  const { state } = useSidebar();

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b ">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Categorias
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CategoryForm />
            </div>
            <div>
              <CategoryList categories={categories} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
