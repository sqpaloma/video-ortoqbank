"use client";

import { useQuery } from "convex/react";
import { createContext, ReactNode, useContext } from "react";

import { api } from "../../convex/_generated/api";

interface SessionContextType {
  isAdmin: boolean;
  userRole: string | null;
  isLoading: boolean;
}

interface SessionProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextType>({
  isAdmin: false,
  userRole: null,
  isLoading: true,
});

export function SessionProvider({ children }: SessionProviderProps) {
  // Get real-time data from Convex backend
  const user = useQuery(api.users.current);

  // Calculate derived values
  const userRole = user?.role ?? null;
  const isAdmin = userRole === "admin";
  const isLoading = user === undefined;

  const sessionValue: SessionContextType = {
    isAdmin,
    userRole: userRole ?? null,
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
