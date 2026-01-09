import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import ScriptIcon from "../../../../assets/script-icon.svg";
import Box from "@mui/material/Box";
import CardStatusDot from "./CardStatusDot";

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
  /** True when this storyboard card itself is generating sketches (child orange dot). */
  generating?: boolean;
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
  generating = false,
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

  // NOTE: storyboard sketch cards are children; per rules, the child card shows ORANGE while generating sketches.

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
              <img
                src={ScriptIcon}
                alt="Storyboard Icon"
                style={{
                  width: 16,
                  height: 16,
                  marginRight: 4,
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
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
          <Box sx={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            <CardStatusDot
              status={generating ? "generating" : isSaving ? "saving" : active ? "active" : "idle"}
            />
          </Box>
        }
      />
    </div>
  );
};

export default StoryboardSketchCardHeader;

