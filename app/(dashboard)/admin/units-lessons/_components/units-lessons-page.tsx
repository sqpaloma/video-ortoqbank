"use client";

import { useState, useEffect, useMemo } from "react";
import { UnitForm } from "../../_components/unit-form";
import { LessonForm } from "../../_components/lesson-form";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Preloaded, usePreloadedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, PencilIcon, GripVerticalIcon, UploadIcon, Trash2Icon, CheckCircleIcon, LoaderIcon, XCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface UnitsLessonsPageProps {
  preloadedCategories: Preloaded<typeof api.categories.list>;
}

type EditMode =
  | { type: 'none' }
  | { type: 'unit'; unit: Doc<"units"> }
  | { type: 'lesson'; lesson: Doc<"lessons"> };

export function UnitsLessonsPage({
  preloadedCategories,
}: UnitsLessonsPageProps) {
  const categories = usePreloadedQuery(preloadedCategories);
  const { state } = useSidebar();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();

  // State for selected category - starts as null
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categories"> | null>(null);

  // State for expanded units in left sidebar
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // State for modals
  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);

  // State for editing
  const [editMode, setEditMode] = useState<EditMode>({ type: 'none' });

  // State for drag and drop reordering
  const [draggedLessons, setDraggedLessons] = useState<Record<string, Doc<"lessons">[]> | null>(null);
  const [draggedUnits, setDraggedUnits] = useState<Doc<"units">[] | null>(null);
  const [isDraggingLesson, setIsDraggingLesson] = useState(false);
  const [isDraggingUnit, setIsDraggingUnit] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Query units and lessons based on selected category
  const units = useQuery(
    api.units.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip"
  );

  const lessons = useQuery(
    api.lessons.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip"
  );

  // Mutations
  const updateUnit = useMutation(api.units.update);
  const updateLesson = useMutation(api.lessons.update);
  const reorderLessons = useMutation(api.lessons.reorder);
  const reorderUnits = useMutation(api.units.reorder);
  const togglePublishUnit = useMutation(api.units.togglePublish);
  const togglePublishLesson = useMutation(api.lessons.togglePublish);

  // Compute sorted units and lessons from server data
  const localUnits = useMemo(() => {
    const sorted = draggedUnits || (units ? [...units].sort((a, b) => a.order_index - b.order_index) : []);
    return sorted;
  }, [units, draggedUnits]);

  const localLessons = useMemo(() => {
    if (draggedLessons) return draggedLessons;

    if (!lessons) return {};

    const grouped: Record<string, Doc<"lessons">[]> = {};
    lessons.forEach((lesson) => {
      if (!grouped[lesson.unitId]) {
        grouped[lesson.unitId] = [];
      }
      grouped[lesson.unitId].push(lesson);
    });

    // Sort lessons within each unit by order_index
    Object.keys(grouped).forEach((unitId) => {
      grouped[unitId].sort((a, b) => a.order_index - b.order_index);
    });

    return grouped;
  }, [lessons, draggedLessons]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const getLessonsForUnit = (unitId: Id<"units">) => {
    return localLessons[unitId] || [];
  };

  const handleDragEndUnits = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDraggingUnit(false);

    if (over && active.id !== over.id) {
      const oldIndex = localUnits.findIndex((item) => item._id === active.id);
      const newIndex = localUnits.findIndex((item) => item._id === over.id);

      const reorderedUnits = arrayMove(localUnits, oldIndex, newIndex);

      // Update local state immediately for smooth UI
      setDraggedUnits(reorderedUnits);

      // Save to database
      try {
        const updates = reorderedUnits.map((unit, index) => ({
          id: unit._id,
          order_index: index,
        }));

        await reorderUnits({ updates });

        toast({
          title: "Sucesso",
          description: "Ordem das unidades atualizada!",
        });

        // Clear dragged state after successful save
        setDraggedUnits(null);
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "Erro ao reordenar unidades",
          "Erro ao reordenar unidades"
        );
        // Revert on error
        setDraggedUnits(null);
      }
    }
  };

  const handleDragEndLessons = (unitId: string) => async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDraggingLesson(false);

    if (over && active.id !== over.id) {
      const unitLessons = localLessons[unitId] || [];
      const oldIndex = unitLessons.findIndex((item) => item._id === active.id);
      const newIndex = unitLessons.findIndex((item) => item._id === over.id);

      const reorderedLessons = arrayMove(unitLessons, oldIndex, newIndex);

      // Update local state immediately for smooth UI
      setDraggedLessons((prev) => ({
        ...(prev || localLessons),
        [unitId]: reorderedLessons,
      }));

      // Save to database
      try {
        const updates = reorderedLessons.map((lesson, index) => ({
          id: lesson._id,
          order_index: index,
        }));

        await reorderLessons({ updates });

        toast({
          title: "Sucesso",
          description: "Ordem das aulas atualizada!",
        });

        // Clear dragged state after successful save
        setDraggedLessons(null);
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "Erro ao reordenar aulas",
          "Erro ao reordenar aulas"
        );
        // Revert on error
        setDraggedLessons(null);
      }
    }
  };

  const selectedCategory = categories.find((cat) => cat._id === selectedCategoryId);

  const handleEditUnit = (unit: Doc<"units">) => {
    setEditMode({ type: 'unit', unit });
  };

  const handleEditLesson = (lesson: Doc<"lessons">) => {
    setEditMode({ type: 'lesson', lesson });
  };

  const handleTogglePublishUnit = async (unitId: Id<"units">) => {
    try {
      await togglePublishUnit({ id: unitId });
      toast({
        title: "Sucesso",
        description: "Status de publicação da unidade atualizado!",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar status",
        "Erro ao atualizar status"
      );
    }
  };

  const handleTogglePublishLesson = async (lessonId: Id<"lessons">) => {
    try {
      await togglePublishLesson({ id: lessonId });
      toast({
        title: "Sucesso",
        description: "Status de publicação da aula atualizado!",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar status",
        "Erro ao atualizar status"
      );
    }
  };

  const handleSaveUnit = async (data: { categoryId: Id<"categories">; title: string; description: string }) => {
    if (editMode.type !== 'unit') return;

    try {
      await updateUnit({
        id: editMode.unit._id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        order_index: editMode.unit.order_index,
      });

      toast({
        title: "Sucesso",
        description: "Unidade atualizada com sucesso!",
      });

      setEditMode({ type: 'none' });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar unidade",
        "Erro ao atualizar unidade"
      );
    }
  };

  const handleSaveLesson = async (data: {
    unitId: Id<"units">;
    title: string;
    description: string;
    lessonNumber: number;
    tags?: string[];
  }) => {
    if (editMode.type !== 'lesson') return;

    try {
      await updateLesson({
        id: editMode.lesson._id,
        unitId: data.unitId,
        title: data.title,
        description: data.description,
        lessonNumber: data.lessonNumber,
        durationSeconds: editMode.lesson.durationSeconds,
        order_index: editMode.lesson.order_index,
        isPublished: editMode.lesson.isPublished,
        tags: data.tags,
        videoId: editMode.lesson.videoId,
      });

      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!",
      });

      setEditMode({ type: 'none' });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar aula",
        "Erro ao atualizar aula"
      );
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed"
          ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
          : "left-[calc(var(--sidebar-width)+0.25rem)]"
          }`}
      />

      {/* Header */}
      <div className="py-6 px-8 flex items-center gap-3 border-b">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Gerenciar Unidades e Aulas</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma categoria para gerenciar seus unidades e aulas
          </p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="py-4 px-8 border-b bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">
              Categoria:
            </label>
            <Select
              value={selectedCategoryId || ""}
              onValueChange={(value) => setSelectedCategoryId(value as Id<"categories">)}
            >
              <SelectTrigger className="w-full max-w-md bg-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={() => setShowCreateUnitModal(true)}
                disabled={!selectedCategoryId}
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Criar Unidade
              </Button>
              <Button
                onClick={() => setShowCreateLessonModal(true)}
                disabled={!selectedCategoryId || !units || units.length === 0}
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Criar Aula
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedCategoryId ? (
        <div className="flex h-[calc(100vh-240px)]">
          {/* Left Sidebar - Units and Lessons Tree (Desktop Only) */}
          <div className="hidden lg:block lg:w-[400px] border-r overflow-y-auto bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Visualização
              </h3>

              {localUnits.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndUnits}
                  onDragStart={() => setIsDraggingUnit(true)}
                >
                  <SortableContext
                    items={localUnits.map((unit) => unit._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {localUnits.map((unit) => (
                        <SortableUnitItem
                          key={unit._id}
                          unit={unit}
                          isExpanded={expandedUnits.has(unit._id)}
                          unitLessons={getLessonsForUnit(unit._id)}
                          onToggle={toggleUnit}
                          onEdit={handleEditUnit}
                          onEditLesson={handleEditLesson}
                          onTogglePublishUnit={handleTogglePublishUnit}
                          onTogglePublishLesson={handleTogglePublishLesson}
                          isDraggingUnit={isDraggingUnit}
                          isDraggingLesson={isDraggingLesson}
                          sensors={sensors}
                          onDragEndLessons={handleDragEndLessons}
                          onDragStartLesson={() => setIsDraggingLesson(true)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma unidade criada nesta categoria ainda
                </p>
              )}
            </div>
          </div>

          {/* Right Content Area - Edit Forms or Empty State */}
          <div className="flex-1 overflow-y-auto p-8">
            {editMode.type === 'none' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground space-y-2">
                  <p className="text-lg">Selecione uma unidade ou aula para editar</p>
                  <p className="text-sm">Clique no ícone de lápis ao lado de cada item</p>
                </div>
              </div>
            ) : editMode.type === 'unit' ? (
              <UnitEditForm
                unit={editMode.unit}
                categories={categories}
                onSave={handleSaveUnit}
                onCancel={() => setEditMode({ type: 'none' })}
              />
            ) : (
              <LessonEditForm
                lesson={editMode.lesson}
                units={units || []}
                onSave={handleSaveLesson}
                onCancel={() => setEditMode({ type: 'none' })}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-240px)]">
          <p className="text-muted-foreground">
            Selecione uma categoria para começar
          </p>
        </div>
      )}
      {/* Create Unit Modal */}
      <Dialog open={showCreateUnitModal} onOpenChange={setShowCreateUnitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Unidade</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar uma nova unidade
            </DialogDescription>
          </DialogHeader>
          <UnitForm
            categories={selectedCategory ? [selectedCategory] : categories}
            onSuccess={() => setShowCreateUnitModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Lesson Modal */}
      <Dialog open={showCreateLessonModal} onOpenChange={setShowCreateLessonModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Aula</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar uma nova aula
            </DialogDescription>
          </DialogHeader>
          {units && units.length > 0 ? (
            <LessonForm units={units} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Crie uma unidade primeiro para poder adicionar aulas
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </div>
  );
}

// Unit Edit Form Component
function UnitEditForm({
  unit,
  categories,
  onSave,
  onCancel,
}: {
  unit: Doc<"units">;
  categories: Doc<"categories">[];
  onSave: (data: { categoryId: Id<"categories">; title: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>(unit.categoryId);
  const [title, setTitle] = useState(unit.title);
  const [description, setDescription] = useState(unit.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when unit changes
  useEffect(() => {
    setCategoryId(unit.categoryId);
    setTitle(unit.title);
    setDescription(unit.description);
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        categoryId: categoryId as Id<"categories">,
        title,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Editar Unidade</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Atualize as informações da unidade abaixo
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unit-category">Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                <SelectTrigger id="edit-unit-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unit-title">Título *</Label>
              <Input
                id="edit-unit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unit-description">Descrição *</Label>
              <Textarea
                id="edit-unit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Lesson Edit Form Component
function LessonEditForm({
  lesson,
  units,
  onSave,
  onCancel,
}: {
  lesson: Doc<"lessons">;
  units: Doc<"units">[];
  onSave: (data: {
    unitId: Id<"units">;
    title: string;
    description: string;
    lessonNumber: number;
    tags?: string[];
  }) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();
  const updateLesson = useMutation(api.lessons.update);

  const [unitId, setUnitId] = useState<string>(lesson.unitId);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [lessonNumber, setLessonNumber] = useState(lesson.lessonNumber);
  const [tags, setTags] = useState(lesson.tags?.join(", ") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video upload states
  const [showUploader, setShowUploader] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(lesson.videoId);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const video = useQuery(
    api.videos.getByVideoId,
    currentVideoId ? { videoId: currentVideoId } : "skip"
  );

  // Update form values when lesson changes
  useEffect(() => {
    setUnitId(lesson.unitId);
    setTitle(lesson.title);
    setDescription(lesson.description);
    setLessonNumber(lesson.lessonNumber);
    setTags(lesson.tags?.join(", ") || "");
    setCurrentVideoId(lesson.videoId);
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tagsArray = tags
        ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
        : [];

      await onSave({
        unitId: unitId as Id<"units">,
        title,
        description,
        lessonNumber,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVideo = () => {
    showConfirm(
      "Tem certeza que deseja remover o vídeo desta aula?",
      async () => {
        try {
          const tagsArray = tags
            ? tags
              .split(",")
              .map((tag: string) => tag.trim())
              .filter(Boolean)
            : [];

          await updateLesson({
            id: lesson._id,
            unitId: unitId as Id<"units">,
            title,
            description,
            durationSeconds: lesson.durationSeconds,
            order_index: lesson.order_index,
            lessonNumber,
            isPublished: lesson.isPublished,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            videoId: undefined,
          });

          setCurrentVideoId(undefined);
          toast({
            title: "Sucesso",
            description: "Vídeo removido da aula com sucesso!",
          });
        } catch (error) {
          showError(
            error instanceof Error ? error.message : "Erro ao remover vídeo",
            "Erro ao remover vídeo"
          );
        }
      },
      "Remover vídeo"
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        showError("Por favor, selecione um arquivo de vídeo", "Arquivo inválido");
        return;
      }

      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showError("O arquivo é muito grande (máximo 5GB)", "Arquivo muito grande");
        return;
      }

      setUploadFile(selectedFile);
    }
  };

  const handleUploadVideo = async () => {
    if (!uploadFile) {
      showError("Selecione um arquivo de vídeo", "Arquivo não selecionado");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create video in Bunny
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
        ".convex.cloud",
        ".convex.site"
      );

      const createResponse = await fetch(`${convexUrl}/bunny/create-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          description: "",
          isPrivate: true,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Falha ao criar vídeo");
      }

      const { videoId, libraryId } = await createResponse.json();

      // Step 2: Upload file via Server Action
      const uploadFormData = new FormData();
      uploadFormData.append("videoId", videoId);
      uploadFormData.append("libraryId", libraryId);
      uploadFormData.append("file", uploadFile);

      const { uploadVideoToBunny } = await import("@/app/actions/bunny");
      const uploadResult = await uploadVideoToBunny(uploadFormData);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Falha no upload");
      }

      // Step 3: Update lesson with videoId
      const tagsArray = tags
        ? tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
        : [];

      await updateLesson({
        id: lesson._id,
        unitId: unitId as Id<"units">,
        title,
        description,
        durationSeconds: lesson.durationSeconds,
        order_index: lesson.order_index,
        lessonNumber,
        isPublished: lesson.isPublished,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: videoId,
      });

      setCurrentVideoId(videoId);
      setShowUploader(false);
      setUploadFile(null);

      toast({
        title: "✅ Vídeo enviado!",
        description: "Vídeo associado à aula com sucesso!",
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro no upload"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Editar Aula</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Atualize as informações da aula abaixo
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lesson-unit">Unidade *</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={isSubmitting}>
                <SelectTrigger id="edit-lesson-unit">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit._id} value={unit._id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-title">Título *</Label>
              <Input
                id="edit-lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-description">Descrição *</Label>
              <Textarea
                id="edit-lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-number">Número da Aula *</Label>
              <Input
                id="edit-lesson-number"
                type="number"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(parseInt(e.target.value) || 1)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lesson-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="edit-lesson-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                placeholder="ortopedia, medicina, traumatologia"
              />

            </div>

            {/* Video Management Section */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Gerenciar Vídeo</Label>
              {currentVideoId && !showUploader ? (
                <div className="space-y-2">
                  {video === undefined ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100">
                      <LoaderIcon className="h-5 w-5 text-gray-600 animate-spin" />
                      <p className="text-sm text-gray-700">Carregando informações do vídeo...</p>
                    </div>
                  ) : video === null ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <XCircleIcon className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                          Vídeo não encontrado
                        </p>
                        <p className="text-xs text-yellow-700">
                          O vídeo foi deletado ou não existe mais no sistema
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                        title="Remover referência"
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Vídeo vinculado
                        </p>
                        <p className="text-xs text-green-700">
                          Status: {video.status === "ready" ? "Pronto" : video.status === "processing" ? "Processando" : video.status}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : showUploader ? (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Upload de Vídeo</h4>

                  </div>

                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground">
                        📁 {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleUploadVideo}
                      disabled={isUploading || !uploadFile}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Fazer Upload
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowUploader(false);
                        setUploadFile(null);
                      }}
                      disabled={isUploading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploader(true)}
                  className="w-full"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Fazer Upload de Vídeo
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>

        {/* Modals */}
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
      </CardContent>
    </Card>
  );
}

// Sortable Unit Item Component
function SortableUnitItem({
  unit,
  isExpanded,
  unitLessons,
  onToggle,
  onEdit,
  onEditLesson,
  onTogglePublishUnit,
  onTogglePublishLesson,
  isDraggingUnit,
  isDraggingLesson,
  sensors,
  onDragEndLessons,
  onDragStartLesson,
}: {
  unit: Doc<"units">;
  isExpanded: boolean;
  unitLessons: Doc<"lessons">[];
  onToggle: (unitId: string) => void;
  onEdit: (unit: Doc<"units">) => void;
  onEditLesson: (lesson: Doc<"lessons">) => void;
  onTogglePublishUnit: (unitId: Id<"units">) => void;
  onTogglePublishLesson: (lessonId: Id<"lessons">) => void;
  isDraggingUnit: boolean;
  isDraggingLesson: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEndLessons: (unitId: string) => (event: DragEndEvent) => Promise<void>;
  onDragStartLesson: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: unit._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-1",
        isItemDragging && "opacity-50 ring-2 ring-primary rounded-lg shadow-lg z-50"
      )}
    >
      {/* Unit Header */}
      <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded shrink-0"
          title="Arraste para reordenar unidade"
        >
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => onToggle(unit._id)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {unit.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {unitLessons.length} {unitLessons.length === 1 ? "aula" : "aulas"}
            </p>
          </div>
        </button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => onTogglePublishUnit(unit._id)}
          title={unit.isPublished ? "Despublicar" : "Publicar"}
          disabled={isDraggingUnit}
        >
          {unit.isPublished ? (
            <EyeIcon className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOffIcon className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => onEdit(unit)}
          title="Editar unidade"
          disabled={isDraggingUnit}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Lessons List */}
      {isExpanded && unitLessons.length > 0 && (
        <div className="ml-6 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEndLessons(unit._id)}
            onDragStart={onDragStartLesson}
          >
            <SortableContext
              items={unitLessons.map((lesson) => lesson._id)}
              strategy={verticalListSortingStrategy}
            >
              {unitLessons.map((lesson) => (
                <SortableLessonItem
                  key={lesson._id}
                  lesson={lesson}
                  onEdit={onEditLesson}
                  onTogglePublish={onTogglePublishLesson}
                  isDragging={isDraggingLesson}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

// Sortable Lesson Item Component
function SortableLessonItem({
  lesson,
  onEdit,
  onTogglePublish,
  isDragging,
}: {
  lesson: Doc<"lessons">;
  onEdit: (lesson: Doc<"lessons">) => void;
  onTogglePublish: (lessonId: Id<"lessons">) => void;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded bg-white border border-gray-200 transition-all",
        isItemDragging && "opacity-50 ring-2 ring-primary shadow-lg z-50",
        !isItemDragging && "hover:border-gray-300"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded shrink-0"
        title="Arraste para reordenar"
      >
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          {lesson.lessonNumber}. {lesson.title}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => onTogglePublish(lesson._id)}
        title={lesson.isPublished ? "Despublicar" : "Publicar"}
        disabled={isDragging}
      >
        {lesson.isPublished ? (
          <EyeIcon className="h-3 w-3 text-green-600" />
        ) : (
          <EyeOffIcon className="h-3 w-3 text-gray-400" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => onEdit(lesson)}
        title="Editar aula"
        disabled={isDragging}
      >
        <PencilIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}
