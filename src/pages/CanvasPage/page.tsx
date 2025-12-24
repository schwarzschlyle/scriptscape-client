import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCurrentUser, useOrganization, useProjectByOrg } from "@api";
import { ROUTES } from "@routes/routes.config";

export default function CanvasPage() {
  const { organizationId = "", projectId = "" } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: org, isLoading: orgLoading, isError: orgError } = useOrganization(organizationId);
  const { data: project, isLoading: projectLoading, isError: projectError } = useProjectByOrg(organizationId, projectId);

  useEffect(() => {
    if (userLoading || orgLoading || projectLoading) return;

    // Not authenticated
    if (!user) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    // Org not found, forbidden, or user not in org
    if (orgError || !org || (user.organizationId && user.organizationId !== organizationId)) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    // Project not found, forbidden, or not in org
    if (projectError || !project || project.organizationId !== organizationId) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }
  }, [user, org, project, userLoading, orgLoading, projectLoading, orgError, projectError, organizationId, projectId, navigate]);

  if (userLoading || orgLoading || projectLoading) {
    return <div>Loading...</div>;
  }

  if (orgError || projectError) {
    return <div style={{ color: "red" }}>Access Denied</div>;
  }

  // If checks pass, render the canvas
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div>
      <h2>Canvas Page</h2>
      <div>Organization: {org?.name}</div>
      <div>Project: {project?.name}</div>
      <button onClick={handleLogout} style={{ marginTop: 16 }}>
        Log Out
      </button>
      {/* Canvas content goes here */}
    </div>
  );
}
