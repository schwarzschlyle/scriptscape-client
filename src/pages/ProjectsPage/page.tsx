import React from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import LoadingSpinner from "@components/LoadingSpinner";
import { useCurrentUser } from "@api/users/queries";
import { useOrganization } from "@api/organizations/queries";
import { useOrgAccessAuth } from "@hooks/useOrgAccessAuth";
import ProjectsList from "./components/organisms/ProjectsList";

const ProjectsPage: React.FC = () => {
  const { organizationId = "" } = useParams<{ organizationId: string }>();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: org, isLoading: orgLoading, isError: orgError } = useOrganization(organizationId);

  useOrgAccessAuth({
    user,
    org,
    userLoading,
    orgLoading,
    orgError,
    organizationId,
  });

  React.useEffect(() => {
    if (org?.name) {
      document.title = `${org.name} | Projects`;
    } else {
      document.title = "Projects";
    }
  }, [org?.name]);

  if (userLoading || orgLoading) {
    return <LoadingSpinner label="Loading organization..." />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        py: 4,
      }}
    >
      <ProjectsList organizationId={organizationId} />
    </Box>
  );
};

export default ProjectsPage;
