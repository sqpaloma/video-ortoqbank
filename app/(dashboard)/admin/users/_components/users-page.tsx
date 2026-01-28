"use client";

import { useState } from "react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SearchUsers } from "./search-users";
import { UserCard } from "./user-card";
import {
  useTenantPaginatedQuery,
  useTenantMutation,
} from "@/hooks/use-tenant-convex";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function UsersPage() {
  // Use tenant-scoped mutation to update member roles
  const updateMemberRole = useTenantMutation(api.tenants.updateMemberRole);
  const [loadingUsers, setLoadingUsers] = useState<
    Set<Id<"tenantMemberships">>
  >(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Get current user to prevent self-demotion
  const { user: currentUser } = useCurrentUser();

  // Use tenant-scoped paginated query with 12 users per page
  const { results, status, loadMore, isLoading } = useTenantPaginatedQuery(
    api.users.getTenantUsersPaginated,
    { search: searchTerm || undefined },
    { initialNumItems: 12 },
  );

  const handleSetRole = async (
    membershipId: Id<"tenantMemberships">,
    role: "member" | "admin",
  ) => {
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="min-h-screen relative">
        <div className="border-b">
          <div className="p-4 pt-12 flex items-center pl-14 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          </div>
        </div>
      </div>

      {/* Content with standardized padding */}
      <div className="p-12 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <div className="mb-6">
            <SearchUsers onSearch={handleSearch} />
          </div>

          {/* Users grid */}
          {results && results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-12">
              {results.map((user) => (
                <UserCard
                  key={user.clerkUserId}
                  user={user}
                  onSetRole={handleSetRole}
                  onRemoveRole={handleRemoveRole}
                  isLoading={loadingUsers.has(user.membershipId)}
                  isCurrentUser={currentUser?._id === user._id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {(!results || results.length === 0) && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "Nenhum usuário encontrado para esta busca."
                : "Nenhum usuário encontrado."}
            </div>
          )}

          {/* Load more button */}
          {status === "CanLoadMore" && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => loadMore(12)} variant="outline" size="lg">
                Ver mais
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {status === "LoadingMore" && (
            <div className="flex justify-center mt-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
