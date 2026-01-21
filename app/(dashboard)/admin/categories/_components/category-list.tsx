"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useTenantMutation, useTenantReady } from "@/hooks/use-tenant-convex";
import {
  EditIcon,
  Trash2Icon,
  GripVerticalIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
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
import Image from "next/image";
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
  onTogglePublish: (
    id: Id<"categories">,
    title: string,
    currentStatus: boolean,
  ) => void;
}

function SortableCategoryItem({
  category,
  isEditOrderMode,
  onEdit,
  onDelete,
  onTogglePublish,
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
        isEditOrderMode &&
        "cursor-grab active:cursor-grabbing hover:bg-accent/50",
        !isEditOrderMode && "hover:bg-accent/50",
        isDragging && "opacity-50 ring-2 ring-primary",
      )}
    >
      {isEditOrderMode && (
        <div className="p-1">
          <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 flex items-center gap-3">
        {category.iconUrl && (
          <Image
            src={category.iconUrl}
            alt={category.title}
            width={40}
            height={40}
            className="object-contain rounded"
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
            onClick={() =>
              onTogglePublish(
                category._id,
                category.title,
                category.isPublished,
              )
            }
            title={
              category.isPublished
                ? "Despublicar categoria"
                : "Publicar categoria"
            }
          >
            {category.isPublished ? (
              <EyeIcon className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOffIcon className="h-4 w-4 text-gray-400" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(category)}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(category._id, category.title)}
          >
            <Trash2Icon className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function CategoryList({ categories }: CategoryListProps) {
  const isTenantReady = useTenantReady();
  const updateCategory = useTenantMutation(api.categories.update);
  const deleteCategory = useTenantMutation(api.categories.remove);
  const reorderCategories = useTenantMutation(api.categories.reorder);
  const togglePublishCategory = useTenantMutation(api.categories.togglePublish);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();

  const [editingCategory, setEditingCategory] =
    useState<Id<"categories"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Edit order mode state
  const [isEditOrderMode, setIsEditOrderMode] = useState(false);
  const [orderedCategories, setOrderedCategories] =
    useState<Doc<"categories">[]>(categories);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      showError(
        "A descrição deve ter pelo menos 10 caracteres",
        "Descrição inválida",
      );
      return;
    }

    if (!isTenantReady) {
      showError("Tenant não encontrado", "Erro de configuração");
      return;
    }

    setIsSubmitting(true);

    try {
      const iconUrlToSave =
        editIconUrl && editIconUrl.trim() !== ""
          ? editIconUrl.trim()
          : undefined;

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
        "Erro ao atualizar categoria",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"categories">, title: string) => {
    const message =
      `ATENÇÃO: Esta ação irá deletar permanentemente:\n\n` +
      `• A categoria "${title}"\n` +
      `• TODOS os módulos desta categoria\n` +
      `• TODAS as aulas destes módulos\n\n` +
      `Esta ação não pode ser desfeita!\n\n` +
      `Tem certeza que deseja continuar?`;

    showConfirm(
      message,
      async () => {
        if (!isTenantReady) {
          showError("Tenant não encontrado", "Erro de configuração");
          return;
        }
        try {
          await deleteCategory({ id });
          toast({
            title: "Sucesso",
            description: "Categoria e todo seu conteúdo foram deletados!",
          });
        } catch (error) {
          showError(
            error instanceof Error
              ? error.message
              : "Erro ao deletar categoria",
            "Erro ao deletar categoria",
          );
        }
      },
      "DELETAR CATEGORIA E TODO SEU CONTEÚDO",
    );
  };

  const handleTogglePublish = async (
    id: Id<"categories">,
    title: string,
    currentStatus: boolean,
  ) => {
    const action = currentStatus ? "despublicar" : "publicar";
    const message = currentStatus
      ? `Despublicar a categoria "${title}" irá:\n\n` +
      `• Despublicar TODOS os módulos desta categoria\n` +
      `• Despublicar TODAS as aulas destes módulos\n\n` +
      `Os alunos não terão mais acesso a este conteúdo.\n\n` +
      `Deseja continuar?`
      : `Publicar a categoria "${title}" irá:\n\n` +
      `• Publicar TODOS os módulos desta categoria\n` +
      `• Publicar TODAS as aulas destes módulos\n\n` +
      `Os alunos terão acesso a todo este conteúdo.\n\n` +
      `Deseja continuar?`;

    showConfirm(
      message,
      async () => {
        if (!isTenantReady) {
          showError("Tenant não encontrado", "Erro de configuração");
          return;
        }
        try {
          const newStatus = await togglePublishCategory({ id });
          toast({
            title: "Sucesso",
            description: `Categoria "${title}" ${newStatus ? "publicada" : "despublicada"} com sucesso!`,
          });
        } catch (error) {
          showError(
            error instanceof Error
              ? error.message
              : `Erro ao ${action} categoria`,
            `Erro ao ${action} categoria`,
          );
        }
      },
      `${action === "publicar" ? "📢" : "🔒"} ${action.toUpperCase()} CATEGORIA`,
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
    if (!isTenantReady) {
      showError("Tenant não encontrado", "Erro de configuração");
      return;
    }

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
        "Erro ao salvar ordem",
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
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias Cadastradas</CardTitle>
            </div>
            <div className="flex gap-2">
              {!isEditOrderMode ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditOrderMode(true)}
                  disabled={categories.length === 0}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Editar Ordem
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isSavingOrder}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveOrder} disabled={isSavingOrder}>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isSavingOrder ? "Salvando..." : "Salvar Ordem"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria cadastrada ainda.
              </p>
            ) : isEditOrderMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedCategories.map((cat) => cat._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedCategories.map((category) => (
                    <SortableCategoryItem
                      key={category._id}
                      category={category}
                      isEditOrderMode={isEditOrderMode}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePublish={handleTogglePublish}
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
                  onTogglePublish={handleTogglePublish}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog
        open={editingCategory !== null}
        onOpenChange={() => setEditingCategory(null)}
      >
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
              <label className="text-sm font-medium">
                Ícone da Categoria (opcional)
              </label>
              <ImageUpload
                value={editIconUrl}
                onChange={setEditIconUrl}
                disabled={isSubmitting}
                folder="/categories"
                id="category-edit-image-upload"
                onUploadStateChange={setIsImageUploading}
              />
              {isImageUploading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aguarde o upload da imagem terminar antes de salvar...
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isSubmitting || isImageUploading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isImageUploading}
                className="flex-1"
              >
                {isImageUploading
                  ? "Enviando imagem..."
                  : isSubmitting
                    ? "Salvando..."
                    : "Salvar"}
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
