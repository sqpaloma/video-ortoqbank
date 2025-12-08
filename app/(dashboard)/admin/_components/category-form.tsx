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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { CheckCircle2, FolderPlus } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  iconUrl: z.string().url("URL do ícone deve ser válida").or(z.literal("")).optional(),
});

interface CategoryFormProps {
  onSuccess?: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const createCategory = useMutation(api.categories.create);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCategory, setCreatedCategory] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      iconUrl: "",
    },
  });

  // Auto-gerar slug a partir do título
  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug meets minimum length requirement (3 characters)
    // If the generated slug is too short, use a fallback based on timestamp
    if (slug.length < 3) {
      return `categoria-${Date.now()}`;
    }
    
    return slug;
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Clear any previous success message to avoid showing it alongside errors
    setCreatedCategory(false);
    
    try {
      // Get the next position automatically
      await createCategory({
        title: data.title,
        slug: data.slug,
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
      setTimeout(() => setCreatedCategory(false), 3000);
    } catch (error) {
      toast({
        title: "❌ Erro ao criar categoria",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5" />
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
                      // Auto-generate slug
                      form.setValue("slug", generateSlug(e.target.value));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Hidden slug field - auto-generated from title */}
            <Controller
              name="slug"
              control={form.control}
              render={({ field }) => (
                <input type="hidden" {...field} />
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
                  />
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
              ) : createdCategory ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
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
    </Card>
  );
}

