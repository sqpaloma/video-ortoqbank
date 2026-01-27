"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";

interface LogoCardProps {
  logoUrl: string;
  onLogoUrlChange: (value: string) => void;
  onUploadStateChange: (isUploading: boolean) => void;
}

export function LogoCard({
  logoUrl,
  onLogoUrlChange,
  onUploadStateChange,
}: LogoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="max-w-md">
            <ImageUpload
              value={logoUrl}
              onChange={onLogoUrlChange}
              folder="/tenants"
              id="tenant-logo-upload"
              onUploadStateChange={onUploadStateChange}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Recomendado: imagem quadrada PNG ou SVG com fundo transparente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
