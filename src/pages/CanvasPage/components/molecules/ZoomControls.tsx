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
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      pointerEvents: "none",
      transform: "none !important",
    }}
  >
    <Fab
      aria-label="zoom out"
      onClick={onZoomOut}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#323332" },
        width: 20,
        height: 20,
        minHeight: 20,
        minWidth: 20,
        maxWidth: 20,
        maxHeight: 20,
      }}
      size="small"
    >
      <RemoveIcon sx={{ color: "#abf43e", fontSize: 16 }} />
    </Fab>
    <span
      style={{
        color: "#abf43e",
        fontSize: 8,
        fontWeight: 700,
        fontFamily: "'SF Pro Text', 'San Francisco', Arial, sans-serif",
        fontStyle: "bold",
        margin: "0 8px",
        pointerEvents: "auto",
        background: "none",
        boxShadow: "none",
        borderRadius: 0,
        padding: 0,
        minWidth: 0,
        lineHeight: 1.2,
        letterSpacing: 0,
      }}
    >
      {zoom}%
    </span>
    <Fab
      aria-label="zoom in"
      onClick={onZoomIn}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#323332" },
        width: 20,
        height: 20,
        minHeight: 20,
        minWidth: 20,
        maxWidth: 20,
        maxHeight: 20,
      }}
      size="small"
    >
      <AddIcon sx={{ color: "#abf43e", fontSize: 16 }} />
    </Fab>
  </Box>
);

export default ZoomControls;
