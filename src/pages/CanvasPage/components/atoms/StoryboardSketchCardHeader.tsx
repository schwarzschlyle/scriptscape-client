import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";

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

  // NOTE: storyboard sketch cards are children; per rules, only the parent card shows the blue dot while generating.

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
          </div>
        }
      />
    </div>
  );
};

export default StoryboardSketchCardHeader;
