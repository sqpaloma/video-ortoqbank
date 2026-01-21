import { CustomizationPage } from "./_components/customization-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Customization Page - Tenant branding settings
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex mutations (requireTenantAdmin helper in backend)
 */
export default async function AdminCustomizationPage() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <CustomizationPage />;
}

