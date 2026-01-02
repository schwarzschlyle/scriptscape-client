import React from "react";
import EditableCardContentArea from "./EditableCardContentArea";
import Box from "@mui/material/Box";

export interface VisualDirectionCardBodyProps {
  visuals: { id?: string; content: string }[];
  editable?: boolean;
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  onVisualChange?: (visualId: string, newContent: string, index: number) => void;
}

const VisualDirectionCardBody: React.FC<VisualDirectionCardBodyProps> = ({
  visuals,
  editable = true,
  isSaving = false,
  deleting = false,
  error = null,
  onVisualChange,
}) => {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [localVisuals, setLocalVisuals] = React.useState(visuals.map(v => v.content || ""));

  React.useEffect(() => {
    setLocalVisuals(visuals.map(v => v.content || ""));
    setEditingIndex(null);
  }, [visuals]);

  return (
    <Box sx={{ pt: 2, pb: 2 }}>
      {visuals.map((visual, idx) => (
        <Box key={visual.id || idx} sx={{ display: "flex", alignItems: "center", mb: idx === visuals.length - 1 ? 0 : 1 }}>
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
                  onVisualChange(visualId, localVisuals[idx], idx);
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
