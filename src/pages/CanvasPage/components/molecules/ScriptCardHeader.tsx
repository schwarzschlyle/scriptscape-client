import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";

interface ScriptCardHeaderProps {
  name: string;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  // Drag handle props from dnd-kit
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  onClick?: () => void;
}

const ScriptCardHeader: React.FC<ScriptCardHeaderProps> = ({
  name,
  editing,
  deleting,
  onEdit,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  onClick,
}) => (
  <Box
    sx={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      px: 1,
      py: 1,
      cursor: dragListeners ? "grab" : "default",
      userSelect: "none",
      background: "#2f332f",
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottom: "1px solid #1f211f",
    }}
    {...dragAttributes}
    {...dragListeners}
    tabIndex={0}
    aria-label="Drag to move"
    title="Drag to move"
    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
      if (onClick) onClick();
      // Do not stop propagation, so drag events still work
    }}
  >
    <Typography
      variant="subtitle2"
      noWrap
      sx={{
        fontWeight: 600,
        color: "#73a32c",
        fontSize: 16,
        pl: 1,
        pr: 2,
        flexShrink: 0,
        textAlign: "left",
      }}
    >
      {name || "Untitled Script"}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: "auto" }}>
      {/* Dot indicator */}
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: active ? "#abf43e" : "#6a6967",
          marginRight: 1,
          border: "1.5px solid #232523",
        }}
      />
      <IconButton
        size="small"
        onClick={onEdit}
        disabled={editing || deleting}
        aria-label="Edit"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete"
        sx={{ color: "#e53935" }}
      >
        {deleting ? <CircularProgress size={18} /> : <CloseIcon fontSize="small" />}
      </IconButton>
    </Box>
  </Box>
);

export default ScriptCardHeader;
