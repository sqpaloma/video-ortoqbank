import { AdminHub } from "./_components/admin-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Hub Page - Main admin dashboard
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex queries (requireAdmin helper in backend)
 */
export default async function AdminPage() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <AdminHub />;
}
