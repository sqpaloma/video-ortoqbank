import { WaitlistPage } from "./_components/waitlist-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Waitlist Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 * 3. Convex queries (requireAdmin helper in backend)
 */
export default async function Page() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <WaitlistPage />;
}
