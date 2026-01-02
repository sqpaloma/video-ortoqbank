"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
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
  CheckCircleIcon,
  StarIcon,
  ChevronRightIcon,
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
import { Rating } from "./rating";
import { cn } from "@/lib/utils";
import { getSignedEmbedUrl } from "@/app/actions/bunny";

interface UnitsPageProps {
  preloadedUnits: Preloaded<typeof api.units.listPublishedByCategory>;
  categoryTitle: string;
}

export function UnitsPage({ preloadedUnits, categoryTitle }: UnitsPageProps) {
  const units = usePreloadedQuery(preloadedUnits);
  const router = useRouter();
  const { user } = useUser();
  const { state } = useSidebar();

  // Mutations
  const markCompleted = useMutation(api.progress.mutations.markLessonCompleted);
  const markIncomplete = useMutation(
    api.progress.mutations.markLessonIncomplete,
  );
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const addRecentView = useMutation(api.recentViews.addView);

  // Load lessons for first unit to get the first lesson (only published)
  const firstUnitLessons = useQuery(
    api.lessons.listPublishedByUnit,
    units[0] ? { unitId: units[0]._id } : "skip",
  );

  // Compute initial values using useMemo
  const initialValues = useMemo(() => {
    if (firstUnitLessons && firstUnitLessons.length > 0 && units.length > 0) {
      return {
        lessonId: firstUnitLessons[0]._id,
        unitId: units[0]._id,
        expandedUnits: new Set([units[0]._id]),
      };
    }
    return null;
  }, [firstUnitLessons, units]);

  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(
    null,
  );
  const [currentUnitId, setCurrentUnitId] = useState<Id<"units"> | null>(null);
  const [nextUnitId, setNextUnitId] = useState<Id<"units"> | null>(null);

  // Video embed URL state
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);

  // Load lessons for current unit (only published)
  const currentUnitLessons = useQuery(
    api.lessons.listPublishedByUnit,
    currentUnitId ? { unitId: currentUnitId } : "skip",
  );

  // Load lessons for next unit (for smooth transitions, only published)
  const nextUnitLessons = useQuery(
    api.lessons.listPublishedByUnit,
    nextUnitId ? { unitId: nextUnitId } : "skip",
  );

  // Queries for current state
  const currentLesson = useQuery(
    api.lessons.getById,
    currentLessonId ? { id: currentLessonId } : "skip",
  );

  // OPTIMIZED: Get progress only for THIS category (not all 5000 lessons!)
  const categoryId = units[0]?.categoryId;
  const allUserProgress = useQuery(
    api.progress.queries.getCompletedLessonsByCategory,
    user?.id && categoryId ? { userId: user.id, categoryId } : "skip",
  );

  // OPTIMIZED: Get unit progress only for THIS category (not all 1000 units!)
  const allUnitsProgress = useQuery(
    api.progress.queries.getUnitProgressByCategory,
    user?.id && categoryId ? { userId: user.id, categoryId } : "skip",
  );

  const isFavorited = useQuery(
    api.favorites.isFavorited,
    user?.id && currentLessonId
      ? { userId: user.id, lessonId: currentLessonId }
      : "skip",
  );

  // Initialize first lesson when data becomes available
  // Using queueMicrotask to defer state updates and avoid cascading renders
  useEffect(() => {
    if (initialValues && !currentLessonId) {
      queueMicrotask(() => {
        setCurrentLessonId(initialValues.lessonId);
        setCurrentUnitId(initialValues.unitId);
        setExpandedUnits(initialValues.expandedUnits);
      });
    }
  }, [initialValues, currentLessonId]);

  // Fetch signed embed URL when lesson changes
  useEffect(() => {
    if (!currentLesson?.videoId) {
      setEmbedUrl(null);
      return;
    }

    const fetchEmbedUrl = async () => {
      setEmbedLoading(true);
      try {
        const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "566190";
        const result = await getSignedEmbedUrl(
          currentLesson.videoId!,
          libraryId,
        );
        setEmbedUrl(result.embedUrl);
      } catch (error) {
        console.error("Error fetching embed URL:", error);
        setEmbedUrl(null);
      } finally {
        setEmbedLoading(false);
      }
    };

    fetchEmbedUrl();
  }, [currentLesson?.videoId]);

  const handleBackClick = () => {
    router.push("/categories");
  };

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

  // Move handleLessonClick before the effect that uses it
  const handleLessonClick = useCallback(
    async (lessonId: Id<"lessons">, unitId: Id<"units">) => {
      setCurrentLessonId(lessonId);
      setCurrentUnitId(unitId);

      // Register the view
      if (user?.id) {
        try {
          await addRecentView({
            userId: user.id,
            lessonId,
            unitId,
            action: "started",
          });
        } catch (error) {
          console.error("Error adding recent view:", error);
        }
      }
    },
    [user, addRecentView],
  );

  // Handle transition to first lesson of next unit
  useEffect(() => {
    const transitionToNextUnit = async () => {
      if (nextUnitId && nextUnitLessons && nextUnitLessons.length > 0) {
        const firstLesson = nextUnitLessons[0];

        // Only transition if we haven't already switched to this lesson
        if (currentLessonId !== firstLesson._id) {
          await handleLessonClick(firstLesson._id, nextUnitId);
        }

        // Reset nextUnitId after handling
        setNextUnitId(null);
      }
    };

    transitionToNextUnit();
  }, [nextUnitId, nextUnitLessons, currentLessonId, handleLessonClick]);

  const handleMarkCompleted = async () => {
    if (!user?.id || !currentLessonId || !currentUnitId) return;
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
          unitId: currentUnitId,
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
    if (!currentLessonId || !currentUnitId || !currentUnitLessons) return;

    // Find current lesson index in current unit
    const currentLessonIndex = currentUnitLessons.findIndex(
      (lesson) => lesson._id === currentLessonId,
    );

    if (currentLessonIndex === -1) return;

    // Check if there's a next lesson in current unit
    if (currentLessonIndex < currentUnitLessons.length - 1) {
      // Go to next lesson in same unit
      const nextLesson = currentUnitLessons[currentLessonIndex + 1];
      await handleLessonClick(nextLesson._id, currentUnitId);
    } else {
      // Current lesson is the last in unit, try to go to first lesson of next unit
      const currentUnitIndex = units.findIndex((u) => u._id === currentUnitId);

      if (currentUnitIndex === -1 || currentUnitIndex >= units.length - 1) {
        // This is the last unit, no next lesson
        return;
      }

      // Get next unit
      const nextUnit = units[currentUnitIndex + 1];

      // Expand the next unit and trigger loading of its lessons
      setExpandedUnits((prev) => new Set(prev).add(nextUnit._id));
      setNextUnitId(nextUnit._id);
    }
  };

  const isLessonCompleted = allUserProgress?.some(
    (p: { lessonId: Id<"lessons">; completed: boolean }) =>
      p.lessonId === currentLessonId && p.completed,
  );

  // Calculate category progress - only for units in this category
  const totalCompletedLessons = units.reduce((acc, unit) => {
    const unitProgress = allUnitsProgress?.find(
      (p: { unitId: Id<"units">; completedLessonsCount: number }) =>
        p.unitId === unit._id,
    );
    return acc + (unitProgress?.completedLessonsCount || 0);
  }, 0);

  const totalLessonsCount = units.reduce(
    (acc, m) => acc + m.totalLessonVideos,
    0,
  );

  const globalProgressPercent =
    totalLessonsCount > 0
      ? Math.min(
          100,
          Math.round((totalCompletedLessons / totalLessonsCount) * 100),
        )
      : 0;

  if (units.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">
          Nenhum módulo disponível nesta categoria ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      {/* Header */}
      <div className="py-4 px-6 flex items-center gap-4 border-b">
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
        {/* Left Sidebar - Units and Lessons (Desktop Only) */}
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

          {/* Units List */}
          <div className="p-4 space-y-2">
            {units.map((unit) => (
              <LessonList
                key={unit._id}
                unitId={unit._id}
                unitTitle={unit.title}
                totalLessons={unit.totalLessonVideos}
                isExpanded={expandedUnits.has(unit._id)}
                currentLessonId={currentLessonId}
                userProgress={allUserProgress}
                onToggle={() => toggleUnit(unit._id)}
                onLessonClick={(lessonId: Id<"lessons">) =>
                  handleLessonClick(lessonId, unit._id)
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
                    {embedLoading ? (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-3" />
                          <p className="text-gray-600 text-sm">
                            Carregando vídeo...
                          </p>
                        </div>
                      </div>
                    ) : embedUrl ? (
                      <VideoPlayerWithWatermark
                        embedUrl={embedUrl}
                        userName={
                          user?.fullName || user?.firstName || "Usuário"
                        }
                        userCpf={
                          (user?.publicMetadata?.cpf as string) ||
                          "000.000.000-00"
                        }
                      />
                    ) : (
                      <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
                        <p className="text-red-600 text-sm">
                          Erro ao carregar vídeo
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-6">
                    <div className="text-center">
                      <PlayCircleIcon
                        size={64}
                        className="text-white/50 mb-2"
                      />
                      <p className="text-white/70 text-sm">
                        Vídeo ainda não disponível
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: Tabs with lesson info and units */}
              <div className="md:hidden px-6 pb-8">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="units">Unidades</TabsTrigger>
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

                    {user?.id && currentLessonId && currentUnitId && (
                      <Feedback
                        userId={user.id}
                        lessonId={currentLessonId}
                        unitId={currentUnitId}
                      />
                    )}
                  </TabsContent>

                  {/* Tab 2: Módulos */}
                  <TabsContent value="units" className="mt-4 pb-8">
                    <div className="space-y-2">
                      {units.map((unit) => (
                        <LessonList
                          key={unit._id}
                          unitId={unit._id}
                          unitTitle={unit.title}
                          totalLessons={unit.totalLessonVideos}
                          isExpanded={expandedUnits.has(unit._id)}
                          currentLessonId={currentLessonId}
                          userProgress={allUserProgress}
                          onToggle={() => toggleUnit(unit._id)}
                          onLessonClick={(lessonId: Id<"lessons">) =>
                            handleLessonClick(lessonId, unit._id)
                          }
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Desktop: Lesson info (no tabs) */}
              <div className="hidden md:block px-6">
                {/* Título e Descrição */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-3">
                    {currentLesson.title}
                  </h2>
                  <p className="text-base text-muted-foreground mb-6">
                    {currentLesson.description}
                  </p>
                </div>

                {/* Layout de 2 colunas: Feedback à esquerda, Actions + Rating à direita */}
                <div className="flex gap-6 items-stretch">
                  {/* Coluna Esquerda: Feedback */}
                  <div className="flex-1 flex">
                    {user?.id && currentLessonId && currentUnitId && (
                      <Feedback
                        userId={user.id}
                        lessonId={currentLessonId}
                        unitId={currentUnitId}
                      />
                    )}
                  </div>

                  {/* Coluna Direita: Action Buttons + Rating */}
                  <div className="flex flex-col gap-4 w-auto min-w-[200px] shrink-0">
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleMarkCompleted}
                          variant={isLessonCompleted ? "outline" : "default"}
                          className={cn(
                            "flex-1 lg:flex-none lg:min-w-[160px]",
                            isLessonCompleted &&
                              "bg-white text-green-600 hover:bg-green-50 border-green-600 border-2",
                          )}
                        >
                          <CheckCircleIcon
                            size={18}
                            className={cn(
                              "mr-2",
                              isLessonCompleted && "text-green-600",
                            )}
                          />
                          {isLessonCompleted
                            ? "Concluída"
                            : "Marcar como concluída"}
                        </Button>
                        <Button
                          onClick={handleToggleFavorite}
                          variant="outline"
                          className="shrink-0"
                        >
                          <StarIcon
                            size={18}
                            className={cn(
                              isFavorited && "fill-yellow-500 text-yellow-500",
                            )}
                          />
                        </Button>
                      </div>
                      <Button
                        onClick={handleNextLesson}
                        variant="outline"
                        className="w-full lg:w-auto lg:min-w-[160px]"
                      >
                        Próxima aula
                        <ChevronRightIcon size={18} className="ml-2" />
                      </Button>
                    </div>

                    {/* Rating */}
                    {user?.id && currentLessonId && currentUnitId && (
                      <div className="border-t pt-4">
                        <Rating
                          userId={user.id}
                          lessonId={currentLessonId}
                          unitId={currentUnitId}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile: Show units list when no lesson selected */}
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

                {/* Units List */}
                <div className="px-6 py-6 pb-8 space-y-2">
                  {units.map((unit) => (
                    <LessonList
                      key={unit._id}
                      unitId={unit._id}
                      unitTitle={unit.title}
                      totalLessons={unit.totalLessonVideos}
                      isExpanded={expandedUnits.has(unit._id)}
                      currentLessonId={currentLessonId}
                      userProgress={allUserProgress}
                      onToggle={() => toggleUnit(unit._id)}
                      onLessonClick={(lessonId: Id<"lessons">) =>
                        handleLessonClick(lessonId, unit._id)
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
