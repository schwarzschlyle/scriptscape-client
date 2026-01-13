import React from "react";
import EditableCardContentArea from "./EditableCardContentArea";
import Box from "@mui/material/Box";

function formatIndex(idx: number) {
  return String(idx + 1).padStart(2, "0");
}

export interface VisualDirectionCardBodyProps {
  visuals: { id?: string; content: string }[];
  editable?: boolean;
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  onVisualChange?: (visualId: string, newContent: string, index: number) => void;
  extraBottomPadding?: boolean;
}

const VisualDirectionCardBody: React.FC<VisualDirectionCardBodyProps> = ({
  visuals,
  editable = true,
  isSaving = false,
  deleting = false,
  error = null,
  onVisualChange,
  extraBottomPadding = false,
}) => {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [localVisuals, setLocalVisuals] = React.useState(visuals.map(v => v.content || ""));

  React.useEffect(() => {
    setLocalVisuals(visuals.map(v => v.content || ""));
    setEditingIndex(null);
  }, [visuals]);

  return (
    <Box sx={{ pt: 2, pb: extraBottomPadding ? 8 : 2 }}>
      {visuals.map((visual, idx) => (
        <Box
          key={visual.id || idx}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            mb: idx === visuals.length - 1 ? 0 : "2px",
          }}
        >
          <Box
            sx={{
              width: 26,
              minWidth: 26,
              mr: 1,
              alignSelf: "flex-start",
              pt: "8px",
              color: "rgba(255,255,255,0.70)",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              lineHeight: 1,
              textAlign: "left",
            }}
            aria-label={`Visual ${idx + 1}`}
          >
            {formatIndex(idx)}
          </Box>
          <EditableCardContentArea
            value={localVisuals[idx]}
            editable={editingIndex === idx && !isSaving && !deleting}
            minHeight={60}
            onChange={val => {
              setLocalVisuals(lv => lv.map((t, i) => (i === idx ? val : t)));
            }}
            onRequestEdit={() => {
              if (editable && !isSaving && !deleting) setEditingIndex(idx);
            }}
            onBlur={() => {
              setEditingIndex(null);
              if (onVisualChange) {
                const visualId = visual.id || "";
                if (visualId) {
                  const nextText = localVisuals[idx];
                  const prevText = visual.content || "";
                  if (nextText !== prevText) onVisualChange(visualId, nextText, idx);
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

export default VisualDirectionCardBody;
