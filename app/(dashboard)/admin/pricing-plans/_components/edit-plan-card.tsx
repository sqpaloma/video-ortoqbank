"use client";

import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { FormData, PricingPlanFormFields } from "./pricing-plan-form-fields";

interface EditPlanCardProps {
  planId: string;
  form: Partial<FormData>;
  onChange: (form: Partial<FormData>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditPlanCard({
  planId,
  form,
  onChange,
  onSave,
  onCancel,
}: EditPlanCardProps) {
  return (
    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <PricingPlanFormFields
        form={form}
        onChange={onChange}
        mode="edit"
        planId={planId}
      />

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={onSave} size="sm" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
