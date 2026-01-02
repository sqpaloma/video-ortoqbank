"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type FormData = {
  name: string;
  badge: string;
  originalPrice: string;
  price: string;
  installments: string;
  installmentDetails: string;
  description: string;
  features: string;
  buttonText: string;
  productId: string;
  category: "year_access" | "premium_pack" | "addon" | "";
  year: string;
  regularPriceNum: string;
  pixPriceNum: string;
  accessYears: string;
  isActive: boolean;
  displayOrder: string;
};

interface PricingPlanFormFieldsProps {
  form: Partial<FormData>;
  onChange: (form: Partial<FormData>) => void;
  mode: "create" | "edit";
  planId?: string;
}

export function PricingPlanFormFields({
  form,
  onChange,
  mode,
  planId,
}: PricingPlanFormFieldsProps) {
  const updateForm = (updates: Partial<FormData>) => {
    onChange({ ...form, ...updates } as Partial<FormData>);
  };

  return (
    <>
      {/* Internal/Admin Fields Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
          🔒 Campos Internos{" "}
          {mode === "create" && "(não visíveis na landing page)"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Product ID *</Label>
            <Input
              value={form.productId || ""}
              onChange={(e) => updateForm({ productId: e.target.value })}
              placeholder="Ex: ortoqbank_2025"
              className="text-xs"
            />
            {mode === "create" && (
              <p className="text-xs text-gray-500">
                Identificador único do produto
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Categoria</Label>
            <Select
              value={form.category || ""}
              onValueChange={(
                value: "year_access" | "premium_pack" | "addon" | "",
              ) => updateForm({ category: value })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year_access">Acesso Anual</SelectItem>
                <SelectItem value="premium_pack">Pacote Premium</SelectItem>
                <SelectItem value="addon">Add-on</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Ano</Label>
            <Input
              type="number"
              value={form.year || ""}
              onChange={(e) => updateForm({ year: e.target.value })}
              placeholder="Ex: 2025"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Preço Regular (número)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={form.regularPriceNum || ""}
              onChange={(e) => updateForm({ regularPriceNum: e.target.value })}
              placeholder="Ex: 299.00"
              className="text-xs"
            />
            {mode === "create" && (
              <p className="text-xs text-gray-500">
                Para cálculos (cartão de crédito)
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Preço PIX (número)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.pixPriceNum || ""}
              onChange={(e) => updateForm({ pixPriceNum: e.target.value })}
              placeholder="Ex: 269.10"
              className="text-xs"
            />
            {mode === "create" && (
              <p className="text-xs text-gray-500">
                Preço com desconto PIX (10%)
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Anos de Acesso</Label>
            <Input
              value={form.accessYears || ""}
              onChange={(e) => updateForm({ accessYears: e.target.value })}
              placeholder="Ex: 2026,2027"
              className="text-xs"
            />
            <p className="text-xs text-gray-500">
              Anos {mode === "create" ? "que o usuário terá acesso " : ""}
              (separados por vírgula)
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Ordem de Exibição</Label>
            <Input
              type="number"
              value={form.displayOrder || ""}
              onChange={(e) => updateForm({ displayOrder: e.target.value })}
              placeholder="Ex: 1"
              className="text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`isActive-${mode}${planId ? `-${planId}` : ""}`}
              checked={form.isActive ?? true}
              onCheckedChange={(checked) =>
                updateForm({ isActive: checked as boolean })
              }
            />
            <Label
              htmlFor={`isActive-${mode}${planId ? `-${planId}` : ""}`}
              className="text-xs font-medium cursor-pointer"
            >
              Plano Ativo {mode === "create" && "(visível para compra)"}
            </Label>
          </div>
        </div>
      </div>

      {/* Display Fields Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
          👁️ Campos de Exibição{" "}
          {mode === "create" && "(visíveis na landing page)"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Badge</Label>
            <Input
              value={form.badge || ""}
              onChange={(e) => updateForm({ badge: e.target.value })}
              placeholder="Ex: Mais Popular"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Nome do Plano *</Label>
            <Input
              value={form.name || ""}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="Nome do plano"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Preço Original (texto)
            </Label>
            <Input
              value={form.originalPrice || ""}
              onChange={(e) => updateForm({ originalPrice: e.target.value })}
              placeholder="Ex: R$ 299"
              className="text-xs"
            />
            {mode === "create" && (
              <p className="text-xs text-gray-500">Preço riscado (marketing)</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Preço Atual (texto) *</Label>
            <Input
              value={form.price || ""}
              onChange={(e) => updateForm({ price: e.target.value })}
              placeholder="Ex: R$ 199"
              className="text-xs"
            />
            {mode === "create" && (
              <p className="text-xs text-gray-500">Preço exibido em destaque</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Parcelas</Label>
            <Input
              value={form.installments || ""}
              onChange={(e) => updateForm({ installments: e.target.value })}
              placeholder="Ex: 12x de R$ 16,58"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Detalhes das Parcelas</Label>
            <Input
              value={form.installmentDetails || ""}
              onChange={(e) =>
                updateForm({ installmentDetails: e.target.value })
              }
              placeholder="Ex: sem juros"
              className="text-xs"
            />
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-medium">Descrição</Label>
            <Input
              value={form.description || ""}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="Descrição do plano"
              className="text-xs"
            />
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-medium">
              Recursos (um por linha)
            </Label>
            <Textarea
              value={form.features || ""}
              onChange={(e) => updateForm({ features: e.target.value })}
              placeholder="Acesso completo&#10;Suporte 24/7"
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Texto do Botão</Label>
            <Input
              value={form.buttonText || ""}
              onChange={(e) => updateForm({ buttonText: e.target.value })}
              placeholder="Ex: Começar Agora"
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
