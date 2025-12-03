"use client";

import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";
import { ModuleForm } from "./module-form";
import { ModuleList } from "./module-list";
import { LessonForm } from "././lesson-form";
import { LessonList } from "./lesson-list";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminInner() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-6 px-8 flex items-center gap-3 border-b">
        <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
        <h1 className="text-2xl font-bold">Administração</h1>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="lessons">Aulas</TabsTrigger>
            </TabsList>

            {/* Categorias */}
            <TabsContent value="categories">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Gerenciar Categorias
                </h2>
                <p className="text-muted-foreground">
                  Adicione, edite ou remova categorias do sistema
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <CategoryForm />
                </div>
                <div>
                  <CategoryList />
                </div>
              </div>
            </TabsContent>

            {/* Módulos */}
            <TabsContent value="modules">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Gerenciar Módulos
                </h2>
                <p className="text-muted-foreground">
                  Adicione, edite ou remova módulos do sistema
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ModuleForm />
                </div>
                <div>
                  <ModuleList />
                </div>
              </div>
            </TabsContent>

            {/* Aulas */}
            <TabsContent value="lessons">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Gerenciar Aulas</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div data-lesson-form>
                  <LessonForm />
                </div>
                <div>
                  <LessonList />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
