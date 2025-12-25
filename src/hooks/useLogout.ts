import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";
import queryClient from "@api/queryClient";

export function useLogout() {
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("reactQueryCache");
    queryClient.clear();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate]);

  return logout;
}
