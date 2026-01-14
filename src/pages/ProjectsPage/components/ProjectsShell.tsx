import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";

export function ProjectsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default",
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 20% 15%, ${alpha(theme.palette.success.main, 0.08)} 0%, transparent 40%),
               radial-gradient(circle at 80% 85%, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 45%)`
            : `radial-gradient(circle at 20% 15%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 40%),
               radial-gradient(circle at 80% 85%, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 45%)`,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 980 }}>
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>{children}</Box>
        </Paper>
      </Box>
    </Box>
  );
}
