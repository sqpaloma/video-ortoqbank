"use client";

import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import {
  Preloaded,
  usePreloadedQuery,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeftIcon,
  PlayCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { LessonList } from "./lesson-list";
import { VideoPlayerWithWatermark } from "@/components/bunny/video-player-with-watermark";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LessonInfoSection } from "./lesson-info-section";
import { Feedback } from "./feedback";


interface ModulesInnerProps {
  preloadedModules: Preloaded<typeof api.modules.listByCategory>;
  categoryTitle: string;
}

export function ModulesInner({
  preloadedModules,
  categoryTitle,
}: ModulesInnerProps) {
  const modules = usePreloadedQuery(preloadedModules);
  const router = useRouter();
  const { user } = useUser();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(
    null,
  );
  const [currentModuleId, setCurrentModuleId] = useState<Id<"modules"> | null>(
    null,
  );
  const [nextModuleId, setNextModuleId] = useState<Id<"modules"> | null>(null);

  // Mutations
  const markCompleted = useMutation(api.progress.markLessonCompleted);
  const markIncomplete = useMutation(api.progress.markLessonIncomplete);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const addRecentView = useMutation(api.recentViews.addView);

  // Load lessons for first module to get the first lesson
  const firstModuleLessons = useQuery(
    api.lessons.listByModule,
    modules[0] ? { moduleId: modules[0]._id } : "skip",
  );

  // Load lessons for current module
  const currentModuleLessons = useQuery(
    api.lessons.listByModule,
    currentModuleId ? { moduleId: currentModuleId } : "skip",
  );

  // Load lessons for next module (for smooth transitions)
  const nextModuleLessons = useQuery(
    api.lessons.listByModule,
    nextModuleId ? { moduleId: nextModuleId } : "skip",
  );

  // Queries for current state
  const currentLesson = useQuery(
    api.lessons.getById,
    currentLessonId ? { id: currentLessonId } : "skip",
  );

  const allUserProgress = useQuery(
    api.progress.getModuleLessonsProgress,
    user?.id && currentModuleId
      ? {
          userId: user.id,
          moduleId: currentModuleId,
        }
      : "skip",
  );

  const isFavorited = useQuery(
    api.favorites.isFavorited,
    user?.id && currentLessonId
      ? { userId: user.id, lessonId: currentLessonId }
      : "skip",
  );

  // Set first lesson as current when data loads
  useEffect(() => {
    if (
      firstModuleLessons &&
      firstModuleLessons.length > 0 &&
      !currentLessonId
    ) {
      setCurrentLessonId(firstModuleLessons[0]._id);
      setCurrentModuleId(modules[0]._id);
      setExpandedModules(new Set([modules[0]._id]));
    }
  }, [firstModuleLessons, currentLessonId, modules]);

  // Handle transition to first lesson of next module
  useEffect(() => {
    const transitionToNextModule = async () => {
      if (nextModuleId && nextModuleLessons && nextModuleLessons.length > 0) {
        const firstLesson = nextModuleLessons[0];
        
        // Only transition if we haven't already switched to this lesson
        if (currentLessonId !== firstLesson._id) {
          await handleLessonClick(firstLesson._id, nextModuleId);
        }
        
        // Reset nextModuleId after handling
        setNextModuleId(null);
      }
    };

    transitionToNextModule();
  }, [nextModuleId, nextModuleLessons, currentLessonId, user?.id]);

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

  const handleLessonClick = async (
    lessonId: Id<"lessons">,
    moduleId: Id<"modules">,
  ) => {
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
      // Toggle between completed and incomplete
      if (isLessonCompleted) {
        // If already completed, mark as incomplete
        await markIncomplete({ userId: user.id, lessonId: currentLessonId });
      } else {
        // If not completed, mark as completed
        await markCompleted({ userId: user.id, lessonId: currentLessonId });

        // Register completion view
        await addRecentView({
          userId: user.id,
          lessonId: currentLessonId,
          moduleId: currentModuleId,
          action: "completed",
        });
      }
    } catch (error) {
      console.error("Error toggling lesson completion:", error);
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

  const handleNextLesson = async () => {
    if (!currentLessonId || !currentModuleId || !currentModuleLessons) return;

    // Find current lesson index in current module
    const currentLessonIndex = currentModuleLessons.findIndex(
      (lesson) => lesson._id === currentLessonId
    );

    if (currentLessonIndex === -1) return;

    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModuleLessons.length - 1) {
      // Go to next lesson in same module
      const nextLesson = currentModuleLessons[currentLessonIndex + 1];
      await handleLessonClick(nextLesson._id, currentModuleId);
    } else {
      // Current lesson is the last in module, try to go to first lesson of next module
      const currentModuleIndex = modules.findIndex(
        (m) => m._id === currentModuleId
      );
      
      if (currentModuleIndex === -1 || currentModuleIndex >= modules.length - 1) {
        // This is the last module, no next lesson
        return;
      }

      // Get next module
      const nextModule = modules[currentModuleIndex + 1];
      
      // Expand the next module and trigger loading of its lessons
      setExpandedModules((prev) => new Set(prev).add(nextModule._id));
      setNextModuleId(nextModule._id);
    }
  };

  const isLessonCompleted = allUserProgress?.some(
    (p) => p.lessonId === currentLessonId && p.completed,
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
  const totalLessonsCount = modules.reduce(
    (acc, m) => acc + m.totalLessonVideos,
    0,
  );
  const globalProgressPercent =
    totalLessonsCount > 0
      ? (totalCompletedLessons / totalLessonsCount) * 100
      : 0;

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">
          Nenhum módulo disponível nesta categoria ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-4 px-6 flex items-center gap-4 border-b">
        <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="hover:bg-accent"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{categoryTitle}</h1>
          <p className="text-xs text-muted-foreground">
            {categoryTitle.split(" ").length > 2
              ? categoryTitle.split(" ").slice(1).join(" ")
              : "Ciências Básicas em Ortopedia"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Modules and Lessons (Desktop Only) */}
        <div className="hidden md:block md:w-[400px] border-r overflow-y-auto bg-gray-50">
          {/* Progress Bar */}
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-bold text-primary">
                {Math.round(globalProgressPercent)}%
              </span>
            </div>
            <Progress value={globalProgressPercent} className="h-2" />
          </div>

          {/* Modules List */}
          <div className="p-4 space-y-2">
            {modules.map((module) => (
              <LessonList
                key={module._id}
                moduleId={module._id}
                moduleTitle={module.title}
                totalLessons={module.totalLessonVideos}
                isExpanded={expandedModules.has(module._id)}
                currentLessonId={currentLessonId}
                userProgress={allUserProgress}
                onToggle={() => toggleModule(module._id)}
                onLessonClick={(lessonId: Id<"lessons">) =>
                  handleLessonClick(lessonId, module._id)
                }
              />
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <>
              {/* Mobile Progress Bar (above video) */}
              <div className="md:hidden px-6 pt-4 pb-2 bg-white border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Progresso Total</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(globalProgressPercent)}%
                  </span>
                </div>
                <Progress value={globalProgressPercent} className="h-1.5" />
              </div>

              {/* Video Player (both mobile and desktop) */}
              <div className="px-6 py-6 md:px-6">
                {/* Video Player with Watermark */}
                {currentLesson.videoId ? (
                  <div className="mb-6">
                    <VideoPlayerWithWatermark
                      videoId={currentLesson.videoId}
                      libraryId={
                        process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "550336"
                      }
                      userName={user?.fullName || user?.firstName || "Usuário"}
                      userCpf={
                        (user?.publicMetadata?.cpf as string) || "000.000.000-00"
                      }
                    />
                  </div>
                ) : (
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-6">
                    <div className="text-center">
                      <PlayCircleIcon size={64} className="text-white/50 mb-2" />
                      <p className="text-white/70 text-sm">
                        Vídeo ainda não disponível
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: Tabs with lesson info and modules */}
              <div className="md:hidden px-6 pb-8">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="modules">Módulos</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Informações */}
                  <TabsContent value="info" className="mt-4 pb-8">
                    <LessonInfoSection
                      title={currentLesson.title}
                      description={currentLesson.description}
                      isCompleted={isLessonCompleted ?? false}
                      isFavorited={isFavorited ?? false}
                      onMarkCompleted={handleMarkCompleted}
                      onToggleFavorite={handleToggleFavorite}
                      onNextLesson={handleNextLesson}
                      variant="mobile"
                    />

                    {user?.id && currentLessonId && currentModuleId && (
                      <Feedback
                        userId={user.id}
                        lessonId={currentLessonId}
                        moduleId={currentModuleId}
                      />
                    )}
                  </TabsContent>

                  {/* Tab 2: Módulos */}
                  <TabsContent value="modules" className="mt-4 pb-8">
                    <div className="space-y-2">
                      {modules.map((module) => (
                        <LessonList
                          key={module._id}
                          moduleId={module._id}
                          moduleTitle={module.title}
                          totalLessons={module.totalLessonVideos}
                          isExpanded={expandedModules.has(module._id)}
                          currentLessonId={currentLessonId}
                          userProgress={allUserProgress}
                          onToggle={() => toggleModule(module._id)}
                          onLessonClick={(lessonId: Id<"lessons">) =>
                            handleLessonClick(lessonId, module._id)
                          }
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Desktop: Lesson info (no tabs) */}
              <div className="hidden md:block px-6">
                <LessonInfoSection
                  title={currentLesson.title}
                  description={currentLesson.description}
                  isCompleted={isLessonCompleted ?? false}
                  isFavorited={isFavorited ?? false}
                  onMarkCompleted={handleMarkCompleted}
                  onToggleFavorite={handleToggleFavorite}
                  onNextLesson={handleNextLesson}
                  variant="desktop"
                />

                {user?.id && currentLessonId && currentModuleId && (
                  <Feedback
                    userId={user.id}
                    lessonId={currentLessonId}
                    moduleId={currentModuleId}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Mobile: Show modules list when no lesson selected */}
              <div className="md:hidden">
                {/* Progress Bar */}
                <div className="px-6 pt-4 pb-2 bg-white border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Progresso Total</span>
                    <span className="text-sm font-bold text-primary">
                      {Math.round(globalProgressPercent)}%
                    </span>
                  </div>
                  <Progress value={globalProgressPercent} className="h-1.5" />
                </div>

                {/* Modules List */}
                <div className="px-6 py-6 pb-8 space-y-2">
                  {modules.map((module) => (
                    <LessonList
                      key={module._id}
                      moduleId={module._id}
                      moduleTitle={module.title}
                      totalLessons={module.totalLessonVideos}
                      isExpanded={expandedModules.has(module._id)}
                      currentLessonId={currentLessonId}
                      userProgress={allUserProgress}
                      onToggle={() => toggleModule(module._id)}
                      onLessonClick={(lessonId: Id<"lessons">) =>
                        handleLessonClick(lessonId, module._id)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: Show message when no lesson selected */}
              <div className="hidden md:flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg mb-2">
                    Selecione uma aula para começar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma aula na barra lateral
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
