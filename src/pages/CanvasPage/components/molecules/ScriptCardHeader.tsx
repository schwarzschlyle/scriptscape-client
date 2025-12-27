import React from "react";
import Typography from "@mui/material/Typography";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";

interface ScriptCardHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting: boolean;
  onDelete: () => void;
  // Drag handle props from dnd-kit
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  onClick?: () => void;
  editable?: boolean;
}

const ScriptCardHeader: React.FC<ScriptCardHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  onClick,
  editable = false,
}) => {
  const [editingName, setEditingName] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debug: log props and state
  console.log("ScriptCardHeader", { editable, editingName, name, deleting });

  // Focus input when editingName becomes true
  React.useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingName]);

  // If the card is deactivated, exit editing mode and blur input
  React.useEffect(() => {
    if (!active && editingName) {
      setEditingName(false);
      if (inputRef.current) inputRef.current.blur();
    }
  }, [active, editingName]);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        px: 1,
        py: 1,
        userSelect: "none",
        background: "rgba(47,51,47,0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottom: "1px solid #1f211f",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        cursor: !editingName && dragListeners ? "grab" : "default",
      }}
      {...(!editingName ? { ...dragAttributes, ...dragListeners } : {})}
      tabIndex={0}
      onDoubleClick={() => setEditingName(true)}
    >

      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        {editable && onNameChange && editingName ? (
          <input
            ref={inputRef}
            value={name}
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              color: "#73a32c",
              border: "none",
              outline: "none",
              fontWeight: 600,
              fontSize: 16,
              fontFamily: "inherit",
              paddingLeft: 8,
              paddingRight: 16,
              textAlign: "left",
            }}
            disabled={deleting}
            placeholder="Script Name"
          />
        ) : (
          <>
            <img
              src={ScriptIcon}
              alt="Script Icon"
              style={{
                width: 16,
                height: 16,
                marginRight: 8,
                display: "inline-block",
                verticalAlign: "middle",
              }}
            />
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: 600,
                color: "#73a32c",
                fontSize: 16,
                pl: 0,
                pr: 2,
                flex: 1,
                minWidth: 0,
                textAlign: "left",
                cursor: editable ? "default" : "default",
                userSelect: editable ? "text" : "none",
                transition: "cursor 0.1s",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            >
              {name || "Untitled Script"}
            </Typography>
          </>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: "auto" }}>
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
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete"
            sx={{ color: "#e53935" }}
            style={{ display: "inline-flex" }}
          >
            {deleting ? <CircularProgress size={18} /> : <CloseIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ScriptCardHeader;
