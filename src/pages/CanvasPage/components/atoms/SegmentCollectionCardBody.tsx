import React from "react";
import EditableCardContentArea from "./EditableCardContentArea";
import Box from "@mui/material/Box";

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
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [localSegments, setLocalSegments] = React.useState(segments.map(s => s.text || ""));

  React.useEffect(() => {
    setLocalSegments(segments.map(s => s.text || ""));
    setEditingIndex(null);
  }, [segments]);

  return (
    <Box sx={{ pt: 2, pb: 2 }}>
      {segments.map((segment, idx) => (
        <Box key={segment.id || idx} sx={{ display: "flex", alignItems: "center", mb: idx === segments.length - 1 ? 0 : 1 }}>
          <EditableCardContentArea
            value={localSegments[idx]}
            editable={editingIndex === idx && !isSaving && !deleting}
            minHeight={60}
            onChange={val => {
              setLocalSegments(ls => ls.map((t, i) => (i === idx ? val : t)));
            }}
            onRequestEdit={() => {
              if (editable && !isSaving && !deleting) setEditingIndex(idx);
            }}
            onBlur={() => {
              setEditingIndex(null);
              if (onSegmentChange) {
                const segmentId = segment.id || "";
                if (segmentId) {
                  onSegmentChange(segmentId, localSegments[idx], idx);
                }
              }
            }}
          />
          {error && idx === 0 && (
            <Box sx={{ mt: 1, px: 2 }}>
              <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default SegmentCollectionCardBody;
