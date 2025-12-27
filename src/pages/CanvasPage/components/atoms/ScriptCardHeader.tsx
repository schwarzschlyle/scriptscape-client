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
  // Script-specific icon and status dot
  return (
    <CustomCardHeader
      {...props}
      title={props.name || "Untitled Script"}
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
    />
  );
};

export default ScriptCardHeader;
