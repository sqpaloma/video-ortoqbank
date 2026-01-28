"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { CouponForm, CouponFormData, CouponType } from "./coupon-form";
import { CouponListItem } from "./coupon-list-item";
import {
  useTenantMutation,
  useTenantQuery,
  useTenantReady,
} from "@/hooks/use-tenant-convex";

const toEpoch = (s: string | undefined) =>
  s ? new Date(s).getTime() : undefined;

const initialFormData: CouponFormData = {
  code: "",
  type: "percentage" as CouponType,
  value: 15,
  description: "",
  active: true,
  validFrom: "",
  validUntil: "",
};

export function CouponsPage() {
  const isTenantReady = useTenantReady();
  const coupons = useTenantQuery(api.promoCoupons.list, {}) || [];
  const createCoupon = useTenantMutation(api.promoCoupons.create);
  const updateCoupon = useTenantMutation(api.promoCoupons.update);
  const removeCoupon = useTenantMutation(api.promoCoupons.remove);

  const [form, setForm] = useState<CouponFormData>(initialFormData);
  const nowIso = useMemo(() => new Date().toISOString().slice(0, 16), []);

  async function handleCreate() {
    if (!form.code.trim() || !isTenantReady) return;
    await createCoupon({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      description:
        form.description ||
        `${form.value}${form.type === "percentage" ? "% off" : ""}`,
      active: form.active,
      validFrom: toEpoch(form.validFrom),
      validUntil: toEpoch(form.validUntil),
    });
    setForm(initialFormData);
  }

  async function handleToggleActive(id: Id<"coupons">, active: boolean) {
    await updateCoupon({ id, active });
  }

  async function handleDelete(id: Id<"coupons">) {
    if (!confirm("Excluir cupom?")) return;
    await removeCoupon({ id });
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
          </div>
        </div>
      </div>

      {/* Content with standardized padding */}
      <div className="p-6 pb-24 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <CouponForm
              form={form}
              onChange={setForm}
              onSubmit={handleCreate}
              nowIso={nowIso}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <CouponListItem
                key={coupon._id}
                coupon={coupon}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
