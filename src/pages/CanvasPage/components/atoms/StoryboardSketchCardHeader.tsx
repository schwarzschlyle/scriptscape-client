import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";

interface StoryboardSketchCardHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting?: boolean;
  isSaving?: boolean;
  sketchesCount?: number;
  onDelete?: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  editable?: boolean;
  pendingSketches?: boolean;
}

const StoryboardSketchCardHeader: React.FC<StoryboardSketchCardHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  isSaving = false,
  sketchesCount,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  editable = false,
  pendingSketches = false,
}) => {
  const {
    value: localName,
    editing,
    inputRef,
    startEditing,
    handleChange,
    handleBlur,
    handleKeyDown,
  } = useEditableField(name || "", onNameChange);

  const handleDoubleClick = () => {
    if (editable) startEditing();
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

  return (
    <div onDoubleClick={handleDoubleClick}>
      <CustomCardHeader
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
              <CardTypography variant="cardType">
                {localName || "Storyboard Sketches"}
                {typeof sketchesCount === "number" ? ` (${sketchesCount})` : ""}
              </CardTypography>
            </span>
          )
        }
        icon={null}
        editable={editable}
        editing={editing}
        onEditStart={startEditing}
        onEditEnd={() => {}}
        deleting={deleting}
        isSaving={isSaving}
        onDelete={onDelete}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        active={active}
        inputRef={inputRef}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            {pendingSketches ? (
              blueDot
            ) : (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: isSaving ? "#ff9800" : active ? "#abf43e" : "#6a6967",
                  marginRight: 0,
                  border: "1.5px solid #232523",
                  transition: "background 0.2s",
                }}
              />
            )}
          </div>
        }
      />
    </div>
  );
};

export default StoryboardSketchCardHeader;

