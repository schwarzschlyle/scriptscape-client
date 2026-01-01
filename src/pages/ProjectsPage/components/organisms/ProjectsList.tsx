import React from "react";
import ProjectGrid from "../molecules/ProjectGrid";
import LoadingSpinner from "@components/LoadingSpinner";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useProjects } from "@api/projects/queries";
import { useCreateProject } from "@api/projects/mutations";
import queryClient from "@api/queryClient";

export interface ProjectsListProps {
  organizationId: string;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ organizationId }) => {
  const { data, isLoading, isError, error } = useProjects(organizationId);
  const projectsRaw = Array.isArray(data) ? data : [];
  const projects = projectsRaw.map((p: any) => ({
    ...p,
    description: p.description ?? undefined,
  }));

  // Debug: log orgId and fetched projects
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("ProjectsPage orgId:", organizationId, "projectsRaw:", projectsRaw);
    if (data) {
      console.log("Projects API response:", data);
    }
  }, [organizationId, projectsRaw, data]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);

  const createProject = useCreateProject(organizationId);

  const handleProjectClick = (idx: number) => {
    const project = projects[idx];
    if (organizationId && project.id) {
      window.location.href = `/canvas/${organizationId}/${project.id}`;
    }
  };

  const handleAddProject = () => {
    setAddOpen(true);
    setNewName("");
    setNewDesc("");
    setAddError(null);
  };

  const handleAddClose = () => {
    setAddOpen(false);
    setAddError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      const resp = await createProject.mutateAsync({
        name: newName,
        description: newDesc,
      });
      setAddOpen(false);
      setNewName("");
      setNewDesc("");
      await queryClient.invalidateQueries({ queryKey: ["projects", organizationId] });
      if (resp?.id) {
        window.location.href = `/canvas/${organizationId}/${resp.id}`;
      }
    } catch (err: any) {
      setAddError(
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create project"
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading projects..." />;
  }

  if (isError) {
    return (
      <Box>
        <Typography color="error" align="center" sx={{ mt: 4, fontWeight: 600 }}>
          Failed to load projects: {error?.message || "Unknown error"}
        </Typography>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} mb={2} align="center">
          No projects found for this organization.
        </Typography>
        <ProjectGrid
          projects={[]}
          onProjectClick={handleProjectClick}
          onAddProject={handleAddProject}
        />
        <Dialog open={addOpen} onClose={handleAddClose}>
          <DialogTitle>Add New Project</DialogTitle>
          <form onSubmit={handleAddSubmit}>
            <DialogContent>
              <TextField
                label="Project Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                label="Description"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                fullWidth
                margin="normal"
              />
              {addError && (
                <Typography color="error" sx={{ mt: 1, fontWeight: 600 }}>
                  {addError}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAddClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={2} align="center">
        Select a Project (Design of this page is under development.)
      </Typography>
      <ProjectGrid
        projects={projects}
        onProjectClick={handleProjectClick}
        onAddProject={handleAddProject}
      />
      <Dialog open={addOpen} onClose={handleAddClose}>
        <DialogTitle>Add New Project</DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent>
            <TextField
              label="Project Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              fullWidth
              margin="normal"
            />
            {addError && (
              <Typography color="error" sx={{ mt: 1, fontWeight: 600 }}>
                {addError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProjectsList;
