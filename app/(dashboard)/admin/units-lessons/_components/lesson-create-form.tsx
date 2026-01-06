"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/components/ui/image-upload";

interface LessonFormProps {
  units: Doc<"units">[];
  onSuccess?: () => void;
}

export function LessonForm({ units, onSuccess }: LessonFormProps) {
  const createLesson = useMutation(api.lessons.create);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [unitId, setUnitId] = useState<string>(units[0]?._id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!unitId) {
        showError(
          "Selecione uma unidade antes de criar a aula",
          "Unidade não selecionada",
        );
        setIsSubmitting(false);
        return;
      }

      await createLesson({
        unitId: unitId as Id<"units">,
        title,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
        durationSeconds: 0,
        isPublished: false,
      });

      toast({
        title: "✅ Aula criada com sucesso!",
        description: `${title} foi criada.`,
      });

      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setUnitId(units[0]?._id || "");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao criar aula",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-lesson-unit">Unidade *</Label>
          <Select
            value={unitId}
            onValueChange={setUnitId}
            disabled={isSubmitting}
          >
            <SelectTrigger id="create-lesson-unit">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit._id} value={unit._id}>
                  {unit.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-lesson-title">Título *</Label>
          <Input
            id="create-lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
            placeholder="Nome da aula"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-lesson-description">Descrição *</Label>
          <Textarea
            id="create-lesson-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            required
            rows={4}
            placeholder="Descrição da aula"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-lesson-thumbnail">Thumbnail (Opcional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Imagem que aparecerá nos favoritos, vídeos relacionados e
            visualizações recentes
          </p>
          <ImageUpload
            id="create-lesson-thumbnail"
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            onRemove={() => setThumbnailUrl("")}
            disabled={isSubmitting}
            folder="/lessons"
            onUploadStateChange={setIsUploadingImage}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !unitId || isUploadingImage}
          >
            {isSubmitting
              ? "Criando..."
              : isUploadingImage
                ? "Aguarde o upload..."
                : "Criar Aula"}
          </Button>
        </div>
      </form>

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </>
  );
}
