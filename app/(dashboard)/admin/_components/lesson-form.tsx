"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VideoIcon, CheckCircle2Icon } from "lucide-react";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Id, Doc } from "@/convex/_generated/dataModel";

const formSchema = z.object({
  moduleId: z.string().min(1, "Selecione um módulo"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  lessonNumber: z.number().min(1, "Número da aula deve ser maior que 0"),
  tags: z.string().optional(),
  videoId: z.string().optional(),
});

interface LessonFormProps {
  modules: Doc<"modules">[];
}

export function LessonForm({ modules }: LessonFormProps) {
  const createLesson = useMutation(api.lessons.create);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLessonId, setCreatedLessonId] = useState<Id<"lessons"> | null>(
    null,
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleId: "",
      title: "",
      description: "",
      lessonNumber: 1,
      tags: "",
      videoId: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const lessonId = await createLesson({
        moduleId: data.moduleId as Id<"modules">,
        title: data.title,
        description: data.description,
        lessonNumber: data.lessonNumber,
        isPublished: false,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        videoId: data.videoId || undefined,
      });

      setCreatedLessonId(lessonId);

      toast({
        title: "✅ Aula criada com sucesso!",
        description: `${data.title} foi criada. ${data.videoId ? "Vídeo vinculado!" : "Agora você pode fazer upload do vídeo."}`,
      });

      form.reset();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao criar aula"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VideoIcon className="h-5 w-5" />
          Criar Nova Aula
        </CardTitle>
        <CardDescription>
          Preencha os dados da aula. Você poderá fazer upload do vídeo após
          criar a aula.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            {/* Module Selection */}
            <Controller
              name="moduleId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Módulo</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module._id} value={module._id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Título da Aula</FieldLabel>
                  <Input
                    {...field}
                    placeholder="Ex: Introdução à Anatomia do Joelho"
                    autoComplete="off"
                  />
                 
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Descrição</FieldLabel>
                  <Textarea
                    {...field}
                    placeholder="Descreva o conteúdo da aula..."
                    rows={4}
                    className="resize-none"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Video ID (optional - will be added after upload) */}
            <Controller
              name="videoId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Video ID (opcional)</FieldLabel>
                  <Input
                    {...field}
                    placeholder="Deixe em branco se for fazer upload depois"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    ID do vídeo já existente no Bunny (se houver)
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Limpar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                "Criando..."
              ) : createdLessonId ? (
                <>
                  <CheckCircle2Icon className="mr-2 h-4 w-4" />
                  Aula Criada!
                </>
              ) : (
                "Criar Aula"
              )}
            </Button>
          </div>
        </form>

        {createdLessonId && (
          <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✅ Aula criada com sucesso! Agora você pode fazer upload do vídeo
              na lista de aulas abaixo.
            </p>
          </div>
        )}
      </CardContent>

      <ErrorModal
        open={error.isOpen}
        onOpenChange={hideError}
        title={error.title}
        message={error.message}
      />
    </Card>
  );
}
