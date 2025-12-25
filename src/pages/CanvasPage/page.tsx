import { useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CanvasHeader from "@components/molecules/CanvasHeader";
import LoadingSpinner from "@components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";
import { useCurrentUser, useOrganization, useProjectByOrg } from "@api";
import { ROUTES } from "@routes/routes.config";
import queryClient from "@api/queryClient";

export default function CanvasPage() {
  const { organizationId = "", projectId = "" } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: org, isLoading: orgLoading, isError: orgError } = useOrganization(organizationId);
  const { data: project, isLoading: projectLoading, isError: projectError } = useProjectByOrg(organizationId, projectId);


  // Canvas Authentication Logic
  // Verify user is logged in
  // Verify organization and project access
  
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
  }, [user, org, project, userLoading, orgLoading, projectLoading, orgError, projectError, organizationId, projectId, navigate]);

  if (userLoading || orgLoading || projectLoading) {
    return <LoadingSpinner label="Accessing Canvas..." />;
  }

  if (orgError || projectError) {
    return (
      <Typography color="error" align="center" sx={{ mt: 4, fontWeight: 600 }}>
        Access Denied
      </Typography>
    );
  }

  const handleLogout = () => {
    // Remove persisted tokens and query cache
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("reactQueryCache");
    queryClient.clear();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <CanvasHeader
        orgName={org?.name}
        projectName={project?.name}
        onLogout={handleLogout}
      />
      <Box sx={{ flex: 1, pt: { xs: "56px", sm: "64px" } }}>



      </Box>
    </Box>
  );
}
