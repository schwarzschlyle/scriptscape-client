import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import SegmentCollectionCardBody from "../atoms/SegmentCollectionCardBody";
import SegmentCollectionHeader from "../atoms/SegmentCollectionHeader";
import Box from "@mui/material/Box";
import CardActionsArea from "../../../../components/CardActionsArea";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

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
  onGenerateVisualDirections?: () => void;
  pendingVisualDirection?: boolean;
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
  onGenerateVisualDirections,
  pendingVisualDirection,
}) => {
  const [localName, setLocalName] = useState(name || "");
  const [localSegments, setLocalSegments] = useState<{ text: string }[]>(segments.map(s => ({ text: s.text || "" })));
  // Removed editingSegmentIndex state (unused after refactor)
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
          pendingVisualDirection={pendingVisualDirection}
        />
      }
      body={
        <>
          <SegmentCollectionCardBody
            segments={segments}
            editable={editable && !isSaving && !deleting}
            isSaving={isSaving}
            deleting={deleting}
            error={error}
            onSegmentChange={onSegmentChange}
          />
          <CardActionsArea>
            <button
              style={{
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.5 : 1,
                padding: 0,
                margin: 0,
                outline: "none",
              }}
              onClick={() => {
                if (!isSaving && onGenerateVisualDirections) {
                  onGenerateVisualDirections();
                }
              }}
              aria-label="Generate Visual Directions"
              disabled={isSaving}
            >
              <img
                src={AiPromptIcon}
                alt="AI Prompt"
                style={{
                  width: 22,
                  height: 22,
                  display: "block",
                  filter: isSaving ? "grayscale(1) opacity(0.5)" : "none",
                }}
              />
            </button>
          </CardActionsArea>
        </>
      }
      minHeight={220}
      active={active}
      style={{
        marginTop: 16,
      }}
      onClick={onClick}
    />
  );
};

export default SegmentCollectionCard;
