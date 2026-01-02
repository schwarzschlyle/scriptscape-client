import React from "react";
import CustomCardBody from "../../../../components/CustomCardBody";
import Box from "@mui/material/Box";
import CardTypography from "../molecules/CardTypography";
import { useEditableList } from "../../../../hooks/useEditableList";

export interface SegmentCollectionCardBodyProps {
  segments: { id?: string; text: string }[];
  editable?: boolean;
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  onSegmentChange?: (segmentId: string, newText: string, index: number) => void;
}

const SegmentCollectionCardBody: React.FC<SegmentCollectionCardBodyProps> = ({
  segments,
  editable = true,
  isSaving = false,
  deleting = false,
  error = null,
  onSegmentChange,
}) => {
  const {
    items,
    setItemValue,
    startEditing,
    stopEditing,
    reset,
  } = useEditableList<{ id?: string; text: string }>(segments);

  React.useEffect(() => {
    reset(segments);
  }, [segments, reset]);

  return (
    <Box sx={{ pt: 2, pb: 2 }}>
      {items.map((item, idx) => (
        <Box key={segments[idx]?.id || idx} sx={{ display: "flex", alignItems: "center", mb: idx === items.length - 1 ? 0 : 1 }}>
          <CustomCardBody
            editable={item.editing && !isSaving && !deleting}
            style={{
              minHeight: 48,
              width: "100%",
              boxSizing: "border-box",
              marginTop: 0,
            }}
          >
            {item.editing ? (
              <textarea
                value={item.value.text}
                onChange={e => {
                  setItemValue(idx, { ...item.value, text: e.target.value });
                }}
                onBlur={() => {
                  stopEditing(idx);
                  if (onSegmentChange) {
                    const segmentId = segments[idx]?.id || "";
                    if (segmentId) {
                      onSegmentChange(segmentId, item.value.text, idx);
                    }
                  }
                }}
                style={{
                  width: "100%",
                  minHeight: 40,
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "monospace",
                  fontSize: 14,
                  padding: "4px 0",
                }}
                disabled={isSaving || deleting}
                placeholder={`Segment ${idx + 1}`}
                autoFocus
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  minHeight: 40,
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: 14,
                  padding: "4px 0",
                  cursor: editable && !isSaving && !deleting ? "pointer" : "default",
                  whiteSpace: "pre-wrap",
                }}
                onDoubleClick={() => {
                  if (editable && !isSaving && !deleting) startEditing(idx);
                }}
              >
                {item.value.text ? (
                  <CardTypography variant="cardBody">{item.value.text}</CardTypography>
                ) : (
                  <span style={{ color: "#888" }}>Double-click to edit</span>
                )}
              </div>
            )}
            {error && idx === 0 && (
              <Box sx={{ mt: 1, px: 2 }}>
                <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
              </Box>
            )}
          </CustomCardBody>
        </Box>
      ))}
    </Box>
  );
};

export default SegmentCollectionCardBody;
