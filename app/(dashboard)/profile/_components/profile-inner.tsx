"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, PlayCircle, TrendingUp, User, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface ProfileInnerProps {
  userData: {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
    role: "user" | "admin";
    status: "active" | "inactive" | "suspended";
  } | null;
  globalProgress: {
    completedLessonsCount: number;
    progressPercent: number;
    updatedAt: number;
  } | null;
  recentViews: Array<{
    _id: Id<"recentViews">;
    viewedAt: number;
    action: "started" | "resumed" | "completed";
    lesson: {
      _id: Id<"lessons">;
      title: string;
      description: string;
      thumbnailUrl?: string;
      durationSeconds: number;
    };
    module: {
      _id: Id<"modules">;
      title: string;
      categoryId: Id<"categories">;
    };
    category: {
      _id: Id<"categories">;
      title: string;
    };
  }>;
  completedCount: number;
  totalLessons: number;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "agora mesmo";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas atrás`;
  return `${Math.floor(seconds / 86400)} dias atrás`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ProfileInner({
  userData,
  globalProgress,
  recentViews,
  completedCount,
  totalLessons,
}: ProfileInnerProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="p-6 flex items-center gap-4">
          <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
            <p className="text-sm text-gray-600">Seus dados e progresso</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* User Info Card */}
        <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {userData?.imageUrl ? (
              <Image
                src={userData.imageUrl}
                alt={`${userData.firstName} ${userData.lastName}`}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">
                {userData ? `${userData.firstName} ${userData.lastName}` : "Usuário"}
              </CardTitle>
              <CardDescription>{userData?.email || ""}</CardDescription>
              {userData?.role === "admin" && (
                <Badge variant="default" className="mt-2">
                  Administrador
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              de {totalLessons} aulas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalProgress?.progressPercent || 0}%</div>
            <Progress value={globalProgress?.progressPercent || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Visualizadas</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentViews.length}
            </div>
            <p className="text-xs text-muted-foreground">
              aulas recentemente visualizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Views */}
      {recentViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Recentes</CardTitle>
            <CardDescription>Suas aulas visualizadas recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentViews.map((view) => (
                <div
                  key={view._id}
                  onClick={() => router.push(`/modules/${view.category._id}`)}
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
                    <h4 className="font-medium truncate">{view.lesson.title}</h4>
                    <p className="text-sm text-muted-foreground">{view.category.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(view.lesson.durationSeconds)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(view.viewedAt)}
                      </span>
                      {view.action === "completed" && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                      {view.action === "started" && (
                        <Badge variant="outline" className="text-xs">
                          Iniciado
                        </Badge>
                      )}
                      {view.action === "resumed" && (
                        <Badge variant="outline" className="text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {recentViews.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Recentes</CardTitle>
            <CardDescription>Suas aulas visualizadas recentemente</CardDescription>
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
      </div>
    </div>
  );
}
