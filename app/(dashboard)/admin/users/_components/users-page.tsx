"use client";

import { useState } from "react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SearchUsers } from "./search-users";
import { UserCard } from "./user-card";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useTenantQuery, useTenantMutation } from "@/hooks/use-tenant-convex";

export function UsersPage() {
  // Use tenant-scoped mutation to update member roles
  const updateMemberRole = useTenantMutation(api.tenants.updateMemberRole);
  const [loadingUsers, setLoadingUsers] = useState<Set<Id<"tenantMemberships">>>(new Set());

  // Use tenant-scoped query to get only users that belong to this tenant
  const users = useTenantQuery(api.users.getTenantUsers, { limit: 100 });
  const { state } = useSidebar();

  const handleSetRole = async (membershipId: Id<"tenantMemberships">, role: "member" | "admin") => {
    setLoadingUsers((prev) => new Set(prev).add(membershipId));
    try {
      await updateMemberRole({ membershipId, role });
    } catch (error) {
      console.error("Error setting role:", error);
    } finally {
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  const handleRemoveRole = async (membershipId: Id<"tenantMemberships">) => {
    setLoadingUsers((prev) => new Set(prev).add(membershipId));
    try {
      // Demote to member instead of removing
      await updateMemberRole({ membershipId, role: "member" });
    } catch (error) {
      console.error("Error removing role:", error);
    } finally {
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  if (!users) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-white hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b ">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          </div>
        </div>
      </div>

      <div className="p-4"></div>
      <SearchUsers />

      <div className="mt-4 px-4 sm:px-12 md:px-24">
        <p className="text-muted-foreground text-sm">
          Mostrando todos os {users?.length || 0} usuário
          {users?.length === 1 ? "" : "s"}
        </p>
      </div>

      {users && users.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-12 md:px-24">
          {users.map((user) => (
            <UserCard
              key={user.clerkUserId}
              user={user}
              onSetRole={handleSetRole}
              onRemoveRole={handleRemoveRole}
              isLoading={loadingUsers.has(user.membershipId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
