import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import CustomCardBody from "../../../../components/CustomCardBody";
import SegmentCollectionHeader from "../atoms/SegmentCollectionHeader";
import Box from "@mui/material/Box";

interface Segment {
  id?: string;
  tempId?: string;
  text: string;
  segmentIndex?: number;
}

interface SegmentCollectionCardProps {
  name: string;
  segments: Segment[];
  isSaving?: boolean;
  deleting?: boolean;
  error?: string | null;
  active?: boolean;
  editable?: boolean;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  onClick?: () => void;
  onNameChange?: (name: string) => void;
  onSegmentChange?: (segmentId: string, newText: string, index: number) => void;
  onDelete?: () => void;
}

const SegmentCollectionCard: React.FC<SegmentCollectionCardProps> = ({
  name,
  segments,
  isSaving = false,
  deleting = false,
  error = null,
  active = false,
  editable = true,
  dragAttributes,
  dragListeners,
  onClick,
  onNameChange,
  onSegmentChange,
  onDelete,
}) => {
  const [localName, setLocalName] = useState(name || "");
  const [localSegments, setLocalSegments] = useState<{ text: string }[]>(segments.map(s => ({ text: s.text || "" })));
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<{ name: string; segments: { text: string }[] }>({
    name: name || "",
    segments: segments.map(s => ({ text: s.text || "" })),
  });

  React.useEffect(() => {
    setLocalName(name || "");
    setLocalSegments(segments.map(s => ({ text: s.text || "" })));
    setLastSaved({
      name: name || "",
      segments: segments.map(s => ({ text: s.text || "" })),
    });
  }, [name, segments]);

  React.useEffect(() => {
    if (segments && segments.length === localSegments.length) {
      setLocalSegments(segments.map(s => ({ text: s.text || "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  React.useEffect(() => {
    if (
      !active &&
      (localName !== lastSaved.name ||
        localSegments.some((s, i) => s.text !== (lastSaved.segments[i]?.text ?? "")))
    ) {
      if (onNameChange && localName !== lastSaved.name) {
        onNameChange(localName);
      }
      if (onSegmentChange) {
        localSegments.forEach((seg, idx) => {
          if (seg.text !== (lastSaved.segments[idx]?.text ?? "")) {
            const segmentId = segments[idx]?.id || "";
            if (segmentId) {
              onSegmentChange(segmentId, seg.text, idx);
            }
          }
        });
      }
      setLastSaved({ name: localName, segments: [...localSegments] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <CustomCard
      header={
        <SegmentCollectionHeader
          name={localName}
          onNameChange={setLocalName}
          deleting={deleting}
          isSaving={isSaving}
          segmentsCount={segments.length}
          onDelete={onDelete}
          dragAttributes={dragAttributes}
          dragListeners={dragListeners}
          active={active}
          editable={editable && !isSaving && !deleting}
        />
      }
      body={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "stretch",
            width: "100%",
            py: 1,
          }}
        >
          {localSegments.map((segment, idx) => (
            <CustomCardBody
              key={segments[idx]?.id || idx}
              style={{
                minHeight: 48,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {editingSegmentIndex === idx ? (
                <textarea
                  value={localSegments[idx].text}
                  onChange={e => {
                    setLocalSegments(ls =>
                      ls.map((s, i) => (i === idx ? { ...s, text: e.target.value } : s))
                    );
                  }}
                  onBlur={() => {
                    setEditingSegmentIndex(null);
                    // For existing collections, call onSegmentChange on blur
                    if (onSegmentChange) {
                      const segmentId = segments[idx]?.id || "";
                      if (segmentId) {
                        onSegmentChange(segmentId, localSegments[idx].text, idx);
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
                    if (editable && !isSaving && !deleting) setEditingSegmentIndex(idx);
                  }}
                >
                  {segment.text || <span style={{ color: "#888" }}>Double-click to edit</span>}
                </div>
              )}
            </CustomCardBody>
          ))}
          {error && (
            <Box sx={{ mt: 1, px: 2 }}>
              <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
            </Box>
          )}
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

export default SegmentCollectionCard;
