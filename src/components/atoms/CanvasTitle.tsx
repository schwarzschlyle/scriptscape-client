import Typography from "@mui/material/Typography";

interface CanvasTitleProps {
  children: React.ReactNode;
}

const CanvasTitle = ({ children }: CanvasTitleProps) => (
  <Typography variant="h5" component="h2" sx={{ mb: { xs: 1, sm: 0 } }}>
    {children}
  </Typography>
);

export default CanvasTitle;
