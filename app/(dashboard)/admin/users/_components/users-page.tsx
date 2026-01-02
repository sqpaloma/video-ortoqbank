"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { SearchUsers } from "./search-users";
import { UserCard } from "./user-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export function UsersPage() {
  const setUserRole = useMutation(api.users.setRole);
  const [loadingUsers, setLoadingUsers] = useState<Set<Id<"users">>>(new Set());

  const usersFromAll = useQuery(api.users.getUsers, { limit: 20 });
  const users = usersFromAll;

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
    <div className="rounded-lg space-y-6 p-12 md:p-12 md:pl-42 md:pr-42">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Permissões de Usuários</h1>
      </div>

      <SearchUsers />

      <div className="mt-4 px-1">
        <p className="text-muted-foreground text-sm">
          Mostrando todos os {users?.length || 0} usuário
          {users?.length === 1 ? "" : "s"}
        </p>
      </div>

      {users && users.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
