import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import LoadingSpinner from "@components/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useCurrentUser, useOrganization, useProjectByOrg } from "@api";
import { useCanvasAuth } from "@hooks/useCanvasAuth";
import { useLogout } from "@hooks/useLogout";

import CanvasHeader from "./components/molecules/CanvasHeader";
import CanvasArea from "./components/molecules/CanvasArea";
import { useState, useCallback } from "react";

export default function CanvasPage() {
  const { organizationId = "", projectId = "" } = useParams();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: org, isLoading: orgLoading, isError: orgError } = useOrganization(organizationId);
  const { data: project, isLoading: projectLoading, isError: projectError } = useProjectByOrg(organizationId, projectId);

  useCanvasAuth({
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
  });

  const logout = useLogout();

  const [syncing, setSyncing] = useState(false);
  const handleSyncChange = useCallback((sync: boolean) => setSyncing(sync), []);

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

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <CanvasHeader
        orgName={org?.name}
        projectName={project?.name}
        onLogout={logout}
        syncing={syncing}
      />
      <CanvasArea
        organizationId={organizationId}
        projectId={projectId}
        onSyncChange={handleSyncChange}
      />
    </Box>
  );
}
