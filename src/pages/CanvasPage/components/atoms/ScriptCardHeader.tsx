import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import { useEditableField } from "../../../../hooks/useEditableField";
import { keyframes } from "@mui/system";
import CardTypography from "../molecules/CardTypography";

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
}

const ScriptCardHeader: React.FC<ScriptCardHeaderProps> = (props) => {
  const {
    pendingSegmentCollection,
    onNameChange,
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

  const blinkBlueDot = keyframes`
    0% { opacity: 1; }
    100% { opacity: 0.3; }
  `;
  const blueDot = (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2196f3 60%, #21cbf3 100%)",
        marginRight: 0,
        border: "1.5px solid #232523",
        animation: `${blinkBlueDot} 1s infinite alternate`,
        transition: "background 0.2s",
        display: "inline-block",
      }}
    />
  );

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
              <CardTypography variant="cardType">Script Input</CardTypography>
              <CardTypography variant="cardTitle">{localName || "Untitled Script"}</CardTypography>
            </span>
          )
        }
        icon={null}
        actions={
          <Box sx={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            {props.pendingSegmentCollection ? (
              blueDot
            ) : (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: props.isSaving
                    ? "#ff9800"
                    : props.active
                    ? "#abf43e"
                    : "#6a6967",
                  marginRight: 0,
                  border: "1.5px solid #232523",
                  transition: "background 0.2s",
                  display: "inline-block",
                }}
              />
            )}
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
