"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type CouponType = "percentage" | "fixed" | "fixed_price";

export type CouponFormData = {
  code: string;
  type: CouponType;
  value: number;
  description: string;
  active: boolean;
  validFrom: string;
  validUntil: string;
};

interface CouponFormProps {
  form: CouponFormData;
  onChange: (form: CouponFormData) => void;
  onSubmit: () => void;
  nowIso: string;
}

export function CouponForm({
  form,
  onChange,
  onSubmit,
  nowIso,
}: CouponFormProps) {
  const updateForm = (updates: Partial<CouponFormData>) => {
    onChange({ ...form, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar novo cupom</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input
            value={form.code}
            onChange={(e) => updateForm({ code: e.target.value.toUpperCase() })}
            placeholder="EX: SOMOS1K"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={form.type}
            onValueChange={(v: CouponType) => updateForm({ type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentual (%)</SelectItem>
              <SelectItem value="fixed">Desconto fixo (R$)</SelectItem>
              <SelectItem value="fixed_price">Preço fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => updateForm({ value: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="Descrição mostrada no checkout"
          />
        </div>
        <div className="space-y-2">
          <Label>Ativo</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => updateForm({ active: !!v })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Válido a partir de</Label>
          <Input
            type="datetime-local"
            value={form.validFrom}
            max={form.validUntil || undefined}
            onChange={(e) => updateForm({ validFrom: e.target.value })}
            placeholder={nowIso}
          />
        </div>
        <div className="space-y-2">
          <Label>Válido até</Label>
          <Input
            type="datetime-local"
            value={form.validUntil}
            min={form.validFrom || undefined}
            onChange={(e) => updateForm({ validUntil: e.target.value })}
            placeholder={nowIso}
          />
        </div>
        <div className="col-span-full">
          <Button onClick={onSubmit} className="w-full">
            Criar Cupom
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
