import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@routes/routes.config";

interface UseCanvasAuthParams {
  user: any;
  org: any;
  project: any;
  userLoading: boolean;
  orgLoading: boolean;
  projectLoading: boolean;
  orgError: boolean;
  projectError: boolean;
  organizationId: string;
  projectId: string;
}

export function useCanvasAuth({
  user,
  org,
  project,
  userLoading,
  orgLoading,
  projectLoading,
  orgError,
  projectError,
  organizationId,
  projectId,
}: UseCanvasAuthParams) {
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoading || orgLoading || projectLoading) return;

    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (orgError || !org || (user.organizationId && user.organizationId !== organizationId)) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (projectError || !project || project.organizationId !== organizationId) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
  }, [
    user,
    org,
    project,
    userLoading,
    orgLoading,
    projectLoading,
    orgError,
    projectError,
    organizationId,
    projectId,
    navigate,
  ]);
}
