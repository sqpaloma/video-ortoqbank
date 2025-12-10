"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Edit, Trash2, GripVertical, Check, X, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface ModuleListProps {
  modules: Doc<"modules">[];
  categories: Doc<"categories">[];
}

interface SortableModuleItemProps {
  module: Doc<"modules">;
  isEditOrderMode: boolean;
  onEdit: (module: Doc<"modules">) => void;
  onDelete: (id: Id<"modules">, title: string) => void;
  onTogglePublish: (id: Id<"modules">, title: string, currentStatus: boolean) => void;
  getCategoryName: (categoryId: Id<"categories">) => string;
}

function SortableModuleItem({ 
  module, 
  isEditOrderMode, 
  onEdit, 
  onDelete,
  onTogglePublish,
  getCategoryName 
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditOrderMode ? { ...attributes, ...listeners } : {})}
      className={cn(
        "flex items-center gap-2 p-2 border rounded-md transition-colors",
        isEditOrderMode && "cursor-grab active:cursor-grabbing hover:bg-accent/50",
        !isEditOrderMode && "hover:bg-accent/50",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      {isEditOrderMode && (
        <div className="p-0.5">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate">{module.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {module.description}
        </p>
        <div className="flex gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Categoria: {getCategoryName(module.categoryId)}
          </span>
          <span className="text-xs text-muted-foreground">
            {module.totalLessonVideos} {module.totalLessonVideos === 1 ? "aula" : "aulas"}
          </span>
        </div>
      </div>
      {!isEditOrderMode && (
        <div className="flex gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onTogglePublish(module._id, module.title, module.isPublished)}
            title={module.isPublished ? "Despublicar módulo" : "Publicar módulo"}
          >
            {module.isPublished ? (
              <Eye className="h-3 w-3 text-green-600" />
            ) : (
              <EyeOff className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(module)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(module._id, module.title)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ModuleList({ modules, categories }: ModuleListProps) {
  const updateModule = useMutation(api.modules.update);
  const deleteModule = useMutation(api.modules.remove);
  const reorderModules = useMutation(api.modules.reorder);
  const togglePublishModule = useMutation(api.modules.togglePublish);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();

  const [editingModule, setEditingModule] = useState<Id<"modules"> | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrderIndex, setEditOrderIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit order mode state
  const [isEditOrderMode, setIsEditOrderMode] = useState(false);
   const [orderedModulesByCategory, setOrderedModulesByCategory] = useState<Record<string, Doc<"modules">[]>>({});
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group modules by category and update when modules or categories change
  useEffect(() => {
    const grouped: Record<string, Doc<"modules">[]> = {};
    
    // Sort categories by position
    const sortedCategories = [...categories].sort((a, b) => a.position - b.position);
    
    // Initialize with empty arrays for all categories
    sortedCategories.forEach(cat => {
      grouped[cat._id] = [];
    });
    
    // Group modules by category and sort by order_index
    modules.forEach(module => {
      if (grouped[module.categoryId]) {
        grouped[module.categoryId].push(module);
      }
    });
    
    // Sort modules within each category by order_index
    Object.keys(grouped).forEach(categoryId => {
      grouped[categoryId].sort((a, b) => a.order_index - b.order_index);
    });
    
    setOrderedModulesByCategory(grouped);
  }, [modules, categories]);

  const handleEdit = (module: {
    _id: Id<"modules">;
    categoryId: Id<"categories">;
    title: string;
    slug: string;
    description: string;
    order_index: number;
    totalLessonVideos: number;
  }) => {
    setEditingModule(module._id);
    setEditCategoryId(module.categoryId);
    setEditTitle(module.title);
    setEditDescription(module.description);
    setEditOrderIndex(module.order_index);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingModule || !editCategoryId || !editTitle || !editDescription) {
      showError("Preencha todos os campos obrigatórios", "Campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateModule({
        id: editingModule,
        categoryId: editCategoryId as any,
        title: editTitle,
        description: editDescription,
        order_index: editOrderIndex,
      });

      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso!",
      });

      setEditingModule(null);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar módulo",
        "Erro ao atualizar módulo"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"modules">, title: string) => {
    const message = `ATENÇÃO: Esta ação irá deletar permanentemente:\n\n` +
      `• O módulo "${title}"\n` +
      `• TODAS as aulas deste módulo\n\n` +
      `Esta ação não pode ser desfeita!\n\n` +
      `Tem certeza que deseja continuar?`;

    showConfirm(
      message,
      async () => {
        try {
          await deleteModule({ id });
          toast({
            title: "Sucesso",
            description: "Módulo e suas aulas foram deletados!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao deletar módulo",
            "Erro ao deletar módulo"
          );
        }
      },
      "DELETAR MÓDULO E SUAS AULAS"
    );
  };

  const handleTogglePublish = async (id: Id<"modules">, title: string, currentStatus: boolean) => {
    const action = currentStatus ? "despublicar" : "publicar";
    const message = currentStatus
      ? `Despublicar o módulo "${title}" irá:\n\n` +
        `• Despublicar TODAS as aulas deste módulo\n` +
        `Os alunos não terão mais acesso a este conteúdo.\n\n` +
        `Deseja continuar?`
      : `Publicar o módulo "${title}" irá:\n\n` +
        `• Publicar TODAS as aulas deste módulo\n` +
        `Os alunos terão acesso a todo este conteúdo.\n\n` +
        `Deseja continuar?`;

    showConfirm(
      message,
      async () => {
        try {
          const newStatus = await togglePublishModule({ id });
          toast({
            title: "Sucesso",
            description: `Módulo "${title}" ${newStatus ? "publicado" : "despublicado"} com sucesso!`,
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : `Erro ao ${action} módulo`,
            `Erro ao ${action} módulo`
          );
        }
      },
      `${action === "publicar" ? "📢" : "🔒"} ${action.toUpperCase()} MÓDULO`
    );
  };

  const handleDragEnd = (categoryId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedModulesByCategory((prev) => {
        const categoryModules = prev[categoryId] || [];
        const oldIndex = categoryModules.findIndex((item) => item._id === active.id);
        const newIndex = categoryModules.findIndex((item) => item._id === over.id);

        return {
          ...prev,
          [categoryId]: arrayMove(categoryModules, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Create updates array with new order_index for all modules
      const updates: { id: Id<"modules">; order_index: number }[] = [];
      
      Object.entries(orderedModulesByCategory).forEach(([categoryId, categoryModules]) => {
        categoryModules.forEach((mod, index) => {
          updates.push({
            id: mod._id,
            order_index: index,
          });
        });
      });

      await reorderModules({ updates });

      toast({
        title: "Sucesso",
        description: "Ordem dos módulos atualizada!",
      });

      setIsEditOrderMode(false);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao salvar ordem",
        "Erro ao salvar ordem"
      );
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    // Rebuild the grouped structure from original modules
    const grouped: Record<string, Doc<"modules">[]> = {};
    const sortedCategories = [...categories].sort((a, b) => a.position - b.position);
    
    sortedCategories.forEach(cat => {
      grouped[cat._id] = [];
    });
    
    modules.forEach(module => {
      if (grouped[module.categoryId]) {
        grouped[module.categoryId].push(module);
      }
    });
    
    Object.keys(grouped).forEach(categoryId => {
      grouped[categoryId].sort((a, b) => a.order_index - b.order_index);
    });
    
    setOrderedModulesByCategory(grouped);
    setIsEditOrderMode(false);
  };

  const getCategoryName = (categoryId: Id<"categories">) => {
    const category = categories.find(c => c._id === categoryId);
    return category?.title || "Categoria desconhecida";
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
          <CardTitle>Módulos Cadastrados</CardTitle>
             
            </div>
            <div className="flex gap-2">
              {!isEditOrderMode ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditOrderMode(true)}
                  disabled={modules.length === 0}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Ordem
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isSavingOrder}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSavingOrder ? "Salvando..." : "Salvar Ordem"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 max-h-[330px] overflow-auto pr-2">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado ainda.</p>
            ) : (
              categories
                .sort((a, b) => a.position - b.position)
                .map((category) => {
                  const categoryModules = orderedModulesByCategory[category._id] || [];
                  
                  return (
                    <div key={category._id} className="space-y-1.5">
                      {/* Category Header */}
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {category.title}
                        </h3>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      
                      {/* Modules for this category */}
                      {categoryModules.length === 0 ? (
                        <p className="text-xs text-muted-foreground ml-3 italic">
                          Nenhum módulo nesta categoria
                        </p>
                      ) : isEditOrderMode ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd(category._id)}
                        >
                          <SortableContext
                            items={categoryModules.map(mod => mod._id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1.5">
                              {categoryModules.map((module) => (
                                <SortableModuleItem
                                  key={module._id}
                                  module={module}
                                  isEditOrderMode={isEditOrderMode}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  onTogglePublish={handleTogglePublish}
                                  getCategoryName={getCategoryName}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="space-y-1.5">
                          {categoryModules.map((module) => (
                            <SortableModuleItem
                  key={module._id}
                              module={module}
                              isEditOrderMode={isEditOrderMode}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onTogglePublish={handleTogglePublish}
                              getCategoryName={getCategoryName}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editingModule !== null} onOpenChange={() => setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Módulo</DialogTitle>
            <DialogDescription>
              Atualize as informações do módulo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Categoria *</label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingModule(null)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />

      <ConfirmModal
        open={confirm.isOpen}
        onOpenChange={hideConfirm}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
      />
    </>
  );
}

