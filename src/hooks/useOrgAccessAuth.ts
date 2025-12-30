import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";

interface UseOrgAccessAuthParams {
  user: any;
  org: any;
  userLoading: boolean;
  orgLoading: boolean;
  orgError: boolean;
  organizationId: string;
}

export function useOrgAccessAuth({
  user,
  org,
  userLoading,
  orgLoading,
  orgError,
  organizationId,
}: UseOrgAccessAuthParams) {
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoading || orgLoading) return;

    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (orgError || !org || (user.organizationId && user.organizationId !== organizationId)) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
  }, [
    user,
    org,
    userLoading,
    orgLoading,
    orgError,
    organizationId,
    navigate,
  ]);
}
