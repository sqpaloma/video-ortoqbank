"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import RecentViews from "./recent-views";
import UserInfos from "./user-infos";
import Dashboard from "./dashboard";

interface ProfileInnerProps {
  preloadedRecentViews: Preloaded<
    typeof api.recentViews.getRecentViewsWithDetails
  > | null;
}

export default function ProfileInner({
  preloadedRecentViews,
}: ProfileInnerProps) {
  const router = useRouter();
  const { state } = useSidebar();

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/categories")}
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
