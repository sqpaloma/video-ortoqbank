"use client";

import { useState, useMemo } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Preloaded,
  usePreloadedQuery,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Import refactored components
import { UnitsTreeSidebar } from "./units-tree-sidebar";
import { UnitEditPanel } from "./unit-edit-panel";
import { LessonEditPanel } from "./lesson-edit-panel";
import { UnitForm } from "./unit-create-form";
import { LessonForm } from "./lesson-create-form";
import { EditMode } from "./types";

interface UnitsLessonsPageProps {
  preloadedCategories: Preloaded<typeof api.categories.list>;
}

export function UnitsLessonsPage({
  preloadedCategories,
}: UnitsLessonsPageProps) {
  const categories = usePreloadedQuery(preloadedCategories);
  const { state } = useSidebar();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();

  // State for selected category - starts as null
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"categories"> | null>(null);

  // State for expanded units in left sidebar
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // State for modals
  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);

  // State for editing
  const [editMode, setEditMode] = useState<EditMode>({ type: "none" });

  // State for drag and drop reordering
  const [draggedLessons, setDraggedLessons] = useState<Record<
    string,
    Doc<"lessons">[]
  > | null>(null);
  const [draggedUnits, setDraggedUnits] = useState<Doc<"units">[] | null>(null);
  const [isDraggingLesson, setIsDraggingLesson] = useState(false);
  const [isDraggingUnit, setIsDraggingUnit] = useState(false);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Query units and lessons based on selected category
  const units = useQuery(
    api.units.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip",
  );

  const lessons = useQuery(
    api.lessons.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip",
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
    const sorted =
      draggedUnits ||
      (units ? [...units].sort((a, b) => a.order_index - b.order_index) : []);
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
          "Erro ao reordenar unidades",
        );
        // Revert on error
        setDraggedUnits(null);
      }
    }
  };

  const handleDragEndLessons =
    (unitId: string) => async (event: DragEndEvent) => {
      const { active, over } = event;
      setIsDraggingLesson(false);

      if (over && active.id !== over.id) {
        const unitLessons = localLessons[unitId] || [];
        const oldIndex = unitLessons.findIndex(
          (item) => item._id === active.id,
        );
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
            "Erro ao reordenar aulas",
          );
          // Revert on error
          setDraggedLessons(null);
        }
      }
    };

  const selectedCategory = categories.find(
    (cat) => cat._id === selectedCategoryId,
  );

  const handleEditUnit = (unit: Doc<"units">) => {
    setEditMode({ type: "unit", unit });
  };

  const handleEditLesson = (lesson: Doc<"lessons">) => {
    setEditMode({ type: "lesson", lesson });
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
        "Erro ao atualizar status",
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
        "Erro ao atualizar status",
      );
    }
  };

  const handleSaveUnit = async (data: {
    categoryId: Id<"categories">;
    title: string;
    description: string;
  }) => {
    if (editMode.type !== "unit") return;

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

      setEditMode({ type: "none" });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar unidade",
        "Erro ao atualizar unidade",
      );
    }
  };

  const handleSaveLesson = async (data: {
    unitId: Id<"units">;
    title: string;
    description: string;
    lessonNumber: number;
    tags?: string[];
    videoId?: string;
  }) => {
    if (editMode.type !== "lesson") return;

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
        videoId: data.videoId ?? editMode.lesson.videoId,
      });

      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!",
      });

      setEditMode({ type: "none" });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar aula",
        "Erro ao atualizar aula",
      );
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
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
          <h1 className="text-2xl font-semibold">Gerenciar Unidades e Aulas</h1>
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
              onValueChange={(value) =>
                setSelectedCategoryId(value as Id<"categories">)
              }
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
          {/* Left Sidebar - Units and Lessons Tree */}
          <UnitsTreeSidebar
            units={localUnits}
            lessons={localLessons}
            expandedUnits={expandedUnits}
            isDraggingUnit={isDraggingUnit}
            isDraggingLesson={isDraggingLesson}
            sensors={sensors}
            onToggleUnit={toggleUnit}
            onEditUnit={handleEditUnit}
            onEditLesson={handleEditLesson}
            onTogglePublishUnit={handleTogglePublishUnit}
            onTogglePublishLesson={handleTogglePublishLesson}
            onDragEndUnits={handleDragEndUnits}
            onDragEndLessons={handleDragEndLessons}
            onDragStartUnit={() => setIsDraggingUnit(true)}
            onDragStartLesson={() => setIsDraggingLesson(true)}
          />

          {/* Right Content Area - Edit Forms or Empty State */}
          <div className="flex-1 overflow-y-auto p-8">
            {editMode.type === "none" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground space-y-2">
                  <p className="text-lg">
                    Selecione uma unidade ou aula para editar
                  </p>
                  <p className="text-sm">
                    Clique no ícone de lápis ao lado de cada item
                  </p>
                </div>
              </div>
            ) : editMode.type === "unit" ? (
              <UnitEditPanel
                unit={editMode.unit}
                categories={categories}
                onSave={handleSaveUnit}
                onCancel={() => setEditMode({ type: "none" })}
              />
            ) : (
              <LessonEditPanel
                lesson={editMode.lesson}
                units={units || []}
                onSave={handleSaveLesson}
                onCancel={() => setEditMode({ type: "none" })}
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
      <Dialog
        open={showCreateLessonModal}
        onOpenChange={setShowCreateLessonModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Aula</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar uma nova aula
            </DialogDescription>
          </DialogHeader>
          {units && units.length > 0 ? (
            <LessonForm
              units={units}
              onSuccess={() => setShowCreateLessonModal(false)}
            />
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
