"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  folder?: string;
  id?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  folder = "/categories",
  id = "image-upload",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync previewUrl with value prop when it changes externally
  useEffect(() => {
    setPreviewUrl(value || "");
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas imagens");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get authentication parameters from backend
      const authResponse = await fetch("/api/imagekit/auth");
      
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || "Erro ao obter autenticação");
      }
      
      const authData = await authResponse.json();

      // Get public key from the API response (from IMAGEKIT_PUBLIC_KEY in .env)
      const publicKey = authData.publicKey;
      if (!publicKey) {
        throw new Error("Chave pública do ImageKit não configurada. Verifique a variável IMAGEKIT_PUBLIC_KEY no .env");
      }

      // Upload to ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("folder", folder);
      formData.append("token", authData.token);
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire.toString());
      formData.append("publicKey", publicKey);

      const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        console.error("Erro no upload do ImageKit:", uploadData);
        throw new Error(uploadData.message || "Erro ao fazer upload da imagem");
      }

      const imageUrl = uploadData.url;

      onChange(imageUrl);
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error("Erro no upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao fazer upload da imagem: ${errorMessage}\n\nVerifique se as variáveis de ambiente do ImageKit estão configuradas.`);
      setPreviewUrl(value || "");
    } finally {
      setIsUploading(false);
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
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
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
  );
}
