import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";
import { useEditableField } from "../../../../hooks/useEditableField";
import CardTypography from "../molecules/CardTypography";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";
import VisualIcon from "../../../../assets/segment-icon.svg"; // Use a visual icon if available

interface VisualDirectionCardHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting?: boolean;
  isSaving?: boolean;
  visualsCount?: number;
  onDelete?: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  editable?: boolean;
  pendingVisualDirection?: boolean;
  pendingStoryboardSketches?: boolean;
}

const VisualDirectionCardHeader: React.FC<VisualDirectionCardHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  isSaving = false,
  visualsCount,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  editable = false,
  pendingVisualDirection = false,
  pendingStoryboardSketches = false,
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
                    src={VisualIcon}
                    alt="Visual Icon"
                    style={{
                      width: 16,
                      height: 16,
                      marginRight: 4,
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                  <CardTypography variant="cardType">
                    {localName || "Visual Direction"}
                    {typeof visualsCount === "number" ? ` (${visualsCount})` : ""}
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
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
            {pendingVisualDirection || pendingStoryboardSketches ? (
              blueDot
            ) : (
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

export default VisualDirectionCardHeader;
