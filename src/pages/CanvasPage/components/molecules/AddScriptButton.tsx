import React from "react";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface AddScriptButtonProps {
  onClick: () => void;
}

const AddScriptButton: React.FC<AddScriptButtonProps> = ({ onClick }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 1200,
        pointerEvents: "none",
        transform: "none !important",
      }}
    >
      <Fab
        aria-label="add"
        onClick={onClick}
        sx={{
          pointerEvents: "auto",
          boxShadow: 4,
          bgcolor: theme.palette.card.background,
          "&:hover": { bgcolor: theme.palette.card.background },
          width: 28,
          height: 28,
          minHeight: 28,
          minWidth: 28,
          maxWidth: 28,
          maxHeight: 28,
        }}
        size="small"
      >
        <AddIcon sx={{ color: theme.palette.card.outlineActive, fontSize: 16 }} />
      </Fab>
    </Box>
  );
};

export default AddScriptButton;
