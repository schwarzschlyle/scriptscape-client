import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import ScriptIcon from "../../../../assets/script-icon.svg";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

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

const ScriptCardHeader: React.FC<ScriptCardHeaderProps> = (props) => {
  const [editing, setEditing] = React.useState(false);
  const [localName, setLocalName] = React.useState(props.name || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Keep localName in sync with prop when not editing
  React.useEffect(() => {
    if (!editing) setLocalName(props.name || "");
  }, [props.name, editing]);

  // Only exit editing on blur or Enter
  const handleBlur = () => {
    setEditing(false);
    if (localName !== props.name && props.onNameChange) {
      props.onNameChange(localName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setEditing(false);
      if (localName !== props.name && props.onNameChange) {
        props.onNameChange(localName);
      }
    }
  };

  // Allow double-click to start editing
  const handleDoubleClick = () => {
    if (props.editable) setEditing(true);
  };

  return (
    <div onDoubleClick={handleDoubleClick}>
      <CustomCardHeader
        {...props}
        title={
          editing ? (
            <input
              ref={inputRef}
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: 16,
                fontWeight: 600,
                background: "transparent",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: 4,
                padding: "2px 8px",
                width: "90%",
              }}
              autoFocus
            />
          ) : localName || "Untitled Script"
        }
        icon={
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
        }
        actions={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: "auto" }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: props.active ? "#abf43e" : "#6a6967",
                marginRight: 1,
                border: "1.5px solid #232523",
              }}
            />
          </Box>
        }
        editable={props.editable}
        editing={editing}
        onEditStart={() => setEditing(true)}
        onEditEnd={() => setEditing(false)}
        inputRef={inputRef}
      />
    </div>
  );
};

export default ScriptCardHeader;
