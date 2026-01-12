import { useCallback } from "react";
import { useAuth } from "@auth/AuthContext";

export function useLogout() {
  const auth = useAuth();

  const logout = useCallback(() => {
    void auth.logout();
  }, [auth]);

  return logout;
}
