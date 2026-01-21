"use client";

import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useTenantQuery, useTenantReady } from "@/hooks/use-tenant-convex";

export function CategoriesPage() {
  const isTenantReady = useTenantReady();
  const categories = useTenantQuery(api.categories.list, {});
  const { state } = useSidebar();

  if (!isTenantReady || categories === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="border-brand-blue mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed"
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
      <div className="p-12">
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
