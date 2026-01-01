import React from "react";
import Box from "@mui/material/Box";
import SegmentCollectionCard from "./SegmentCollectionCard";
import { useDraggable } from "@dnd-kit/core";

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
  onGenerateVisualDirection?: () => void;
  pendingVisualDirection?: boolean;
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
  onGenerateVisualDirection,
  pendingVisualDirection,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: col.id,
  });

  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_WIDTH,
        minWidth: 0,
        m: 0,
        flex: "0 1 auto",
        zIndex: 50,
        boxShadow: 2,
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
        onGenerateVisualDirection={typeof onGenerateVisualDirection === "function" ? onGenerateVisualDirection : undefined}
        pendingVisualDirection={pendingVisualDirection}
      />
    </Box>
  );
};

export default DraggableSegmentCollectionCard;
