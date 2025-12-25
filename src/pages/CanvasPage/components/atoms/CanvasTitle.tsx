import Typography from "@mui/material/Typography";

import type { SxProps } from "@mui/material/styles";

interface CanvasTitleProps {
  children: React.ReactNode;
  sx?: SxProps;
}

const CanvasTitle = ({ children, sx }: CanvasTitleProps) => (
  <Typography
    variant="h5"
    component="h2"
    sx={{ mb: { xs: 1, sm: 2 }, ...sx }}
  >
    {children}
  </Typography>
);

export default CanvasTitle;
