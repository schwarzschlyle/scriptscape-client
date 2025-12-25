import Typography from "@mui/material/Typography";

interface OrgNameProps {
  name?: string;
}

const OrgName = ({ name }: OrgNameProps) => (
  <Typography variant="body1" sx={{ mb: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
    Organization: {name}
  </Typography>
);

export default OrgName;
