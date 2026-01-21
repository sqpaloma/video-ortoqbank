"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useErrorModal } from "@/hooks/use-error-modal";
import { ErrorModal } from "@/components/ui/error-modal";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { CheckCircle2Icon, FolderPlusIcon } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useTenantMutation, useTenantReady } from "@/hooks/use-tenant-convex";
import { useRef, useEffect } from "react";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  iconUrl: z
    .string()
    .url("URL do ícone deve ser válida")
    .or(z.literal(""))
    .optional(),
});

interface CategoryFormProps {
  onSuccess?: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isTenantReady = useTenantReady();
  const createCategory = useTenantMutation(api.categories.create);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCategory, setCreatedCategory] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      iconUrl: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!isTenantReady) {
      showError("Tenant não encontrado", "Erro de configuração");
      return;
    }

    setIsSubmitting(true);
    // Clear any previous success message to avoid showing it alongside errors
    setCreatedCategory(false);

    try {
      await createCategory({
        title: data.title,
        description: data.description,
        iconUrl: data.iconUrl || undefined,
      });

      setCreatedCategory(true);

      toast({
        title: "✅ Categoria criada com sucesso!",
        description: `${data.title} foi criada.`,
      });

      form.reset();

      if (onSuccess) {
        onSuccess();
      }

      // Reset success state after 3 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setCreatedCategory(false);
        }
      }, 3000);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao criar categoria",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FolderPlusIcon className="h-5 w-5" />
          Nova Categoria
        </CardTitle>
        <CardDescription>
          Adicione uma nova categoria ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FieldGroup>
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Título</FieldLabel>
                  <Input
                    {...field}
                    placeholder="Ex: Ciências Básicas em Ortopedia"
                    autoComplete="off"
                    onChange={(e) => {
                      field.onChange(e);
                    }}
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
                  <Input
                    {...field}
                    placeholder="Breve descrição da categoria"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Icon Upload */}
            <Controller
              name="iconUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Ícone da Categoria (opcional)</FieldLabel>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    folder="/categories"
                    id="category-form-image-upload"
                    onUploadStateChange={setIsImageUploading}
                  />
                  {isImageUploading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aguarde o upload da imagem terminar antes de criar...
                    </p>
                  )}
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
              disabled={isSubmitting || isImageUploading}
            >
              Limpar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isImageUploading}
              className="flex-1"
            >
              {isImageUploading ? (
                "Enviando imagem..."
              ) : isSubmitting ? (
                "Criando..."
              ) : createdCategory ? (
                <>
                  <CheckCircle2Icon className="mr-2 h-4 w-4" />
                  Categoria Criada!
                </>
              ) : (
                "Criar Categoria"
              )}
            </Button>
          </div>
        </form>

        {createdCategory && (
          <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 p-2">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✅ Categoria criada com sucesso!
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
