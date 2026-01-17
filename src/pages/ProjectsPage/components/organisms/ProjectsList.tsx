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
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { alpha, useTheme } from "@mui/material/styles";
import { useProjects } from "@api/projects/queries";
import { useCreateProject } from "@api/projects/mutations";
import queryClient from "@api/queryClient";
import { buildRoute } from "@routes/routes.config";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { getCardPositions } from "@api/card_positions/queries";
import type { CardPosition } from "@api/card_positions/types";

export interface ProjectsListProps {
  organizationId: string;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ organizationId }) => {
  const theme = useTheme();
  const { data, isLoading, isError, error } = useProjects(organizationId);
  const navigate = useNavigate();
  const projectsRaw = Array.isArray(data) ? data : [];
  const projects = projectsRaw.map((p: any) => ({
    ...p,
    description: p.description ?? undefined,
  }));

  const cardPosQueries = useQueries({
    queries: projects.map((p: any) => {
      const projectId = p?.id as string | undefined;
      return {
        queryKey: ["card_positions", organizationId, projectId],
        queryFn: async () => {
          const positions = await getCardPositions(organizationId, projectId!);
          return positions;
        },
        enabled: !!organizationId && !!projectId,
        staleTime: 1000 * 60,
      };
    }),
  });

  const computeCounts = (positions?: CardPosition[]) => {
    const counts = { scripts: 0, segments: 0, visuals: 0, sketches: 0 };
    for (const p of positions ?? []) {
      switch (p.cardType) {
        case "script":
          counts.scripts += 1;
          break;
        case "segmentCollection":
          counts.segments += 1;
          break;
        case "visualDirection":
          counts.visuals += 1;
          break;
        case "storyboard":
          counts.sketches += 1;
          break;
        default:
          break;
      }
    }
    return counts;
  };

  const projectsWithCounts = projects.map((p: any, idx: number) => ({
    ...p,
    counts: computeCounts(cardPosQueries[idx]?.data as CardPosition[] | undefined),
  }));

  // Debug: log orgId and fetched projects
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    // console.log("ProjectsPage orgId:", organizationId, "projectsRaw:", projectsRaw);
    if (data) {
      // console.log("Projects API response:", data);
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
      // Client-side navigation avoids a full page reload, which prevents a double loading state
      // (ProtectedRoute session restore -> CanvasPage access spinner).
      navigate(buildRoute.canvas(organizationId, project.id));
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
        navigate(buildRoute.canvas(organizationId, resp.id));
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
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.common.white, 0.10)}`,
            background: alpha(theme.palette.common.white, 0.03),
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Create your first project
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Projects hold your scripts, generated segments, visuals, and storyboards.
          </Typography>
        </Box>
        <ProjectGrid
          projects={[]}
          onProjectClick={handleProjectClick}
          onAddProject={handleAddProject}
        />
        <Dialog open={addOpen} onClose={handleAddClose}>
          <DialogTitle sx={{ fontWeight: 800 }}>New project</DialogTitle>
          <form onSubmit={handleAddSubmit}>
            <DialogContent>
              <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                {addError ? <Alert severity="error">{addError}</Alert> : null}
                <TextField
                  label="Project name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  placeholder="e.g. Pilot Episode"
                />
                <TextField
                  label="Description"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  fullWidth
                  placeholder="Optional"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAddClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="success" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <ProjectGrid
        projects={projectsWithCounts}
        onProjectClick={handleProjectClick}
        onAddProject={handleAddProject}
      />
      <Dialog open={addOpen} onClose={handleAddClose}>
        <DialogTitle sx={{ fontWeight: 800 }}>New project</DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              {addError ? <Alert severity="error">{addError}</Alert> : null}
              <TextField
                label="Project name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                fullWidth
                autoFocus
                placeholder="e.g. Pilot Episode"
              />
              <TextField
                label="Description"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                fullWidth
                placeholder="Optional"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProjectsList;
