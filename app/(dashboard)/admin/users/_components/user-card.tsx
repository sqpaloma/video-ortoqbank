"use client";

import Image from "next/image";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface UserCardProps {
  user: Doc<"users">;
  onSetRole: (userId: Id<"users">, role: string) => void;
  onRemoveRole: (userId: Id<"users">) => void;
  isLoading: boolean;
}

export function UserCard({
  user,
  onSetRole,
  onRemoveRole,
  isLoading,
}: UserCardProps) {
  const email = user.email;
  const role = user.role;

  return (
    <div className="rounded-lg border p-4 shadow-sm bg-white transition-all hover:shadow-md">
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
          <p className="text-muted-foreground text-wrap">{email}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-muted-foreground text-sm font-medium">
          Cargo Atual:
        </span>
        <span
          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${role === "admin"
            ? "bg-brand-blue/10 text-brand-blue/90 dark:bg-brand-blue/30 dark:text-brand-blue/40"
            : role === "user"
              ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
            }`}
        >
          {role === "admin" ? "Administrador" : "Usuário"}
        </span>
      </div>

      <div className={`flex gap-2 ${role === "admin" ? "justify-end" : ""}`}>
        {role === "admin" ? (
          <Button
            onClick={() => onRemoveRole(user._id)}
            variant="destructive"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Remover Cargo"}
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onSetRole(user._id, "admin")}
              className="bg-brand-blue text-white hover:bg-brand-blue/90 focus:ring-brand-blue"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Tornar Admin"}
            </Button>

            <Button
              onClick={() => onSetRole(user._id, "user")}
              variant="outline"
              size="sm"
              disabled={role === "user" || isLoading}
            >
              {isLoading ? "Carregando..." : "Tornar Usuário"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
