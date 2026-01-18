import { FeedbackPage } from "./_components/feedback-page";
import { requireAdminServer } from "@/lib/server-auth";

/**
 * Admin Feedback & Ratings Page
 *
 * SECURITY: Server-side authorization enforced by:
 * 1. Parent layout.tsx (requireAdminServer via getCurrentUserServer)
 * 2. This page component (explicit requireAdminServer call)
 */
export default async function AdminFeedbackPage() {
  // Explicit server-side authorization check (defense in depth)
  await requireAdminServer();

  return <FeedbackPage />;
}
