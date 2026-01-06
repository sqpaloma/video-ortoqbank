"use client";

import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

export default function UserInfos() {
  // Get image directly from Clerk (always up-to-date)
  const { user: clerkUser, isLoaded } = useUser();
  // Get role and other business data from Convex
  const userData = useQuery(api.users.current, {});

  // Show stable placeholder while Clerk data is loading
  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Carregando...</CardTitle>
              <CardDescription>Aguarde um momento</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {clerkUser?.imageUrl ? (
            <Image
              src={clerkUser.imageUrl}
              alt={clerkUser.fullName || "Usuário"}
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
              {clerkUser?.fullName || "Usuário"}
            </CardTitle>
            {clerkUser?.primaryEmailAddress?.emailAddress && (
              <CardDescription>
                {clerkUser.primaryEmailAddress.emailAddress}
              </CardDescription>
            )}
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
