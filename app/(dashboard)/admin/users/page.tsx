import { UsersPage } from "./_components/users-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Users Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex queries/mutations (requireAdmin helper in backend)
 */
export default async function Page() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <UsersPage />;
}
