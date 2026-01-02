"use client";

import { Button } from "@/components/ui/button";
import { Check, Edit2, Trash2 } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

type PricingPlan = Doc<"pricingPlans">;

interface PricingPlanCardProps {
  plan: PricingPlan;
  onEdit: (plan: PricingPlan) => void;
  onDelete: (id: string) => void;
}

export function PricingPlanCard({
  plan,
  onEdit,
  onDelete,
}: PricingPlanCardProps) {
  return (
    <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden w-full flex flex-col">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(plan)}
          className="w-8 h-8 p-0 bg-white/80 hover:bg-white"
        >
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(plan._id)}
          className="w-8 h-8 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Internal Info Banner */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between text-xs">
          <div className="space-y-1">
            <div className="font-mono text-gray-600">
              <span className="font-semibold">ID:</span> {plan.productId}
            </div>
            {plan.category && (
              <div className="text-gray-500">
                <span className="font-semibold">Categoria:</span>{" "}
                {plan.category === "year_access"
                  ? "Acesso Anual"
                  : plan.category === "premium_pack"
                    ? "Pacote Premium"
                    : "Add-on"}
                {plan.year && ` • ${plan.year}`}
              </div>
            )}
            {(plan.regularPriceNum || plan.pixPriceNum) && (
              <div className="text-gray-500">
                {plan.regularPriceNum && (
                  <span>💳 R$ {plan.regularPriceNum.toFixed(2)}</span>
                )}
                {plan.pixPriceNum && (
                  <span className="ml-2">
                    <strong>PIX</strong> R$ {plan.pixPriceNum.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                plan.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {plan.isActive ? "✓ Ativo" : "✗ Inativo"}
            </span>
            {plan.accessYears && plan.accessYears.length > 0 && (
              <span className="text-gray-500">
                📅 Anos: {plan.accessYears.join(", ")}
              </span>
            )}
            {plan.displayOrder !== undefined && (
              <span className="text-gray-400 text-xs">
                Ordem: {plan.displayOrder}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Customer-Facing Display */}
      <div className="text-center py-4">
        <div className="inline-block px-4 py-1 rounded-full text-xs font-bold bg-brand-blue/10 text-brand-blue">
          {plan.badge}
        </div>
      </div>

      <div className="text-center px-6 pb-6">
        <div className="h-20 flex flex-col justify-center">
          <div className="text-lg line-through mb-2 text-red-500 min-h-[1.5em]">
            {plan.originalPrice && <span>{plan.originalPrice}</span>}
          </div>
          <div className="text-4xl font-bold mb-2 text-gray-900">
            {plan.price}
          </div>
        </div>
        <div className="text-sm text-gray-600">{plan.installments}</div>
      </div>

      <div className="px-6 pb-6">
        <p className="text-sm text-center text-gray-600">{plan.description}</p>
      </div>

      <div className="px-6 `flex-grow`">
        <ul className="space-y-3">
          {plan.features.map((feature: string, featureIndex: number) => (
            <li key={featureIndex} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand-blue/10">
                <Check className="w-3 h-3 text-brand-blue" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 `flex-shrink-0`">
        <div
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm text-center ${
            plan.isActive
              ? "bg-brand-blue text-white"
              : "bg-gray-300 text-gray-600"
          } shadow-lg`}
        >
          {plan.buttonText}
        </div>
      </div>
    </div>
  );
}
