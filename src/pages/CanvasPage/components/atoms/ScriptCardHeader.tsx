import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import CardStatusDot from "./CardStatusDot";
import { useTheme } from "@mui/material/styles";

interface ScriptCardHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting: boolean;
  isSaving?: boolean;
  onDelete: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  onClick?: () => void;
  editable?: boolean;
  pendingSegmentCollection?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const ScriptCardHeader: React.FC<ScriptCardHeaderProps> = (props) => {
  const theme = useTheme();
  const {
    pendingSegmentCollection,
    onNameChange,
    expanded,
    onExpandedChange,
    ...headerProps
  } = props;

  const {
    value: localName,
    editing,
    inputRef,
    startEditing,
    handleChange,
    handleBlur,
    handleKeyDown,
  } = useEditableField(props.name || "", onNameChange);

  // Allow double-click to start editing
  const handleDoubleClick = () => {
    if (props.editable) startEditing();
  };

  // console.log("ScriptCardHeader", props.name, "pendingSegmentCollection:", props.pendingSegmentCollection);

  return (
    <div onDoubleClick={handleDoubleClick}>
      <CustomCardHeader
        {...headerProps}
        title={
          editing ? (
            <input
              ref={inputRef}
              value={localName}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: 16,
                fontWeight: 600,
                background: "transparent",
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                padding: "2px 8px",
                width: "90%",
              }}
              autoFocus
            />
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img
                src={ScriptIcon}
                alt="Script Icon"
                style={{
                  width: 16,
                  height: 16,
                  marginRight: 4,
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
              <CardTypography variant="cardType">{localName || "Untitled Script"}</CardTypography>
            </span>
          )
        }
        icon={null}
        actionsLeft={
          onExpandedChange ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onExpandedChange(!expanded);
              }}
              // must not initiate drag
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{
                color: theme.palette.text.primary,
                p: 0.25,
                mr: 0.5,
              }}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          ) : null
        }
        actions={
          <Box sx={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            <CardStatusDot
              status={
                props.pendingSegmentCollection
                  ? "pending"
                  : props.isSaving
                  ? "saving"
                  : props.active
                  ? "active"
                  : "idle"
              }
            />
          </Box>
        }
        editable={props.editable}
        editing={editing}
        onEditStart={startEditing}
        onEditEnd={() => {}} // not used, handled by hook
        inputRef={inputRef}
      />
    </div>
  );
};

export default ScriptCardHeader;
