"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTenantQuery, useTenantReady } from "@/hooks/use-tenant-convex";

export default function CategoryProgress() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const userId = user?.clerkUserId;
  const isTenantReady = useTenantReady();

  // Get categories with progress
  const categoriesWithProgress = useTenantQuery(
    api.progress.queries.getCategoriesWithProgress,
    userId ? { userId } : "skip",
  );

  // Show loading skeleton while data is loading
  const isLoading =
    categoriesWithProgress === undefined || isUserLoading || !isTenantReady;

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Progresso por Categoria</CardTitle>
          <CardDescription>Seu progresso em cada categoria</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                <Skeleton className="w-24 h-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (!categoriesWithProgress || categoriesWithProgress.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Progresso por Categoria</CardTitle>
          <CardDescription>Seu progresso em cada categoria</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <FolderOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma categoria disponível.</p>
            <p className="text-sm text-gray-400 mt-2">
              As categorias aparecerão aqui quando estiverem disponíveis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Progresso por Categoria</CardTitle>
        <CardDescription>Seu progresso em cada categoria</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {/* Scrollable area - shows ~3 items, scroll for more */}
        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
          {categoriesWithProgress.map((category) => {
            const progressColor =
              category.progressPercent === 100
                ? "text-green-600"
                : category.progressPercent > 0
                  ? "text-blue-600"
                  : "text-gray-500";

            return (
              <div
                key={category._id}
                onClick={() => router.push(`/units/${category._id}`)}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              >
                {/* Category Image - same size as recent lessons thumbnail */}
                <div className="w-24 h-16 rounded bg-muted flex items-center justify-center relative overflow-hidden shrink-0">
                  {category.iconUrl ? (
                    <Image
                      src={category.iconUrl}
                      alt={category.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <PlayCircle className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${progressColor}`}>
                    {category.title}
                  </h4>

                  {/* Progress Bar */}
                  <div className="mt-1">
                    <Progress
                      value={category.progressPercent}
                      className="h-2"
                    />
                  </div>

                  {/* Progress Text */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {category.completedLessons} de {category.totalLessons}{" "}
                      {category.totalLessons === 1 ? "aula" : "aulas"}
                    </span>
                    <span className={`text-xs font-medium ${progressColor}`}>
                      {category.progressPercent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
