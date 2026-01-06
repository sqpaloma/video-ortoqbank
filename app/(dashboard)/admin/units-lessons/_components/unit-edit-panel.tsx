"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";
import { UnitEditPanelProps } from "./types";

export function UnitEditPanel({
  unit,
  categories,
  onSave,
  onCancel,
}: UnitEditPanelProps) {
  const [categoryId, setCategoryId] = useState<string>(unit.categoryId);
  const [title, setTitle] = useState(unit.title);
  const [description, setDescription] = useState(unit.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when unit changes
  useEffect(() => {
    setCategoryId(unit.categoryId);
    setTitle(unit.title);
    setDescription(unit.description);
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        categoryId: categoryId as Id<"categories">,
        title,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Editar Unidade</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Atualize as informações da unidade abaixo
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-unit-category">Categoria *</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="edit-unit-category">
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
              <Label htmlFor="edit-unit-title">Título *</Label>
              <Input
                id="edit-unit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unit-description">Descrição *</Label>
              <Textarea
                id="edit-unit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 ">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
