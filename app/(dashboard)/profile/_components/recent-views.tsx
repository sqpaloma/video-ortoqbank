"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlayCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { FunctionReturnType } from "convex/server";

type RecentViewsData = FunctionReturnType<
  typeof api.recentViews.getRecentViewsWithDetails
>;

interface RecentViewsProps {
  preloadedRecentViews: Preloaded<
    typeof api.recentViews.getRecentViewsWithDetails
  > | null;
}

// Component that uses preloaded data
function RecentViewsWithPreload({
  preloadedRecentViews,
}: {
  preloadedRecentViews: Preloaded<
    typeof api.recentViews.getRecentViewsWithDetails
  >;
}) {
  const router = useRouter();
  const recentViews = usePreloadedQuery(preloadedRecentViews);

  return <RecentViewsContent recentViews={recentViews} router={router} />;
}

// Component that fetches data at runtime
function RecentViewsWithoutPreload() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const recentViews = useQuery(
    api.recentViews.getRecentViewsWithDetails,
    user ? { userId: user._id, limit: 5 } : "skip",
  );

  // Handle loading state
  if (!user) {
    return null;
  }

  // Handle loading state while data is being fetched
  if (recentViews === undefined) {
    return null;
  }

  return <RecentViewsContent recentViews={recentViews ?? []} router={router} />;
}

// Parent component that conditionally renders based on preloaded data availability
export default function RecentViews({
  preloadedRecentViews,
}: RecentViewsProps) {
  if (preloadedRecentViews) {
    return (
      <RecentViewsWithPreload preloadedRecentViews={preloadedRecentViews} />
    );
  }

  return <RecentViewsWithoutPreload />;
}

// Extracted content component to avoid duplicating the UI logic
function RecentViewsContent({
  recentViews,
  router,
}: {
  recentViews: RecentViewsData;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <>
      {recentViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Recentes</CardTitle>
            <CardDescription>
              Suas aulas visualizadas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentViews.map((view) => {
                const isCompleted = view.isCompleted;
                const textColor = isCompleted
                  ? "text-green-600"
                  : "text-blue-600";
                const iconColor = isCompleted
                  ? "text-green-500"
                  : "text-blue-500";

                return (
                  <div
                    key={view._id}
                    onClick={() => router.push(`/units/${view.category._id}`)}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  >
                    {view.lesson.thumbnailUrl ? (
                      <Image
                        src={view.lesson.thumbnailUrl}
                        alt={view.lesson.title}
                        width={96}
                        height={64}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-24 h-16 rounded bg-muted flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${textColor}`}>
                        {view.lesson.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {view.category.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          {isCompleted ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs border-green-500 bg-green-50 ${textColor}`}
                            >
                              <CheckCircle2
                                className={`h-3 w-3 mr-1 ${iconColor}`}
                              />
                              Concluída
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-xs border-blue-500 bg-blue-50 ${textColor}`}
                            >
                              <PlayCircle
                                className={`h-3 w-3 mr-1 ${iconColor}`}
                              />
                              Iniciada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {recentViews.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Recentes</CardTitle>
            <CardDescription>
              Suas aulas visualizadas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <PlayCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Você ainda não assistiu nenhuma aula.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Comece a explorar as categorias e módulos disponíveis!
              </p>
              <Button
                variant="default"
                className="mt-4"
                onClick={() => router.push("/categories")}
              >
                Explorar Aulas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
