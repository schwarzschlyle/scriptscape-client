import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import SegmentIcon from "../../../../assets/segment-icon.svg";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";
import CardStatusDot from "./CardStatusDot";

interface SegmentCollectionHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting?: boolean;
  isSaving?: boolean;
  segmentsCount?: number;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  editable?: boolean;
  pendingVisualDirection?: boolean;
  /** True while this SegmentCollection card is generating its segments (child orange dot). */
  generating?: boolean;
  /** True while this SegmentCollection is generating its child VisualDirection (parent blue dot). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const SegmentCollectionHeader: React.FC<SegmentCollectionHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  isSaving = false,
  segmentsCount,
  onDelete,
  deleteDisabled = false,
  dragAttributes,
  dragListeners,
  active = false,
  editable = false,
  pendingVisualDirection = false,
  generating = false,
  expanded,
  onExpandedChange,
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
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img
                    src={SegmentIcon}
                    alt="Segment Icon"
                    style={{
                      width: 16,
                      height: 16,
                      marginRight: 4,
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                  <CardTypography variant="cardType">
                    {localName || "Untitled Segment Collection"}
                    {typeof segmentsCount === "number" ? ` (${segmentsCount})` : ""}
                  </CardTypography>
                </span>
              )
        }
        icon={null}
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
        deleteDisabled={deleteDisabled}
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
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={expanded ? "Use fixed height" : "Use full height"}
            >
              <img src={AiPromptIcon} alt="Expand/Collapse" style={{ width: 18, height: 18, opacity: 0.9 }} />
            </button>
          ) : null
        }
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            <CardStatusDot
              status={
                generating
                  ? "generating"
                  : pendingVisualDirection
                  ? "pending"
                  : isSaving
                  ? "saving"
                  : active
                  ? "active"
                  : "idle"
              }
            />
          </div>
        }
      />
    </div>
  );
};

export default SegmentCollectionHeader;

