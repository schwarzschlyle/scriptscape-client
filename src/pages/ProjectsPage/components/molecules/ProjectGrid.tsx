import React from "react";
import Box from "@mui/material/Box";
import type { ProjectCardProps } from "../atoms/ProjectCard";
import ProjectCard from "../atoms/ProjectCard";
import AddProjectCard from "../atoms/AddProjectCard";

export interface ProjectGridProps {
  projects: ProjectCardProps[];
  onProjectClick?: (index: number) => void;
  onAddProject?: () => void;
}

const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  onProjectClick,
  onAddProject,
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr 1fr",
        md: "1fr 1fr 1fr 1fr",
      },
      gap: 2,
      width: "100%",
    }}
  >
    {projects.map((project, idx) => (
      <ProjectCard
        key={project.name}
        {...project}
        onClick={() => onProjectClick && onProjectClick(idx)}
      />
    ))}
    <AddProjectCard onClick={onAddProject} />
  </Box>
);

export default ProjectGrid;
