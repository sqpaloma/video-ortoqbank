"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useErrorModal } from "@/hooks/use-error-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  folder?: string;
  id?: string;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  folder = "/categories",
  id = "image-upload",
  onUploadStateChange,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error, showError, hideError } = useErrorModal();

  useEffect(() => {
    console.log("🖼️ ImageUpload recebeu value:", value);
    setPreviewUrl(value || "");
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Por favor, selecione apenas imagens", "Arquivo inválido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("A imagem deve ter no máximo 5MB", "Arquivo muito grande");
      return;
    }

    try {
      setIsUploading(true);
      if (onUploadStateChange) {
        onUploadStateChange(true);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      const authResponse = await fetch("/api/imagekit/auth");

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || "Erro ao obter autenticação");
      }

      const authData = await authResponse.json();

      if (!authData.token || !authData.signature || authData.expire == null) {
        throw new Error("Dados de autenticação incompletos");
      }

      const publicKey = authData.publicKey;
      if (!publicKey) {
        throw new Error(
          "Chave pública do ImageKit não configurada. Verifique a variável IMAGEKIT_PUBLIC_KEY no .env",
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("folder", folder);
      formData.append("token", authData.token);
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire.toString());
      formData.append("publicKey", publicKey);

      console.log("[ImageUpload] Sending upload to ImageKit...", {
        fileName: file.name,
        folder,
        token: authData.token.substring(0, 8) + "...",
        expire: authData.expire,
        signatureLength: authData.signature.length,
      });

      const uploadResponse = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json();

      console.log("[ImageUpload] ImageKit response:", {
        status: uploadResponse.status,
        ok: uploadResponse.ok,
        data: uploadResponse.ok ? { url: uploadData.url } : uploadData,
      });

      if (!uploadResponse.ok) {
        // Log detailed error for debugging
        console.error("[ImageUpload] Upload failed:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          response: uploadData,
        });

        // Handle specific error codes
        let errorMessage: string;
        if (uploadResponse.status === 403) {
          errorMessage =
            "Erro de autenticação com ImageKit (403). " +
            "Verifique se as chaves IMAGEKIT_PRIVATE_KEY e IMAGEKIT_PUBLIC_KEY estão corretas e correspondem à mesma conta.";
          console.error(
            "[ImageUpload] 403 Error - Possible causes:",
            "\n1. Invalid or mismatched API keys",
            "\n2. Expired authentication token",
            "\n3. Account storage limit exceeded",
            "\n4. Advanced security settings blocking the request",
          );
        } else if (uploadResponse.status === 401) {
          errorMessage = "Chave pública ou privada do ImageKit inválida (401).";
        } else {
          errorMessage =
            uploadData.message ||
            uploadData.error ||
            `Erro ${uploadResponse.status}: ${uploadResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const imageUrl = uploadData.url;
      onChange(imageUrl);
      setPreviewUrl(imageUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      showError(
        `${errorMessage}\n\nVerifique se as variáveis de ambiente do ImageKit estão configuradas.`,
        "Erro ao fazer upload",
      );
      setPreviewUrl(value || "");
    } finally {
      setIsUploading(false);
      if (onUploadStateChange) {
        onUploadStateChange(false);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onChange("");
    if (onRemove) onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
          id={id}
        />

        {previewUrl ? (
          <div className="relative w-full h-28 border-2 border-dashed rounded-lg overflow-hidden bg-muted">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-contain"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <label
            htmlFor={id}
            className={`
              flex flex-col items-center justify-center w-full h-28
              border-2 border-dashed rounded-lg cursor-pointer
              bg-muted hover:bg-muted/80 transition-colors
              ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <div className="flex flex-col items-center justify-center py-3">
              {isUploading ? (
                <>
                  <Upload className="w-7 h-7 mb-1.5 text-muted-foreground animate-bounce" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-7 h-7 mb-1.5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para upload</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PNG, JPG, GIF (MAX. 5MB)
                  </p>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </>
  );
}
