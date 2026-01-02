"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Coupon = Doc<"coupons">;

interface CouponListItemProps {
  coupon: Coupon;
  onToggleActive: (id: Id<"coupons">, active: boolean) => void;
  onDelete: (id: Id<"coupons">) => void;
}

const fromEpoch = (n: number | undefined) =>
  n ? new Date(n).toISOString().slice(0, 16) : "";

export function CouponListItem({
  coupon,
  onToggleActive,
  onDelete,
}: CouponListItemProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Código</div>
          <div className="text-lg font-semibold">{coupon.code}</div>
          <div className="text-sm">{coupon.description}</div>
          <div className="text-muted-foreground text-xs">
            {coupon.type} • valor {coupon.value} •{" "}
            {coupon.active ? "Ativo" : "Inativo"}
          </div>
          <div className="text-muted-foreground text-xs">
            {coupon.validFrom ? `de ${fromEpoch(coupon.validFrom)} ` : ""}
            {coupon.validUntil ? `até ${fromEpoch(coupon.validUntil)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={coupon.active}
            onCheckedChange={(v) => onToggleActive(coupon._id, !!v)}
          />
          <Button variant="destructive" onClick={() => onDelete(coupon._id)}>
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
