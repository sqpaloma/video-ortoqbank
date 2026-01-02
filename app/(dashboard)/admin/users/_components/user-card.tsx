"use client";

import Image from "next/image";
import { Doc, Id } from "@/convex/_generated/dataModel";

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
    <div className="rounded-lg border p-4 shadow-sm transition-all hover:shadow-md">
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
          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            role === "admin"
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
          <button
            onClick={() => onRemoveRole(user._id)}
            className="inline-flex h-8 items-center rounded-md border border-red-200 px-3 text-xs font-medium text-red-900 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:border-red-900/30 dark:text-red-600 dark:hover:bg-red-900/20"
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Remover Cargo"}
          </button>
        ) : (
          <>
            <button
              onClick={() => onSetRole(user._id, "admin")}
              className="inline-flex h-8 items-center rounded-md border border-transparent bg-brand-blue px-3 text-xs font-medium text-white hover:bg-brand-blue/90 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Tornar Admin"}
            </button>

            <button
              onClick={() => onSetRole(user._id, "user")}
              className="hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              disabled={role === "user" || isLoading}
            >
              {isLoading ? "Carregando..." : "Tornar Usuário"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
