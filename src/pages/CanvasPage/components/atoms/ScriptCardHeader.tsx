import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import { useEditableField } from "../../../../hooks/useEditableField";
import { keyframes } from "@mui/system";

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
  } = useEditableField(props.name || "", props.onNameChange);

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
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2196f3 60%, #21cbf3 100%)",
        marginRight: 1,
        border: "2px solid #fff",
        boxShadow: "0 0 8px 2px #2196f3aa",
        animation: `${blinkBlueDot} 1s infinite alternate`,
      }}
    />
  );

  console.log("ScriptCardHeader", props.name, "pendingSegmentCollection:", props.pendingSegmentCollection);

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
          props.pendingSegmentCollection
            ? blueDot
            : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: "auto" }}>
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
                    marginRight: 1,
                    border: "1.5px solid #232523",
                    transition: "background 0.2s",
                  }}
                />
              </Box>
            )
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
