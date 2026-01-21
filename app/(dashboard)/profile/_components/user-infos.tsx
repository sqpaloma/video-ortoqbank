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
import { useUser } from "@clerk/nextjs";
import { useSession } from "@/components/providers/session-provider";

export default function UserInfos() {
  // Get image directly from Clerk (always up-to-date)
  const { user: clerkUser, isLoaded } = useUser();
  // Get tenant-specific admin status from session
  const { isAdmin, isSuperAdmin } = useSession();

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
            {isSuperAdmin && (
              <Badge variant="destructive" className="mt-2">
                Super Admin
              </Badge>
            )}
            {isAdmin && !isSuperAdmin && (
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
