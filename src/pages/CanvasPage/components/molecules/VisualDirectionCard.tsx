import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import CustomCardBody from "../../../../components/CustomCardBody";
import VisualDirectionCardHeader from "../atoms/VisualDirectionCardHeader";
import Box from "@mui/material/Box";
import CardTypography from "../molecules/CardTypography";

interface VisualDirection {
  id?: string;
  tempId?: string;
  content: string;
  visualIndex?: number;
}

interface VisualDirectionCardProps {
  name: string;
  visuals: VisualDirection[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  active?: boolean;
  editable?: boolean;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  onClick?: () => void;
  onNameChange?: (name: string) => void;
  onVisualChange?: (visualId: string, newContent: string, index: number) => void;
  onDelete?: () => void;
  pendingVisualDirection?: boolean;
}

const VisualDirectionCard: React.FC<VisualDirectionCardProps> = ({
  name,
  visuals,
  isSaving = false,
  deleting = false,
  error = null,
  active = false,
  editable = true,
  dragAttributes,
  dragListeners,
  onClick,
  onNameChange,
  onVisualChange,
  onDelete,
  pendingVisualDirection = false,
}) => {
  const [localName, setLocalName] = useState(name || "");
  const [localVisuals, setLocalVisuals] = useState<{ content: string }[]>(visuals.map(v => ({ content: v.content || "" })));
  const [editingVisualIndex, setEditingVisualIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<{ name: string; visuals: { content: string }[] }>({
    name: name || "",
    visuals: visuals.map(v => ({ content: v.content || "" })),
  });

  React.useEffect(() => {
    setLocalName(name || "");
    setLocalVisuals(visuals.map(v => ({ content: v.content || "" })));
    setLastSaved({
      name: name || "",
      visuals: visuals.map(v => ({ content: v.content || "" })),
    });
  }, [name, visuals]);

  React.useEffect(() => {
    if (visuals && visuals.length === localVisuals.length) {
      setLocalVisuals(visuals.map(v => ({ content: v.content || "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visuals]);

  React.useEffect(() => {
    if (
      !active &&
      (localName !== lastSaved.name ||
        localVisuals.some((v, i) => v.content !== (lastSaved.visuals[i]?.content ?? "")))
    ) {
      if (onNameChange && localName !== lastSaved.name) {
        onNameChange(localName);
      }
      if (onVisualChange) {
        localVisuals.forEach((vis, idx) => {
          if (vis.content !== (lastSaved.visuals[idx]?.content ?? "")) {
            const visualId = visuals[idx]?.id || "";
            if (visualId) {
              onVisualChange(visualId, vis.content, idx);
            }
          }
        });
      }
      setLastSaved({ name: localName, visuals: [...localVisuals] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <CustomCard
      header={
        <VisualDirectionCardHeader
          name={localName}
          onNameChange={setLocalName}
          deleting={deleting}
          isSaving={isSaving}
          visualsCount={visuals.length}
          onDelete={onDelete}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          active={active}
          editable={editable && !isSaving && !deleting}
          pendingVisualDirection={pendingVisualDirection}
        />
      }
      body={
        <Box sx={{ pt: 2, pb: 2 }}>
          {localVisuals.map((visual, idx) => (
            <CustomCardBody
              key={visuals[idx]?.id || idx}
              editable={editingVisualIndex === idx && !isSaving && !deleting}
              style={{
                minHeight: 48,
                width: "100%",
                boxSizing: "border-box",
                marginBottom: idx === localVisuals.length - 1 ? 0 : 1,
                marginTop: 0,
              }}
            >
              {editingVisualIndex === idx ? (
                <textarea
                  value={localVisuals[idx].content}
                  onChange={e => {
                    setLocalVisuals(lv =>
                      lv.map((v, i) => (i === idx ? { ...v, content: e.target.value } : v))
                    );
                  }}
                  onBlur={() => {
                    setEditingVisualIndex(null);
                    if (onVisualChange) {
                      const visualId = visuals[idx]?.id || "";
                      if (visualId) {
                        onVisualChange(visualId, localVisuals[idx].content, idx);
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
                  placeholder={`Visual Direction ${idx + 1}`}
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
                    if (editable && !isSaving && !deleting) setEditingVisualIndex(idx);
                  }}
                >
                  {visual.content ? (
                    <CardTypography variant="cardBody">{visual.content}</CardTypography>
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
          ))}
        </Box>
      }
      minHeight={180}
      active={active}
      style={{
        marginTop: 16,
      }}
      onClick={onClick}
    />
  );
};

export default VisualDirectionCard;
