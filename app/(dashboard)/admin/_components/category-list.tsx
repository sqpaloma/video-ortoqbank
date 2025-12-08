"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/components/ui/image-upload";

interface CategoryListProps {
  categories: Doc<"categories">[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);
  const { toast } = useToast();

  const [editingCategory, setEditingCategory] = useState<Id<"categories"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from title
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

  const handleEdit = (category: {
    _id: Id<"categories">;
    title: string;
    slug: string;
    description: string;
    position: number;
    iconUrl?: string;
  }) => {
    setEditingCategory(category._id);
    setEditTitle(category.title);
    setEditDescription(category.description);
    // Ensure iconUrl is set correctly, even if it's undefined
    setEditIconUrl(category.iconUrl ?? "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !editTitle || !editDescription) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum field lengths
    if (editTitle.trim().length < 3) {
      toast({
        title: "Erro",
        description: "O título deve ter pelo menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (editDescription.trim().length < 10) {
      toast({
        title: "Erro",
        description: "A descrição deve ter pelo menos 10 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-generate slug from the updated title
      const newSlug = generateSlug(editTitle);
      
      // Additional validation to ensure slug is valid
      if (newSlug.length < 3) {
        throw new Error("Não foi possível gerar um slug válido a partir do título");
      }
      
      // Ensure iconUrl is passed correctly (empty string becomes undefined)
      const iconUrlToSave = editIconUrl && editIconUrl.trim() !== "" ? editIconUrl.trim() : undefined;
      
      await updateCategory({
        id: editingCategory,
        title: editTitle,
        slug: newSlug,
        description: editDescription,
        iconUrl: iconUrlToSave,
      });

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });

      setEditingCategory(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar categoria",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"categories">, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${title}"?`)) {
      return;
    }

    try {
      await deleteCategory({ id });
      
      toast({
        title: "Sucesso",
        description: "Categoria deletada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar categoria",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle>Categorias Cadastradas</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? "categoria" : "categorias"} no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[390px] overflow-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {category.iconUrl && (
                        <img 
                          src={category.iconUrl} 
                          alt={category.title}
                          className="w-10 h-10 object-contain rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{category.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(category._id, category.title)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editingCategory !== null} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ex: Ciências Básicas em Ortopedia"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Breve descrição da categoria"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ícone da Categoria (opcional)</label>
              <ImageUpload
                value={editIconUrl}
                onChange={setEditIconUrl}
                disabled={isSubmitting}
                folder="/categories"
                id="category-edit-image-upload"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

