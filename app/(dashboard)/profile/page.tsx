"use client";

import ProfileInner from "./_components/profile-inner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const { user } = useUser();
  
  // Get current user data from Convex
  const userData = useQuery(api.users.current);
  
  // Get user's global progress
  const globalProgress = useQuery(
    api.progress.getGlobalProgress,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Get recent views with details
  const recentViews = useQuery(
    api.recentViews.getRecentViewsWithDetails,
    user?.id ? { userId: user.id, limit: 5 } : "skip"
  );

  // Get all completed lessons count
  const completedLessons = useQuery(
    api.progress.getCompletedLessons,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get content stats for total count
  const contentStats = useQuery(api.contentStats.get);

  if (!user || userData === undefined || globalProgress === undefined || recentViews === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileInner
      userData={userData}
      globalProgress={globalProgress}
      recentViews={recentViews}
      completedCount={completedLessons?.length || 0}
      totalLessons={contentStats?.totalLessons || 0}
    />
  );
}

