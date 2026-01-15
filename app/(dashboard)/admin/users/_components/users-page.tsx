"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { SearchUsers } from "./search-users";
import { UserCard } from "./user-card";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function UsersPage() {
  const setUserRole = useMutation(api.users.setRole);
  const [loadingUsers, setLoadingUsers] = useState<Set<Id<"users">>>(new Set());

  const usersFromAll = useQuery(api.users.getUsers, { limit: 20 });
  const users = usersFromAll;
  const { state } = useSidebar();

  const handleSetRole = async (userId: Id<"users">, role: string) => {
    setLoadingUsers((prev) => new Set(prev).add(userId));
    try {
      await setUserRole({ userId, role: role as "user" | "admin" });
    } catch (error) {
      console.error("Error setting role:", error);
    } finally {
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRemoveRole = async (userId: Id<"users">) => {
    setLoadingUsers((prev) => new Set(prev).add(userId));
    try {
      await setUserRole({ userId, role: undefined });
    } catch (error) {
      console.error("Error removing role:", error);
    } finally {
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
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
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-brand-blue hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${
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

      <div className="mt-4 pl-26 px-1">
        <p className="text-muted-foreground text-sm">
          Mostrando todos os {users?.length || 0} usuário
          {users?.length === 1 ? "" : "s"}
        </p>
      </div>

      {users && users.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 pl-24 lg:grid-cols-4">
          {users.map((user: Doc<"users">) => (
            <UserCard
              key={user.clerkUserId}
              user={user}
              onSetRole={handleSetRole}
              onRemoveRole={handleRemoveRole}
              isLoading={loadingUsers.has(user._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
