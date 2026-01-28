"use client";

import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import RecentViews from "./recent-views";
import UserInfos from "./user-infos";
import Dashboard from "./dashboard";
import CategoryProgress from "./category-progress";

interface ProfilePageProps {
  preloadedRecentViews: Preloaded<
    typeof api.recentViews.getRecentViewsWithDetails
  > | null;
}

export default function ProfilePage({
  preloadedRecentViews,
}: ProfilePageProps) {
  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="border-b ">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 pb-24 md:pb-8 space-y-6">
        {/* User Info Card */}
        <UserInfos />

        {/* Stats Overview */}
        <Dashboard />

        {/* Two-column layout: Recent Views + Category Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Recent Views */}
          <RecentViews preloadedRecentViews={preloadedRecentViews} />

          {/* Category Progress */}
          <CategoryProgress />
        </div>
      </div>
    </div>
  );
}
