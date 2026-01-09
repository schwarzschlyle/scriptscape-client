import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";
import CardStatusDot from "./CardStatusDot";

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
                color: "#fff",
                border: "1px solid #444",
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
            <button
              style={{
                background: "none",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                margin: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onExpandedChange(!expanded);
              }}
              aria-label={expanded ? "Use fixed height" : "Use full height"}
            >
              <img src={AiPromptIcon} alt="Expand/Collapse" style={{ width: 18, height: 18, opacity: 0.9 }} />
            </button>
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

