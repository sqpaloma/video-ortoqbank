import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useEffect } from "react";

import { api } from "../convex/_generated/api";

export function useCurrentUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current);
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  // If authenticated but user doesn't exist yet, create it
  useEffect(() => {
    if (isAuthenticated && user === null && !isLoading) {
      ensureUser().catch((error) => {
        console.error("Error ensuring user exists:", error);
      });
    }
  }, [isAuthenticated, user, isLoading, ensureUser]);

  // Combine the authentication state with the user existence check
  // Keep loading true if authenticated but user not yet created
  return {
    isLoading: isLoading || (isAuthenticated && user === null),
    isAuthenticated: isAuthenticated && user !== null,
    user,
  };
}
