"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, PlayCircle, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Dashboard() {
  // Get current user
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const userId = user?.clerkUserId;

  // Use regular queries - all hooks called unconditionally
  const contentStats = useQuery(api.aggregate.get, {});
  const completedCountResult = useQuery(
    api.progress.queries.getCompletedPublishedLessonsCount,
    userId ? { userId } : "skip",
  );
  const viewedCountResult = useQuery(
    api.recentViews.getUniqueViewedLessonsCount,
    userId ? { userId } : "skip",
  );

  // Show loading skeleton while data is loading
  const isLoading = contentStats === undefined || isUserLoading;

  const totalLessons = contentStats?.totalLessons || 0;
  const completedLessonsCount = completedCountResult ?? 0;
  const viewedCount = viewedCountResult ?? 0;

  // Calculate progress dynamically: (completed published / total published) * 100
  // Note: Both numerator and denominator only count PUBLISHED lessons
  // - completedLessonsCount: completed lessons that are still published
  // - totalLessons: total published lessons in the system
  // This ensures progress is based only on currently available content
  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

  // Show loading skeleton while data is loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aulas Concluídas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progresso Geral
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aulas Visualizadas
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aulas Concluídas
          </CardTitle>
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
          <CardTitle className="text-sm font-medium">
            Aulas Visualizadas
          </CardTitle>
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
