"use client";

import { useState } from "react";
import { CategoryForm } from "./category-form";
import { CategoryList } from "./category-list";
import { ModuleForm } from "./module-form";
import { ModuleList } from "./module-list";
import { LessonFormV2 } from "./lesson-form-v2";
import { LessonList } from "./lesson-list";
import { UserList } from "./user-list";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/components/providers/session-provider";
import { LoaderIcon, ShieldXIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminInner() {
  const { isAdmin, isLoading } = useSession();
  const router = useRouter();
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    // Scroll to form
    const lessonForm = document.querySelector('[data-lesson-form]');
    if (lessonForm) {
      lessonForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLessonSuccess = () => {
    setEditingLesson(null);
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <ShieldXIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta área. Apenas administradores podem acessar o painel de administração.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-6 px-8 flex items-center gap-4 border-b">
        <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
        <h1 className="text-2xl font-bold">Administração</h1>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="lessons">Aulas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            {/* Categorias */}
            <TabsContent value="categories">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Gerenciar Categorias</h2>
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
                <h2 className="text-xl font-semibold mb-2">Gerenciar Módulos</h2>
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
                <p className="text-muted-foreground">
                  {editingLesson ? `Editando: ${editingLesson.title}` : "Adicione, edite ou remova aulas do sistema"}
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div data-lesson-form>
                  <LessonFormV2 
                    editingLesson={editingLesson}
                    onSuccess={handleLessonSuccess}
                    onCancelEdit={handleCancelEdit}
                  />
                </div>
                <div>
                  <LessonList onEditLesson={handleEditLesson} />
                </div>
              </div>
            </TabsContent>

            {/* Usuários */}
            <TabsContent value="users">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Gerenciar Usuários</h2>
                <p className="text-muted-foreground">
                  Visualize todos os usuários e gerencie permissões de administrador
                </p>
              </div>
              <div className="max-w-4xl">
                <UserList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

