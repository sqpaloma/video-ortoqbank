"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

interface PreviewCardProps {
  logoUrl: string;
  displayName: string;
  tenantName: string;
}

export function PreviewCard({
  logoUrl,
  displayName,
  tenantName,
}: PreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 p-4 bg-blue-brand rounded-lg">
          {logoUrl ? (
            <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white/20">
              <Image src={logoUrl} alt="Logo" fill className="object-contain" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {(displayName || tenantName || "T")[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-white text-xl font-semibold">
            {displayName || tenantName || "App Name"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
