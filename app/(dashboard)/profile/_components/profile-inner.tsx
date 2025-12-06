"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import RecentViews from "./recent-views";
import UserInfos from "./user-infos";
import Dashboard from "./dashboard";

interface ProfileInnerProps {
  preloadedUserData: Preloaded<typeof api.users.current>;
  preloadedContentStats: Preloaded<typeof api.contentStats.get>;
  preloadedGlobalProgress: Preloaded<typeof api.progress.getGlobalProgress> | null;
  preloadedCompletedCount: Preloaded<typeof api.progress.getCompletedPublishedLessonsCount> | null;
  preloadedViewedCount: Preloaded<typeof api.recentViews.getUniqueViewedLessonsCount> | null;
  preloadedRecentViews: Preloaded<typeof api.recentViews.getRecentViewsWithDetails> | null;
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
  preloadedUserData,
  preloadedContentStats,
  preloadedGlobalProgress,
  preloadedCompletedCount,
  preloadedViewedCount,
  preloadedRecentViews,
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
        <UserInfos preloadedUserData={preloadedUserData} />

        {/* Stats Overview */}
        <Dashboard
          preloadedContentStats={preloadedContentStats}
          preloadedGlobalProgress={preloadedGlobalProgress}
          preloadedCompletedCount={preloadedCompletedCount}
          preloadedViewedCount={preloadedViewedCount}
        />

        {/* Recent Views */}
        <RecentViews preloadedRecentViews={preloadedRecentViews} />
      </div>
    </div>
  );
}
