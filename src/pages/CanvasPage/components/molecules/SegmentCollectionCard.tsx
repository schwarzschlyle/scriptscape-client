import React, { useState } from "react";
import CustomCard from "../../../../components/CustomCard";
import SegmentCollectionCardBody from "../atoms/SegmentCollectionCardBody";
import SegmentCollectionHeader from "../atoms/SegmentCollectionHeader";
import Box from "@mui/material/Box";
import RadialAddButton from "@components/RadialAddButton";
import CardFooter from "@components/CardFooter";
import LoadingSpinner from "@components/LoadingSpinner";
import Typography from "@mui/material/Typography";

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
  onGenerateVisualDirectionsAt?: (side: import("./cardSpawn").SpawnSide) => void;
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
  onGenerateVisualDirectionsAt,
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
    <div
      className="canvas-card-radials"
      data-active={active ? "true" : "false"}
      style={{ position: "relative" }}
    >
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
              {generating ? (
                <LoadingSpinner label="Generating Segments..." size={28} minHeight={FIXED_HEIGHT - 50} />
              ) : (
                <SegmentCollectionCardBody
                  segments={segments}
                  editable={editable && !isSaving && !deleting}
                  isSaving={isSaving}
                  deleting={deleting}
                  error={error}
                  onSegmentChange={onSegmentChange}
                />
              )}
            </Box>

            <CardFooter
              left={
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                  Click the (+) buttons on the edges to generate visual idea variations
                </Typography>
              }
              center={null}
              right={null}
            />
          </>
        }
        height={isFullHeight ? "auto" : FIXED_HEIGHT}
        active={active}
        onClick={onClick}
      />

      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <RadialAddButton
          key={side}
          side={side}
          disabled={isSaving || generating || pendingVisualDirection || (!onGenerateVisualDirections && !onGenerateVisualDirectionsAt)}
          ariaLabel={`Generate Visual Directions (${side})`}
          onClick={() => {
            if (isSaving || generating || pendingVisualDirection) return;
            if (onGenerateVisualDirectionsAt) {
              onGenerateVisualDirectionsAt(side);
              return;
            }
            onGenerateVisualDirections?.();
          }}
        />
      ))}
    </div>
  );
};

export default SegmentCollectionCard;
