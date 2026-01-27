import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getTenantSlugFromHostname } from "./tenant";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Get the current tenant ID from hostname (server-side)
 */
async function getTenantId(
  token: string | null,
): Promise<Id<"tenants"> | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const tenantSlug = getTenantSlugFromHostname(host);

  const tenant = await fetchQuery(
    api.tenants.getBySlug,
    { slug: tenantSlug },
    token ? { token } : undefined,
  ).catch(() => null);

  return tenant?._id || null;
}

/**
 * Verifica se o usuário atual tem acesso pago ao conteúdo de vídeo.
 * Agora usa verificação tenant-scoped.
 *
 * @param redirectTo - URL para redirecionar se não tiver acesso (default: /purchase)
 * @returns true se tem acesso, ou redireciona automaticamente
 *
 * @example
 * // Em um Server Component:
 * export default async function ProtectedPage() {
 *   await requireVideoAccess();
 *   // ... resto do código só executa se tiver acesso
 * }
 */
export async function requireVideoAccess(
  redirectTo = "/purchase",
): Promise<true> {
  const { userId, getToken } = await auth();

  // Se não está logado, redireciona para compra
  if (!userId) {
    redirect(redirectTo);
  }

  // Obtém token do Convex para autenticação
  const token = await getToken({ template: "convex" }).catch(() => null);

  // Get tenant ID from hostname
  const tenantId = await getTenantId(token);

  if (!tenantId) {
    console.error("[requireVideoAccess] Tenant not found");
    redirect(redirectTo);
  }

  // Verifica acesso no Convex (fonte de verdade) - tenant-scoped
  const hasAccess = await fetchQuery(
    api.userAccess.checkUserHasTenantAccessByClerkId,
    { tenantId, clerkUserId: userId },
    token ? { token } : {},
  );

  if (!hasAccess) {
    redirect(redirectTo);
  }

  return true;
}

/**
 * Verifica acesso sem redirecionar automaticamente.
 * Útil quando você precisa fazer lógica condicional.
 * Agora usa verificação tenant-scoped.
 *
 * @returns { hasAccess: boolean, userId: string | null }
 *
 * @example
 * const { hasAccess, userId } = await checkVideoAccess();
 * if (!hasAccess) {
 *   // mostrar conteúdo limitado
 * }
 */
export async function checkVideoAccess(): Promise<{
  hasAccess: boolean;
  userId: string | null;
}> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return { hasAccess: false, userId: null };
  }

  const token = await getToken({ template: "convex" }).catch(() => null);

  // Get tenant ID from hostname
  const tenantId = await getTenantId(token);

  if (!tenantId) {
    console.error("[checkVideoAccess] Tenant not found");
    return { hasAccess: false, userId };
  }

  // Tenant-scoped access check
  const hasAccess = await fetchQuery(
    api.userAccess.checkUserHasTenantAccessByClerkId,
    { tenantId, clerkUserId: userId },
    token ? { token } : {},
  );

  return { hasAccess, userId };
}
