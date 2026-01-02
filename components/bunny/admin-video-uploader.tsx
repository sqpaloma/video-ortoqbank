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
import { useErrorModal } from "@/hooks/use-error-modal";
import { useBunnyUpload } from "@/hooks/use-bunny-upload";
import { ErrorModal } from "@/components/ui/error-modal";
import { Upload } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface AdminVideoUploaderProps {
  lessonTitle: string;
  onSuccess?: (videoData: { videoId: string; libraryId: string }) => void;
}

export default function AdminVideoUploader({
  lessonTitle,
  onSuccess,
}: AdminVideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const { uploadVideo, isUploading } = useBunnyUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        showError(
          "Por favor, selecione um arquivo de vídeo",
          "Arquivo inválido",
        );
        return;
      }

      const maxSize = 5 * 1024 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        showError(
          "O arquivo é muito grande (máximo 5GB)",
          "Arquivo muito grande",
        );
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showError("Selecione um arquivo de vídeo", "Arquivo não selecionado");
      return;
    }

    if (!user?.id) {
      showError("Usuário não autenticado", "Erro de autenticação");
      return;
    }

    try {
      const result = await uploadVideo(file, lessonTitle, user.id);

      toast({
        title: "Sucesso",
        description: "Vídeo enviado! O Bunny está processando.",
      });

      if (onSuccess) {
        onSuccess(result);
      }

      setFile(null);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro no upload",
        "Erro no upload",
      );
    }
  };

  return (
    <>
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

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </>
  );
}
