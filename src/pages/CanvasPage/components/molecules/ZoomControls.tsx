import React from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";

interface ZoomControlsProps {
  zoom: number;
  setZoom: (z: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  setZoom,
  min = 0.2,
  max = 2.0,
  step = 0.1,
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
      onClick={() => setZoom(Math.min(max, zoom + step))}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#272927" },
        mb: 1,
      }}
      size="small"
    >
      <AddIcon sx={{ color: "#abf43e" }} />
    </Fab>
    <Fab
      aria-label="zoom out"
      onClick={() => setZoom(Math.max(min, zoom - step))}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#272927" },
      }}
      size="small"
    >
      <RemoveIcon sx={{ color: "#abf43e" }} />
    </Fab>
  </Box>
);

export default ZoomControls;
