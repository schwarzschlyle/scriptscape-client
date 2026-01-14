import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { SxProps } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
  sx?: SxProps;
  fullScreen?: boolean;
  /** Ensures a minimum height even when not fullscreen (prevents "misaligned" single-line spinners). */
  minHeight?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = "Loading...",
  size = 48,
  sx,
  fullScreen = false,
  minHeight = 140,
}) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={fullScreen ? "100vh" : minHeight}
      width="100%"
      sx={{ py: 4, ...sx }}
    >
      <CircularProgress size={size} sx={{ color: theme.palette.card.outlineActive }} />
      {label && label.trim() !== "" && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;

