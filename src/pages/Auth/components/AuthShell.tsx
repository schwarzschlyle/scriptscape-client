import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default",
        // Subtle background texture so auth pages feel more "designed".
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.success.main, 0.12)} 0%, transparent 35%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.success.main, 0.10)} 0%, transparent 40%)`
            : `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 35%),
               radial-gradient(circle at 85% 90%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 40%)`,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 0.5, sm: 1 }, pt: 0.5, pb: 0 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, textAlign: "center" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, textAlign: "center" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <Divider sx={{ mt: 2, mb: 2 }} />

        <Box sx={{ px: { xs: 0.5, sm: 1 }, pb: 0.5 }}>{children}</Box>
      </Paper>
    </Box>
  );
}
