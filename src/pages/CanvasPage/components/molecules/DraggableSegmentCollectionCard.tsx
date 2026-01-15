import React from "react";
import Box from "@mui/material/Box";
import SegmentCollectionCard from "./SegmentCollectionCard";
import { useDraggable } from "@dnd-kit/core";
import type { SpawnSide } from "./cardSpawn";

const CARD_WIDTH = 340;

interface DraggableSegmentCollectionCardProps {
  col: any;
  position: { x: number; y: number };
  active: boolean;
  setActive: (id: string) => void;
  onNameChange: (colId: string, newName: string) => void;
  onSegmentChange: (colId: string, segmentId: string, newText: string, index: number) => void;
  onDelete: (colId: string) => void;
  isSaving?: boolean;
  deleting?: boolean;
  dragDelta?: { x: number; y: number } | null;
  onGenerateVisualDirections?: () => void;
  onGenerateVisualDirectionsAt?: (side: SpawnSide) => void;
  pendingVisualDirection?: boolean;
  generating?: boolean;
}

const DraggableSegmentCollectionCard: React.FC<DraggableSegmentCollectionCardProps> = ({
  col,
  position,
  active,
  setActive,
  onNameChange,
  onSegmentChange,
  onDelete,
  isSaving,
  deleting,
  dragDelta,
  onGenerateVisualDirections,
  onGenerateVisualDirectionsAt,
  pendingVisualDirection,
  generating,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: col.id,
  });

  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      onPointerDown={() => setActive(col.id)}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_WIDTH,
        minWidth: 0,
        m: 0,
        flex: "0 1 auto",
        zIndex: active ? 1000 : 50,
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SegmentCollectionCard
        name={col.name}
        segments={col.segments}
        isSaving={isSaving}
        deleting={deleting}
        error={col.error}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        editable={!isSaving && !deleting}
        onClick={() => setActive(col.id)}
        onNameChange={(newName) => onNameChange(col.id, newName)}
        onSegmentChange={(segmentId, newText, idx) => onSegmentChange(col.id, segmentId, newText, idx)}
        onDelete={() => onDelete(col.id)}
        onGenerateVisualDirections={typeof onGenerateVisualDirections === "function" ? onGenerateVisualDirections : undefined}
        onGenerateVisualDirectionsAt={onGenerateVisualDirectionsAt}
        pendingVisualDirection={pendingVisualDirection}
        generating={generating}
      />
    </Box>
  );
};

export default DraggableSegmentCollectionCard;
