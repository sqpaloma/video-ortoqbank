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
import { RecentViews } from "./recent-views";

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
    isCompleted: boolean;
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
  viewedCount: number;
  totalLessons: number;
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "agora mesmo";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas atrás`;
  return `${Math.floor(seconds / 86400)} dias atrás`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ProfileInner({
  userData,
  globalProgress,
  recentViews,
  completedCount,
  viewedCount,
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
              {viewedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewedCount === 1 ? "aula visualizada" : "aulas visualizadas"}
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentViews />
      </div>
    </div>
  );
}
