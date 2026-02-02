"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/src/hooks/use-toast";
import { useErrorModal } from "@/src/hooks/use-error-modal";
import { ErrorModal } from "@/src/components/ui/error-modal";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  useTenantMutation,
  useTenantReady,
} from "@/src/hooks/use-tenant-convex";

interface UnitFormProps {
  categories: Doc<"categories">[];
  onSuccess?: () => void;
}

export function UnitForm({ categories, onSuccess }: UnitFormProps) {
  const isTenantReady = useTenantReady();
  const createUnit = useTenantMutation(api.units.create);
  const { toast } = useToast();
  const { error, showError, hideError } = useErrorModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?._id || "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTenantReady) {
      showError("Tenant not loaded", "Error");
      return;
    }
    setIsSubmitting(true);

    try {
      await createUnit({
        categoryId: categoryId as Id<"categories">,
        title,
        description,
      });

      toast({
        title: "✅ Unidade criada com sucesso!",
        description: `${title} foi criada.`,
      });

      setTitle("");
      setDescription("");
      setCategoryId(categories[0]?._id || "");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "Erro ao criar unidade",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-unit-category">Categoria *</Label>
          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            disabled={isSubmitting}
          >
            <SelectTrigger id="create-unit-category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-unit-title">Título *</Label>
          <Input
            id="create-unit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
            placeholder="Nome da unidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-unit-description">Descrição *</Label>
          <Textarea
            id="create-unit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            required
            rows={4}
            placeholder="Descrição da unidade"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Unidade"}
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
