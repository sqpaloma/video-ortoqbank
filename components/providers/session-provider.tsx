"use client";

import { useQuery } from "convex/react";
import { createContext, ReactNode, useContext } from "react";

import { api } from "../../convex/_generated/api";
import { useTenant } from "./tenant-provider";

interface SessionContextType {
  /** Is user an admin of the current tenant (or superadmin) */
  isAdmin: boolean;
  /** User's global role (admin, user, superadmin) */
  globalRole: string | null;
  /** User's role in the current tenant (admin, member) */
  tenantRole: string | null;
  /** Is user a superadmin (cross-tenant admin) */
  isSuperAdmin: boolean;
  /** Does user have active access to current tenant */
  hasAccess: boolean;
  isLoading: boolean;
}

interface SessionProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextType>({
  isAdmin: false,
  globalRole: null,
  tenantRole: null,
  isSuperAdmin: false,
  hasAccess: false,
  isLoading: true,
});

export function SessionProvider({ children }: SessionProviderProps) {
  // Get real-time data from Convex backend
  const user = useQuery(api.users.current);
  const { tenantId } = useTenant();

  // Check user's access and role in this specific tenant
  const accessCheck = useQuery(
    api.tenants.checkUserAccess,
    tenantId ? { tenantId } : "skip",
  );

  // Calculate derived values
  const globalRole = user?.role ?? null;
  const isSuperAdmin = accessCheck?.isSuperAdmin ?? false;
  const tenantRole = accessCheck?.role ?? null;
  const hasAccess = accessCheck?.hasAccess ?? false;

  // User is admin if they're a superadmin OR have admin role in this tenant
  const isAdmin = isSuperAdmin || tenantRole === "admin";

  const isLoading =
    user === undefined || (tenantId !== null && accessCheck === undefined);

  const sessionValue: SessionContextType = {
    isAdmin,
    globalRole,
    tenantRole,
    isSuperAdmin,
    hasAccess,
    isLoading,
  };

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session data
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

// Backwards compatibility alias
export function useSessionRole() {
  const { isAdmin, tenantRole } = useSession();
  return { isAdmin, userRole: tenantRole };
}
