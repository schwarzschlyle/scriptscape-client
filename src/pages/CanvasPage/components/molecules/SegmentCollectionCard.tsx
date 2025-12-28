import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import SegmentCollectionHeader from "../atoms/SegmentCollectionHeader";
import SegmentCollectionBody from "../atoms/SegmentCollectionBody";
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
  // Local state for editing name and segments
  const [localName, setLocalName] = useState(name || "");
  const [localSegments, setLocalSegments] = useState<{ text: string }[]>(segments.map(s => ({ text: s.text || "" })));
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<{ name: string; segments: { text: string }[] }>({
    name: name || "",
    segments: segments.map(s => ({ text: s.text || "" })),
  });

  // Keep local state in sync with props
  React.useEffect(() => {
    setLocalName(name || "");
    setLocalSegments(segments.map(s => ({ text: s.text || "" })));
    setLastSaved({
      name: name || "",
      segments: segments.map(s => ({ text: s.text || "" })),
    });
  }, [name, segments]);

  // Keep localSegments in sync with segments after backend save for existing collections
  React.useEffect(() => {
    if (segments && segments.length === localSegments.length) {
      setLocalSegments(segments.map(s => ({ text: s.text || "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // Auto-save on deactivation (active goes from true to false)
  React.useEffect(() => {
    if (
      !active &&
      (localName !== lastSaved.name ||
        localSegments.some((s, i) => s.text !== (lastSaved.segments[i]?.text ?? "")))
    ) {
      // For existing collections, save all changed segments on deactivate
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
        <SegmentCollectionBody editable={editable && !isSaving && !deleting}>
          {localSegments.map((segment, idx) => (
            <Box key={segments[idx]?.id || idx} sx={{ mb: 2 }}>
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
                    minHeight: 48,
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #444",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "monospace",
                    fontSize: 14,
                    padding: "8px",
                    borderRadius: 4,
                  }}
                  disabled={isSaving || deleting}
                  placeholder={`Segment ${idx + 1}`}
                  autoFocus
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    minHeight: 48,
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: 14,
                    padding: "8px",
                    cursor: editable && !isSaving && !deleting ? "pointer" : "default",
                    whiteSpace: "pre-wrap",
                  }}
                  onDoubleClick={() => {
                    if (editable && !isSaving && !deleting) setEditingSegmentIndex(idx);
                  }}
                >
                  {segment.text || <span style={{ color: "#888" }}>Double-click to edit</span>}
                </Box>
              )}
            </Box>
          ))}
          {error && (
            <Box sx={{ mt: 1, px: 2 }}>
              <span style={{ color: "#d32f2f", fontSize: 13 }}>{error}</span>
            </Box>
          )}
        </SegmentCollectionBody>
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
