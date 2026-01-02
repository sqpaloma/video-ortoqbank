"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { CouponForm, CouponFormData, CouponType } from "./coupon-form";
import { CouponListItem } from "./coupon-list-item";

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
  const coupons = useQuery(api.promoCoupons.list) || [];
  const createCoupon = useMutation(api.promoCoupons.create);
  const updateCoupon = useMutation(api.promoCoupons.update);
  const removeCoupon = useMutation(api.promoCoupons.remove);

  const [form, setForm] = useState<CouponFormData>(initialFormData);
  const nowIso = useMemo(() => new Date().toISOString().slice(0, 16), []);

  async function handleCreate() {
    if (!form.code.trim()) return;
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
    <div className="space-y-6 p-12 md:p-12 md:pl-42 md:pr-42">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Cupons</h1>
      </div>

      <CouponForm
        form={form}
        onChange={setForm}
        onSubmit={handleCreate}
        nowIso={nowIso}
      />

      <div className="grid gap-3">
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
  );
}
