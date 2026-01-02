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

interface UnitFormProps {
  categories: Doc<"categories">[];
  onSuccess?: () => void;
}

export function UnitForm({ categories, onSuccess }: UnitFormProps) {
  const createUnit = useMutation(api.units.create);
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
