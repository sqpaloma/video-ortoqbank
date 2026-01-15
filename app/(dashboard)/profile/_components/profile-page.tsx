"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import RecentViews from "./recent-views";
import UserInfos from "./user-infos";
import Dashboard from "./dashboard";

interface ProfilePageProps {
  preloadedRecentViews: Preloaded<
    typeof api.recentViews.getRecentViewsWithDetails
  > | null;
}

export default function ProfilePage({
  preloadedRecentViews,
}: ProfilePageProps) {
  const { state } = useSidebar();

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-brand-blue hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

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

        {/* Recent Views */}
        <RecentViews preloadedRecentViews={preloadedRecentViews} />
      </div>
    </div>
  );
}
