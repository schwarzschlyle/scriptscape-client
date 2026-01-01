import React from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";

interface ZoomControlsProps {
  zoom: number; // Display percentage (e.g., 100 means 100%)
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
}) => (
  <Box
    sx={{
      position: "fixed",
      bottom: 32,
      left: 32,
      zIndex: 1200,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      pointerEvents: "none",
      transform: "none !important",
    }}
  >
    <Fab
      aria-label="zoom in"
      onClick={onZoomIn}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#323332" },
        mb: 1,
      }}
      size="small"
    >
      <AddIcon sx={{ color: "#abf43e" }} />
    </Fab>
    <Box
      sx={{
        pointerEvents: "auto",
        bgcolor: "#272927",
        borderRadius: 1,
        px: 1.5,
        py: 0.5,
        mb: 1,
        textAlign: "center",
        minWidth: 60,
        boxShadow: 4,
      }}
    >
      <Box
        component="span"
        sx={{
          color: "#abf43e",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "monospace",
        }}
      >
        {zoom}%
      </Box>
    </Box>
    <Fab
      aria-label="zoom out"
      onClick={onZoomOut}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#323332" },
      }}
      size="small"
    >
      <RemoveIcon sx={{ color: "#abf43e" }} />
    </Fab>
  </Box>
);

export default ZoomControls;