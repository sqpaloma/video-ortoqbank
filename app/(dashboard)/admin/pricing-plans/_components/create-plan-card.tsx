"use client";

import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { FormData, PricingPlanFormFields } from "./pricing-plan-form-fields";

interface CreatePlanCardProps {
  form: FormData;
  onChange: (form: Partial<FormData>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CreatePlanCard({
  form,
  onChange,
  onSave,
  onCancel,
}: CreatePlanCardProps) {
  return (
    <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden w-full border-2 border-dashed border-brand-blue/30">
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        <PricingPlanFormFields form={form} onChange={onChange} mode="create" />

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onSave} size="sm" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Criar Plano
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
