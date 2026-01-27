"use client";

import Image from "next/image";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

// Extended user type that includes tenant-specific fields
interface TenantUser extends Doc<"users"> {
  membershipId: Id<"tenantMemberships">;
  tenantRole: "member" | "admin";
  hasActiveAccess: boolean;
  accessExpiresAt?: number;
}

interface UserCardProps {
  user: TenantUser;
  onSetRole: (
    membershipId: Id<"tenantMemberships">,
    role: "member" | "admin",
  ) => void;
  onRemoveRole: (membershipId: Id<"tenantMemberships">) => void;
  isLoading: boolean;
  isCurrentUser?: boolean;
}

export function UserCard({
  user,
  onSetRole,
  onRemoveRole,
  isLoading,
  isCurrentUser = false,
}: UserCardProps) {
  const email = user.email;
  // Use tenant-specific role for display
  const tenantRole = user.tenantRole;

  return (
    <div className="rounded-lg border p-6 shadow-sm bg-white transition-all hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        {user.imageUrl && (
          <Image
            src={user.imageUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
          />
        )}
        <div>
          <h3 className="font-medium">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-muted-foreground text-wrap text-sm">{email}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-muted-foreground text-sm font-medium">
          Cargo Atual:
        </span>
        <span
          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            tenantRole === "admin"
              ? "bg-brand-blue/10 text-brand-blue/90 dark:bg-brand-blue/30 dark:text-brand-blue/40"
              : "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
          }`}
        >
          {tenantRole === "admin" ? "Administrador" : "Usuário"}
        </span>
        {isCurrentUser && (
          <span className="ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600">
            (Você)
          </span>
        )}
      </div>

      <div
        className={`flex gap-2 ${tenantRole === "admin" ? "justify-end" : ""}`}
      >
        {tenantRole === "admin" ? (
          // Only show remove button if not current user
          !isCurrentUser && (
            <Button
              onClick={() => onRemoveRole(user.membershipId)}
              variant="destructive"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Remover Cargo"}
            </Button>
          )
        ) : (
          <Button
            onClick={() => onSetRole(user.membershipId, "admin")}
            className="bg-brand-blue text-white hover:bg-brand-blue/90 focus:ring-brand-blue"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Tornar Admin"}
          </Button>
        )}
      </div>
    </div>
  );
}
