import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
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
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, textAlign: "center" }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
            {subtitle}
          </Typography>
        ) : null}
        <Box sx={{ mt: 2 }}>{children}</Box>
      </Paper>
    </Box>
  );
}
