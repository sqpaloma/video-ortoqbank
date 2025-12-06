"use client";

import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserInfosProps {
  preloadedUserData: Preloaded<typeof api.users.current>;
}

export default function UserInfos({ preloadedUserData }: UserInfosProps) {
  // Use preloaded query instead of regular query
  const userData = usePreloadedQuery(preloadedUserData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {userData?.imageUrl ? (
            <Image
              src={userData.imageUrl}
              alt={`${userData.firstName} ${userData.lastName}`}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <CardTitle className="text-2xl">
              {userData ? `${userData.firstName} ${userData.lastName}` : "Usuário"}
            </CardTitle>
            <CardDescription>{userData?.email || ""}</CardDescription>
            {userData?.role === "admin" && (
              <Badge variant="default" className="mt-2">
                Administrador
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
