import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        // Prevent “black bottom” gaps by defining a consistent page bg.
        bgcolor: "#111211",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 3,
          borderRadius: 2,
          bgcolor: "#272927",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          align="center"
          sx={{
            mb: 0.5,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography align="center" sx={{ mb: 2, color: "rgba(255,255,255,0.70)" }}>
            {subtitle}
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }} />
        )}

        {children}
      </Paper>
    </Box>
  );
};

export default AuthLayout;

