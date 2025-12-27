import Typography from "@mui/material/Typography";

interface ProjectNameProps {
  name?: string;
}

const ProjectName = ({ name }: ProjectNameProps) => (
  <Typography
    variant="body1"
    sx={{
      color: "#fff",
      mb: { xs: 0, sm: 0 },
      fontWeight: 500,
      textAlign: "center",
      width: "100%",
    }}
  >
    {name}
  </Typography>
);

export default ProjectName;
