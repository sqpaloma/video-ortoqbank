"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

import { FormData } from "./pricing-plan-form-fields";
import { CreatePlanCard } from "./create-plan-card";
import { EditPlanCard } from "./edit-plan-card";
import { PricingPlanCard } from "./pricing-plan-card";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { PlusIcon } from "lucide-react";
import {
  useTenantMutation,
  useTenantQuery,
  useTenantReady,
} from "@/hooks/use-tenant-convex";

type PricingPlan = Doc<"pricingPlans">;

const initialFormData: FormData = {
  name: "",
  badge: "",
  originalPrice: "",
  price: "",
  installments: "",
  installmentDetails: "",
  description: "",
  features: "",
  buttonText: "",
  productId: "",
  category: "",
  year: "",
  regularPriceNum: "",
  pixPriceNum: "",
  accessYears: "",
  isActive: true,
  displayOrder: "",
};

export function PricingPlansPage() {
  const isTenantReady = useTenantReady();
  const plans = useTenantQuery(api.pricingPlans.getPricingPlans, {}) || [];
  const savePlan = useTenantMutation(api.pricingPlans.savePricingPlan);
  const removePlan = useTenantMutation(api.pricingPlans.removePricingPlan);
  const { state } = useSidebar();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormData>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<FormData>(initialFormData);

  function startEdit(plan: PricingPlan) {
    setEditingId(plan._id);
    setEditForm({
      name: plan.name,
      badge: plan.badge,
      originalPrice: plan.originalPrice,
      price: plan.price,
      installments: plan.installments,
      installmentDetails: plan.installmentDetails,
      description: plan.description,
      features: plan.features.join("\n"),
      buttonText: plan.buttonText,
      productId: plan.productId,
      category: plan.category || "",
      year: plan.year?.toString() || "",
      regularPriceNum: plan.regularPriceNum?.toString() || "",
      pixPriceNum: plan.pixPriceNum?.toString() || "",
      accessYears: plan.accessYears?.join(",") || "",
      isActive: plan.isActive ?? true,
      displayOrder: plan.displayOrder?.toString() || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function processFormData(formData: FormData | Partial<FormData>) {
    const features = (formData.features || "")
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const year = formData.year ? Number.parseInt(formData.year, 10) : undefined;
    const regularPriceNum = formData.regularPriceNum
      ? Number.parseFloat(formData.regularPriceNum)
      : undefined;
    const pixPriceNum = formData.pixPriceNum
      ? Number.parseFloat(formData.pixPriceNum)
      : undefined;
    const accessYears = formData.accessYears
      ? formData.accessYears
          .split(",")
          .map((y) => Number.parseInt(y.trim(), 10))
          .filter((y) => !Number.isNaN(y))
      : undefined;
    const displayOrder = formData.displayOrder
      ? Number.parseInt(formData.displayOrder, 10)
      : undefined;

    const category = formData.category
      ? (formData.category as "year_access" | "premium_pack" | "addon")
      : undefined;

    return {
      name: formData.name?.trim() || "",
      badge: formData.badge?.trim() || "",
      originalPrice: formData.originalPrice?.trim() || undefined,
      price: formData.price?.trim() || "",
      installments: formData.installments?.trim() || "",
      installmentDetails: formData.installmentDetails?.trim() || "",
      description: formData.description?.trim() || "",
      features,
      buttonText: formData.buttonText?.trim() || "",
      productId: formData.productId?.trim() || "",
      category,
      year,
      regularPriceNum,
      pixPriceNum,
      accessYears,
      isActive: formData.isActive,
      displayOrder,
    };
  }

  async function handleSavePlan(isEdit: boolean = false) {
    if (!isTenantReady) return;

    if (isEdit) {
      if (
        !editingId ||
        !editForm.name?.trim() ||
        !editForm.price?.trim() ||
        !editForm.productId?.trim()
      )
        return;

      const planData = processFormData(editForm as FormData);
      await savePlan({
        id: editingId as Id<"pricingPlans">,
        ...planData,
      });

      cancelEdit();
    } else {
      if (
        !createForm.name.trim() ||
        !createForm.price.trim() ||
        !createForm.productId.trim()
      )
        return;

      const planData = processFormData(createForm);
      await savePlan({ ...planData });

      setCreateForm(initialFormData);
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir plano de preços?")) return;
    await removePlan({ id: id as Id<"pricingPlans"> });
  }

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-black hover:text-black hover:bg-gray-100 transition-[left] duration-200 ease-linear z-10 ${state === "collapsed" ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]" : "left-[calc(var(--sidebar-width)+0.25rem)]"}`}
      />

      <div className="border-b">
        <div className="p-4 pt-12 flex items-center justify-between pr-12 pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Planos de preços
            </h1>
          </div>

          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      <div className="p-6 pb-24 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isCreating && (
              <CreatePlanCard
                form={createForm}
                onChange={(form: Partial<FormData>) =>
                  setCreateForm(form as FormData)
                }
                onSave={() => handleSavePlan(false)}
                onCancel={() => setIsCreating(false)}
              />
            )}

            {plans?.map((plan) => (
              <div
                key={plan._id}
                className="relative rounded-2xl bg-white border pb-6 overflow-hidden w-full flex flex-col"
              >
                {editingId === plan._id ? (
                  <EditPlanCard
                    planId={plan._id}
                    form={editForm}
                    onChange={setEditForm}
                    onSave={() => handleSavePlan(true)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <PricingPlanCard
                    plan={plan}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
