import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/server-auth";

/**
 * Server-side admin layout with role-based authorization
 * This layout enforces that only admin users can access admin routes
 *
 * SECURITY: This runs on the server and validates the user's role
 * before rendering any admin content, preventing unauthorized access
 * even if users try to access admin URLs directly
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authorization check
  // This runs on every admin page request and validates the user's role
  const user = await getCurrentUserServer();

  // Redirect to categories (dashboard) if not authenticated or not an admin
  if (!user || user.role !== "admin") {
    redirect("/categories");
  }

  console.log("✅ Admin Layout: Access granted");

  // Only render content if user is authenticated AND is an admin
  return <div className="space-y-6 p-2 md:p-6">{children}</div>;
}
