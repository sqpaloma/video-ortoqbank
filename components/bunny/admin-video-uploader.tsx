"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadVideoToBunny } from "@/app/actions/bunny";
import { Upload } from "lucide-react";

interface AdminVideoUploaderProps {
  lessonTitle: string;
  onSuccess?: (videoData: { videoId: string; libraryId: string }) => void;
}

export default function AdminVideoUploader({
  lessonTitle,
  onSuccess,
}: AdminVideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("video/")) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de vídeo",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5GB limit)
      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast({
          title: "Erro",
          description: "O arquivo é muito grande (máximo 5GB)",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de vídeo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create video in Bunny
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
        ".convex.cloud",
        ".convex.site",
      );

      const createResponse = await fetch(`${convexUrl}/bunny/create-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          description: "",
          isPrivate: true,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Falha ao criar vídeo");
      }

      const { videoId, libraryId } = await createResponse.json();

      // Step 2: Upload file via Server Action
      const formData = new FormData();
      formData.append("videoId", videoId);
      formData.append("libraryId", libraryId);
      formData.append("file", file);

      const uploadResult = await uploadVideoToBunny(formData);

      console.log("Upload result:", uploadResult);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Falha no upload");
      }

      toast({
        title: "Sucesso",
        description: "Vídeo enviado! O Bunny está processando.",
      });

      if (onSuccess) {
        onSuccess({
          videoId,
          libraryId,
        });
      }

      // Reset form
      setFile(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro no upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Vídeo</CardTitle>
        <CardDescription>
          Selecione o arquivo de vídeo para a aula:{" "}
          <strong>{lessonTitle}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input */}
          <div>
            <label className="text-sm font-medium">Arquivo de Vídeo</label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="mt-1"
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-2">
                📁 {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isUploading || !file}
            className="w-full"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Fazer Upload
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
