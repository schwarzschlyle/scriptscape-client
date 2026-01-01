import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import SegmentIcon from "../../../../assets/segment-icon.svg";
import { useEditableField } from "../../../../hooks/useEditableField";

interface SegmentCollectionHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting?: boolean;
  isSaving?: boolean;
  segmentsCount?: number;
  onDelete?: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  editable?: boolean;
}

const SegmentCollectionHeader: React.FC<SegmentCollectionHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  isSaving = false,
  segmentsCount,
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

  // Allow double-click to start editing
  const handleDoubleClick = () => {
    if (editable) startEditing();
  };

  return (
    <div onDoubleClick={handleDoubleClick}>
      <CustomCardHeader
        title={
          editing
            ? (
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
              )
            : (
                <span>
                  <span style={{ color: "#abf43e" }}>
                    [Segments]
                    {typeof segmentsCount === "number" && (
                      <> ({segmentsCount})</>
                    )}
                  </span>
                  {" "}
                  <span style={{ color: "#fff" }}>
                    {localName || "Untitled Segment Collection"}
                  </span>
                </span>
              )
        }
        icon={
          <img
            src={SegmentIcon}
            alt="Segment Icon"
            style={{
              width: 16,
              height: 16,
              marginRight: 8,
              display: "inline-block",
              verticalAlign: "middle",
            }}
          />
        }
        editable={editable}
        editing={editing}
        onEditStart={startEditing}
        onEditEnd={() => {}} // not used, handled by hook
        deleting={deleting}
        isSaving={isSaving}
        onDelete={onDelete}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        active={active}
        inputRef={inputRef}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isSaving
                  ? "#ff9800"
                  : active
                  ? "#abf43e"
                  : "#6a6967",
                marginRight: 8,
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

export default SegmentCollectionHeader;
