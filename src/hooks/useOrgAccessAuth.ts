import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "@routes/routes.config";

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
      navigate(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
      return;
    }

    if (orgError || !org || (user.organizationId && user.organizationId !== organizationId)) {
      navigate(buildRoute.projects(user.organizationId), { replace: true });
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
