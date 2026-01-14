import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import SegmentCollectionCardBody from "../atoms/SegmentCollectionCardBody";
import SegmentCollectionHeader from "../atoms/SegmentCollectionHeader";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";
import Box from "@mui/material/Box";
import CardFooter from "@components/CardFooter";

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
  /** True while this card is generating its segments (child orange dot). */
  generating?: boolean;
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
  generating = false,
}) => {
  const CARD_WIDTH = 340;
  const FIXED_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [localName, setLocalName] = useState(name || "");
  const [lastSaved, setLastSaved] = useState<{ name: string }>({ name: name || "" });

  React.useEffect(() => {
    setLocalName(name || "");
    setLastSaved({ name: name || "" });
  }, [name]);

  React.useEffect(() => {
    if (!active && localName !== lastSaved.name) {
      onNameChange?.(localName);
      setLastSaved({ name: localName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div style={{ position: "relative" }}>
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
            generating={generating}
            deleteDisabled={!!pendingVisualDirection}
            expanded={isFullHeight}
            onExpandedChange={setIsFullHeight}
          />
        }
        body={
          <>
            <Box
              className={isFullHeight ? undefined : "canvas-scrollbar"}
              sx={{
                flex: 1,
                overflowY: isFullHeight ? "visible" : "auto",
              }}
            >
              <SegmentCollectionCardBody
                segments={segments}
                editable={editable && !isSaving && !deleting}
                isSaving={isSaving}
                deleting={deleting}
                error={error}
                onSegmentChange={onSegmentChange}
              />
            </Box>
            <CardFooter
              left={null}
              center={null}
              right={
                <>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isSaving || generating || pendingVisualDirection ? "not-allowed" : "pointer",
                      opacity: isSaving || generating || pendingVisualDirection ? 0.5 : 1,
                      padding: 0,
                      margin: 0,
                      outline: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSaving && !generating && !pendingVisualDirection && onGenerateVisualDirections) {
                        onGenerateVisualDirections();
                      }
                    }}
                    aria-label="Generate Visual Directions"
                    disabled={isSaving || generating || pendingVisualDirection}
                  >
                    <img
                      src={AiPromptIcon}
                      alt="AI Prompt"
                      style={{
                        width: 22,
                        height: 22,
                        display: "block",
                        filter: isSaving || generating || pendingVisualDirection ? "grayscale(1) opacity(0.5)" : "none",
                      }}
                    />
                  </button>
                </>
              }
            />
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
      />
    </div>
  );
};

export default SegmentCollectionCard;
