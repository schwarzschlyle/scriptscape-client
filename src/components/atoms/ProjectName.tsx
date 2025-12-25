import Typography from "@mui/material/Typography";

interface ProjectNameProps {
  name?: string;
}

const ProjectName = ({ name }: ProjectNameProps) => (
  <Typography variant="body1" sx={{ mb: { xs: 0, sm: 0 }, fontWeight: 500 }}>
    Project: {name}
  </Typography>
);

export default ProjectName;
