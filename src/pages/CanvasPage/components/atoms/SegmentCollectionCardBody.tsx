import React from "react";
import EditableCardContentArea from "./EditableCardContentArea";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

function formatIndex(idx: number) {
  return String(idx + 1).padStart(2, "0");
}

export interface SegmentCollectionCardBodyProps {
  segments: { id?: string; text: string }[];
  editable?: boolean;
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  onSegmentChange?: (segmentId: string, newText: string, index: number) => void;
  extraBottomPadding?: boolean;
}

const SegmentCollectionCardBody: React.FC<SegmentCollectionCardBodyProps> = ({
  segments,
  editable = true,
  isSaving = false,
  deleting = false,
  error = null,
  onSegmentChange,
  extraBottomPadding = false,
}) => {
  const theme = useTheme();
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [localSegments, setLocalSegments] = React.useState(segments.map(s => s.text || ""));

  React.useEffect(() => {
    setLocalSegments(segments.map(s => s.text || ""));
    setEditingIndex(null);
  }, [segments]);

  return (
    <Box sx={{ pt: 2, pb: extraBottomPadding ? 8 : 2 }}>
      {segments.map((segment, idx) => (
        <Box
          key={segment.id || idx}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            mb: idx === segments.length - 1 ? 0 : "2px",
          }}
        >
          <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
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
                    const nextText = localSegments[idx];
                    const prevText = segment.text || "";
                    if (nextText !== prevText) onSegmentChange(segmentId, nextText, idx);
                  }
                }
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 6,
                right: 10,
                color: theme.palette.text.secondary,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
              aria-label={`Segment ${idx + 1}`}
            >
              {formatIndex(idx)}
            </Box>
          </Box>
          {error && idx === 0 && (
            <Box sx={{ mt: 1, px: 2 }}>
              <span style={{ color: theme.palette.error.main, fontSize: 13 }}>{error}</span>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default SegmentCollectionCardBody;
