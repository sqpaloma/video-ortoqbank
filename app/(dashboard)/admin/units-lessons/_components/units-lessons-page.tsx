"use client";

import { useMemo, createContext, useContext } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import {
  useTenantQuery,
  useTenantMutation,
  useTenantReady,
} from "@/hooks/use-tenant-convex";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
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
import { useConfirmModal } from "@/hooks/use-confirm-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
import { useUnitsLessonsStore } from "./store";

// Context for passing down handlers that need access to mutations
interface UnitsLessonsPageContextValue {
  handleDeleteUnit: (unitId: Id<"units">) => void;
  handleDeleteLesson: (lessonId: Id<"lessons">) => void;
  localUnits: Doc<"units">[];
  localLessons: Record<string, Doc<"lessons">[]>;
}

const UnitsLessonsPageContext =
  createContext<UnitsLessonsPageContextValue | null>(null);

export function useUnitsLessonsPageContext() {
  const context = useContext(UnitsLessonsPageContext);
  if (!context) {
    throw new Error(
      "useUnitsLessonsPageContext must be used within UnitsLessonsPage",
    );
  }
  return context;
}

export function UnitsLessonsPage() {
  const isTenantReady = useTenantReady();

  // Query categories with tenant context
  const categories = useTenantQuery(api.categories.list, {});
  const { state } = useSidebar();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { confirm, showConfirm, hideConfirm } = useConfirmModal();

  // Zustand store
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    editMode,
    clearEditMode,
    showCreateUnitModal,
    showCreateLessonModal,
    setShowCreateUnitModal,
    setShowCreateLessonModal,
    setIsDraggingUnit,
    setIsDraggingLesson,
    draggedUnits,
    draggedLessons,
    setDraggedUnits,
    setDraggedLessons,
    updateDraggedLessonsForUnit,
  } = useUnitsLessonsStore();

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Query units and lessons based on selected category
  const units = useTenantQuery(
    api.units.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip",
  );

  const lessons = useTenantQuery(
    api.lessons.listByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip",
  );

  // Mutations
  const updateUnit = useTenantMutation(api.units.update);
  const updateLesson = useTenantMutation(api.lessons.update);
  const reorderLessons = useTenantMutation(api.lessons.reorder);
  const reorderUnits = useTenantMutation(api.units.reorder);
  const removeUnit = useTenantMutation(api.units.remove);
  const removeLesson = useTenantMutation(api.lessons.remove);

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
        if (!isTenantReady) {
          throw new Error("Tenant not loaded");
        }

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
        updateDraggedLessonsForUnit(unitId, reorderedLessons, localLessons);

        // Save to database
        try {
          if (!isTenantReady) {
            throw new Error("Tenant not loaded");
          }

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

  const selectedCategory = categories?.find(
    (cat) => cat._id === selectedCategoryId,
  );

  const handleSaveUnit = async (data: {
    categoryId: Id<"categories">;
    title: string;
    description: string;
  }) => {
    if (editMode.type !== "unit") return;

    try {
      if (!isTenantReady) {
        throw new Error("Tenant not loaded");
      }
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

      clearEditMode();
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
    videoId?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
  }) => {
    if (editMode.type !== "lesson") return;

    try {
      if (!isTenantReady) {
        throw new Error("Tenant not loaded");
      }
      await updateLesson({
        id: editMode.lesson._id,
        unitId: data.unitId,
        title: data.title,
        description: data.description,
        durationSeconds: data.durationSeconds ?? editMode.lesson.durationSeconds,
        order_index: editMode.lesson.order_index,
        isPublished: editMode.lesson.isPublished,
        videoId: data.videoId ?? editMode.lesson.videoId,
        thumbnailUrl: data.thumbnailUrl ?? editMode.lesson.thumbnailUrl,
      });

      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso!",
      });

      clearEditMode();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao atualizar aula",
        "Erro ao atualizar aula",
      );
    }
  };

  const handleDeleteUnit = (unitId: Id<"units">) => {
    const unit = localUnits.find((u) => u._id === unitId);
    if (!unit) return;

    const unitLessons = localLessons[unitId] || [];
    const lessonCount = unitLessons.length;

    const message =
      lessonCount > 0
        ? `Tem certeza que deseja excluir a unidade "${unit.title}"? Isso também excluirá ${lessonCount} ${lessonCount === 1 ? "aula" : "aulas"} associadas.`
        : `Tem certeza que deseja excluir a unidade "${unit.title}"?`;

    showConfirm(
      message,
      async () => {
        try {
          if (!isTenantReady) {
            throw new Error("Tenant not loaded");
          }
          await removeUnit({ id: unitId });
          toast({
            title: "Sucesso",
            description: "Unidade excluída com sucesso!",
          });
          // Clear edit mode if we were editing this unit
          if (editMode.type === "unit" && editMode.unit._id === unitId) {
            clearEditMode();
          }
        } catch (error) {
          console.error("Error deleting unit:", error);
          showError(
            error instanceof Error ? error.message : "Erro ao excluir unidade",
            "Erro ao excluir unidade",
          );
        }
      },
      "Excluir Unidade",
    );
  };

  const handleDeleteLesson = (lessonId: Id<"lessons">) => {
    // Find the lesson across all units
    let lessonToDelete: Doc<"lessons"> | undefined;
    for (const unitLessons of Object.values(localLessons)) {
      lessonToDelete = unitLessons.find((l) => l._id === lessonId);
      if (lessonToDelete) break;
    }

    if (!lessonToDelete) return;

    showConfirm(
      `Tem certeza que deseja excluir a aula "${lessonToDelete.title}"?`,
      async () => {
        try {
          if (!isTenantReady) {
            throw new Error("Tenant not loaded");
          }
          await removeLesson({ id: lessonId });
          toast({
            title: "Sucesso",
            description: "Aula excluída com sucesso!",
          });
          // Clear edit mode if we were editing this lesson
          if (editMode.type === "lesson" && editMode.lesson._id === lessonId) {
            clearEditMode();
          }
        } catch (error) {
          console.error("Error deleting lesson:", error);
          showError(
            error instanceof Error ? error.message : "Erro ao excluir aula",
            "Erro ao excluir aula",
          );
        }
      },
      "Excluir Aula",
    );
  };

  // Loading state
  if (!isTenantReady || categories === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <UnitsLessonsPageContext.Provider
      value={{ handleDeleteUnit, handleDeleteLesson, localUnits, localLessons }}
    >
      <div className=" relative">
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
                Gerenciar Unidades e Aulas
              </h1>
            </div>
          </div>
        </div>

        {/* Category Selector */}
        <div className="py-4 px-8 ">
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
                  {(categories || []).map((category) => (
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
              sensors={sensors}
              onDragEndUnits={handleDragEndUnits}
              onDragEndLessons={handleDragEndLessons}
            />

            {/* Right Content Area - Edit Forms or Empty State */}
            <div className="flex-1 overflow-y-auto p-2">
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
                  categories={categories || []}
                  onSave={handleSaveUnit}
                  onCancel={clearEditMode}
                />
              ) : (
                <LessonEditPanel
                  lesson={editMode.lesson}
                  units={units || []}
                  onSave={handleSaveLesson}
                  onCancel={clearEditMode}
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
        <Dialog
          open={showCreateUnitModal}
          onOpenChange={setShowCreateUnitModal}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Unidade</DialogTitle>
              <DialogDescription>
                Preencha as informações para criar uma nova unidade
              </DialogDescription>
            </DialogHeader>
            <UnitForm
              categories={
                selectedCategory ? [selectedCategory] : categories || []
              }
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

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirm.isOpen}
          onOpenChange={hideConfirm}
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      </div>
    </UnitsLessonsPageContext.Provider>
  );
}
