import { PricingPlansPage } from "./_components/pricing-plans-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Pricing Plans Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex mutations (requireAdmin helper in backend)
 */
export default async function Page() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <PricingPlansPage />;
}
