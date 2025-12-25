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
      pointerEvents: "none", // allow FAB to float above content but not block interactions
    }}
  >
    <Fab
      color="primary"
      aria-label="add"
      onClick={onClick}
      sx={{
        pointerEvents: "auto", // enable click
        boxShadow: 4,
      }}
    >
      <AddIcon />
    </Fab>
  </Box>
);

export default AddScriptButton;
