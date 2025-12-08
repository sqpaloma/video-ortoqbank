"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, PlayCircle, TrendingUp } from "lucide-react";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DashboardProps {
  preloadedContentStats: Preloaded<typeof api.contentStats.get>;
  preloadedGlobalProgress: Preloaded<typeof api.progress.getGlobalProgress> | null;
  preloadedCompletedCount: Preloaded<typeof api.progress.getCompletedPublishedLessonsCount> | null;
  preloadedViewedCount: Preloaded<typeof api.recentViews.getUniqueViewedLessonsCount> | null;
}

export default function Dashboard({
  preloadedContentStats,
  preloadedGlobalProgress,
  preloadedCompletedCount,
  preloadedViewedCount,
}: DashboardProps) {
  // Use preloaded queries (carregadas no servidor)
  const contentStats = usePreloadedQuery(preloadedContentStats);
  const globalProgress = preloadedGlobalProgress
    ? usePreloadedQuery(preloadedGlobalProgress)
    : null;
  const completedCount = preloadedCompletedCount
    ? usePreloadedQuery(preloadedCompletedCount)
    : 0;
  const viewedCount = preloadedViewedCount
    ? usePreloadedQuery(preloadedViewedCount)
    : 0;

  // Handle loading state - only hide if not authenticated
  if (
    preloadedCompletedCount === null ||
    preloadedViewedCount === null ||
    contentStats === undefined
  ) {
    return null;
  }

  const totalLessons = contentStats?.totalLessons || 0;
  const completedLessonsCount = completedCount || 0;
  
  // Calculate progress dynamically: (completed / total) * 100
  const progressPercent = totalLessons > 0 
    ? Math.round((completedLessonsCount / totalLessons) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aulas Concluídas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedLessonsCount}</div>
          <p className="text-xs text-muted-foreground">
            de {totalLessons} {totalLessons === 1 ? "aula" : "aulas"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progressPercent}%</div>
          <Progress value={progressPercent} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aulas Visualizadas</CardTitle>
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{viewedCount}</div>
          <p className="text-xs text-muted-foreground">
            {viewedCount === 1 ? "aula visualizada" : "aulas visualizadas"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
