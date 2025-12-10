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
import { Edit, Trash2, GripVertical, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/components/ui/image-upload";
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

interface CategoryListProps {
  categories: Doc<"categories">[];
}

interface SortableCategoryItemProps {
  category: Doc<"categories">;
  isEditOrderMode: boolean;
  onEdit: (category: Doc<"categories">) => void;
  onDelete: (id: Id<"categories">, title: string) => void;
}

function SortableCategoryItem({ 
  category, 
  isEditOrderMode, 
  onEdit, 
  onDelete 
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id });

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
        "flex items-center gap-2 p-3 border rounded-lg transition-colors",
        isEditOrderMode && "cursor-grab active:cursor-grabbing hover:bg-accent/50",
        !isEditOrderMode && "hover:bg-accent/50",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      {isEditOrderMode && (
        <div className="p-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 flex items-center gap-3">
        {category.iconUrl && (
          <img 
            src={category.iconUrl} 
            alt={category.title}
            className="w-10 h-10 object-contain rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{category.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {category.description}
          </p>
        </div>
      </div>
      {!isEditOrderMode && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(category._id, category.title)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function CategoryList({ categories }: CategoryListProps) {
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);
  const reorderCategories = useMutation(api.categories.reorder);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();

  const [editingCategory, setEditingCategory] = useState<Id<"categories"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit order mode state
  const [isEditOrderMode, setIsEditOrderMode] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState<Doc<"categories">[]>(categories);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update ordered categories when categories prop changes
  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

  const handleEdit = (category: {
    _id: Id<"categories">;
    title: string;
    slug: string;
    description: string;
    position: number;
    iconUrl?: string;
  }) => {
    setEditingCategory(category._id);
    setEditTitle(category.title);
    setEditDescription(category.description);
    // Ensure iconUrl is set correctly, even if it's undefined
    setEditIconUrl(category.iconUrl ?? "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory || !editTitle || !editDescription) {
      showError("Preencha todos os campos obrigatórios", "Campos obrigatórios");
      return;
    }

    if (editTitle.trim().length < 3) {
      showError("O título deve ter pelo menos 3 caracteres", "Título inválido");
      return;
    }

    if (editDescription.trim().length < 10) {
      showError("A descrição deve ter pelo menos 10 caracteres", "Descrição inválida");
      return;
    }

    setIsSubmitting(true);

    try {
      const iconUrlToSave = editIconUrl && editIconUrl.trim() !== "" ? editIconUrl.trim() : undefined;

      await updateCategory({
        id: editingCategory,
        title: editTitle,
        description: editDescription,
        iconUrl: iconUrlToSave,
      });

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });

      setEditingCategory(null);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar categoria",
        "Erro ao atualizar categoria"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: Id<"categories">, title: string) => {
    showConfirm(
      `Tem certeza que deseja deletar a categoria "${title}"?`,
      async () => {
        try {
          await deleteCategory({ id });
          toast({
            title: "Sucesso",
            description: "Categoria deletada com sucesso!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao deletar categoria",
            "Erro ao deletar categoria"
          );
        }
      },
      "Deletar categoria"
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Create updates array with new positions
      const updates = orderedCategories.map((cat, index) => ({
        id: cat._id,
        position: index + 1,
      }));

      await reorderCategories({ updates });

      toast({
        title: "Sucesso",
        description: "Ordem das categorias atualizada!",
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
    setOrderedCategories(categories);
    setIsEditOrderMode(false);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias Cadastradas</CardTitle>
              <CardDescription>
                {categories.length} {categories.length === 1 ? "categoria" : "categorias"} no sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditOrderMode ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditOrderMode(true)}
                  disabled={categories.length === 0}
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
          <div className="space-y-2 max-h-[390px] overflow-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
            ) : isEditOrderMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedCategories.map(cat => cat._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedCategories.map((category) => (
                    <SortableCategoryItem
                      key={category._id}
                      category={category}
                      isEditOrderMode={isEditOrderMode}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              orderedCategories.map((category) => (
                <SortableCategoryItem
                  key={category._id}
                  category={category}
                  isEditOrderMode={isEditOrderMode}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editingCategory !== null} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ex: Ciências Básicas em Ortopedia"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Breve descrição da categoria"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ícone da Categoria (opcional)</label>
              <ImageUpload
                value={editIconUrl}
                onChange={setEditIconUrl}
                disabled={isSubmitting}
                folder="/categories"
                id="category-edit-image-upload"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
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

