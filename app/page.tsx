"use client";

import { TenantProvider } from "@/components/providers/tenant-provider";

export default function Home() {
  return (
    <TenantProvider applyBrandColor={false}>
      <div className="flex flex-col min-h-screen"></div>
    </TenantProvider>
  );
}
