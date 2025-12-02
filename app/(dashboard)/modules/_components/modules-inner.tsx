"use client";

import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Preloaded, usePreloadedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeftIcon, CheckCircleIcon, ChevronRightIcon, StarIcon, PlayCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ModuleWithLessons } from "./module-with-lessons";

interface ModulesInnerProps {
  preloadedModules: Preloaded<typeof api.modules.listByCategory>;
  categoryTitle: string;
}

export function ModulesInner({ preloadedModules, categoryTitle }: ModulesInnerProps) {
  const modules = usePreloadedQuery(preloadedModules);
  const router = useRouter();
  const { user } = useUser();
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<Id<"modules"> | null>(null);

  // Mutations
  const markCompleted = useMutation(api.progress.markLessonCompleted);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const addRecentView = useMutation(api.recentViews.addView);

  // Load lessons for first module to get the first lesson
  const firstModuleLessons = useQuery(
    api.lessons.listByModule,
    modules[0] ? { moduleId: modules[0]._id } : "skip"
  );

  // Queries for current state
  const currentLesson = useQuery(
    api.lessons.getById,
    currentLessonId ? { id: currentLessonId } : "skip"
  );

  const allUserProgress = useQuery(
    api.progress.getModuleLessonsProgress,
    user?.id && currentModuleId ? { 
      userId: user.id, 
      moduleId: currentModuleId
    } : "skip"
  );

  const isFavorited = useQuery(
    api.favorites.isFavorited,
    user?.id && currentLessonId ? { userId: user.id, lessonId: currentLessonId } : "skip"
  );

  // Set first lesson as current when data loads
  useEffect(() => {
    if (firstModuleLessons && firstModuleLessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(firstModuleLessons[0]._id);
      setCurrentModuleId(modules[0]._id);
      setExpandedModules(new Set([modules[0]._id]));
    }
  }, [firstModuleLessons, currentLessonId, modules]);

  const handleBackClick = () => {
    router.push("/categories");
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleLessonClick = async (lessonId: Id<"lessons">, moduleId: Id<"modules">) => {
    setCurrentLessonId(lessonId);
    setCurrentModuleId(moduleId);

    // Register the view
    if (user?.id) {
      try {
        await addRecentView({
          userId: user.id,
          lessonId,
          moduleId,
          action: "started",
        });
      } catch (error) {
        console.error("Error adding recent view:", error);
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!user?.id || !currentLessonId || !currentModuleId) return;
    try {
      await markCompleted({ userId: user.id, lessonId: currentLessonId });
      
      // Register completion view
      await addRecentView({
        userId: user.id,
        lessonId: currentLessonId,
        moduleId: currentModuleId,
        action: "completed",
      });
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !currentLessonId) return;
    try {
      await toggleFavorite({ userId: user.id, lessonId: currentLessonId });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleNextLesson = () => {
    // TODO: Implement next lesson logic across modules
    if (!currentLessonId || !currentModuleId) return;
    const currentModule = modules.find((m) => m._id === currentModuleId);
    if (!currentModule) return;
    // For now, just a placeholder
  };

  const isLessonCompleted = allUserProgress?.some(
    (p) => p.lessonId === currentLessonId && p.completed
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate global progress across all modules
  const totalCompletedLessons = modules.reduce((acc, module) => {
    // This is simplified - in production you'd query progress for each module
    return acc;
  }, 0);
  const totalLessonsCount = modules.reduce((acc, m) => acc + m.totalLessonVideos, 0);
  const globalProgressPercent = totalLessonsCount > 0 ? (totalCompletedLessons / totalLessonsCount) * 100 : 0;

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum módulo disponível nesta categoria ainda.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-4 px-6 flex items-center gap-4 border-b">
        <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
        <Button variant="ghost" size="icon" onClick={handleBackClick} className="hover:bg-accent">
          <ArrowLeftIcon size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{categoryTitle}</h1>
          <p className="text-xs text-muted-foreground">
            {categoryTitle.split(" ").length > 2 ? categoryTitle.split(" ").slice(1).join(" ") : "Ciências Básicas em Ortopedia"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Modules and Lessons */}
        <div className="w-[400px] border-r overflow-y-auto bg-gray-50">
          {/* Progress Bar */}
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-bold text-primary">{Math.round(globalProgressPercent)}%</span>
            </div>
            <Progress value={globalProgressPercent} className="h-2" />
          </div>

          {/* Modules List */}
          <div className="p-4 space-y-2">
            {modules.map((module) => (
              <ModuleWithLessons
                key={module._id}
                moduleId={module._id}
                moduleTitle={module.title}
                totalLessons={module.totalLessonVideos}
                isExpanded={expandedModules.has(module._id)}
                currentLessonId={currentLessonId}
                userProgress={allUserProgress}
                onToggle={() => toggleModule(module._id)}
                onLessonClick={(lessonId) => handleLessonClick(lessonId, module._id)}
              />
            ))}
          </div>
        </div>

        {/* Right Content - Video Player */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <div className="p-6">
              {/* Video Player */}
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-6">
                <PlayCircleIcon size={64} className="text-white/50" />
              </div>

              {/* Lesson Info */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                <p className="text-muted-foreground">{currentLesson.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <Button
                  onClick={handleMarkCompleted}
                  variant={isLessonCompleted ? "outline" : "default"}
                  className="flex-1"
                >
                  <CheckCircleIcon size={18} className="mr-2" />
                  {isLessonCompleted ? "Concluída" : "Marcar como concluída"}
                </Button>
                <Button onClick={handleToggleFavorite} variant="outline">
                  <StarIcon
                    size={18}
                    className={cn(isFavorited && "fill-yellow-500 text-yellow-500")}
              />
                </Button>
              </div>

              {/* Next Lesson Button */}
              <Button onClick={handleNextLesson} variant="outline" className="w-full">
                Próxima aula
                <ChevronRightIcon size={18} className="ml-2" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Selecione uma aula para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

