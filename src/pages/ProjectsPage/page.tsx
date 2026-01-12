import React from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "@components/LoadingSpinner";
import { useCurrentUser } from "@api/users/queries";
import { useOrganization } from "@api/organizations/queries";
import { useOrgAccessAuth } from "@hooks/useOrgAccessAuth";
import ProjectsList from "./components/organisms/ProjectsList";
import { ProjectsShell } from "./components/ProjectsShell";

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
    return <LoadingSpinner fullScreen label="Loading organization..." />;
  }

  return (
    <ProjectsShell
      title={org?.name ? `${org.name}` : "Projects"}
      subtitle="Select a project to open the canvas"
    >
      <ProjectsList organizationId={organizationId} />
    </ProjectsShell>
  );
};

export default ProjectsPage;
