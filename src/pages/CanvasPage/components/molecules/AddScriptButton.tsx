import React from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";

interface AddScriptButtonProps {
  onClick: () => void;
}

const AddScriptButton: React.FC<AddScriptButtonProps> = ({ onClick }) => (
  <Box
    sx={{
      position: "fixed",
      bottom: 32,
      right: 32,
      zIndex: 1200,
      pointerEvents: "none",
    }}
  >
    <Fab
      aria-label="add"
      onClick={onClick}
      sx={{
        pointerEvents: "auto",
        boxShadow: 4,
        bgcolor: "#272927",
        "&:hover": { bgcolor: "#272927" },
      }}
    >
      <AddIcon sx={{ color: "#abf43e" }} />
    </Fab>
  </Box>
);

export default AddScriptButton;
