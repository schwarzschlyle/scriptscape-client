import React from "react";
import Box from "@mui/material/Box";
import VisualDirectionCard from "./VisualDirectionCard";
import { useDraggable } from "@dnd-kit/core";

const CARD_WIDTH = 340;

interface DraggableVisualDirectionCardProps {
  visual: any;
  position: { x: number; y: number };
  active: boolean;
  setActive: (id: string) => void;
  onNameChange: (visualId: string, newName: string) => void;
  onVisualChange: (visualId: string, newContent: string, index: number) => void;
  onDelete: (visualId: string) => void;
  isSaving?: boolean;
  deleting?: boolean;
  dragDelta?: { x: number; y: number } | null;
  pendingVisualDirection?: boolean;
  onGenerateStoryboardSketches?: (instructions?: string) => void;
  pendingStoryboardSketches?: boolean;
}

const DraggableVisualDirectionCard: React.FC<DraggableVisualDirectionCardProps> = ({
  visual,
  position,
  active,
  setActive,
  onNameChange,
  onVisualChange,
  onDelete,
  isSaving,
  deleting,
  dragDelta,
  pendingVisualDirection,
  onGenerateStoryboardSketches,
  pendingStoryboardSketches,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: visual.id,
  });

  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      onPointerDown={() => setActive(visual.id)}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_WIDTH,
        minWidth: 0,
        m: 0,
        flex: "0 1 auto",
        zIndex: active ? 1000 : 50,
        boxShadow: 2,
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <VisualDirectionCard
        name={visual.name || ""}
        visuals={visual.visuals}
        isSaving={isSaving}
        deleting={deleting}
        active={active}
        onClick={() => setActive(visual.id)}
        onNameChange={newName => onNameChange(visual.id, newName)}
        onVisualChange={(visualId, newContent, idx) => onVisualChange(visualId, newContent, idx)}
        onDelete={() => onDelete(visual.id)}
        pendingVisualDirection={pendingVisualDirection}
        onGenerateStoryboardSketches={onGenerateStoryboardSketches}
        pendingStoryboardSketches={pendingStoryboardSketches}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </Box>
  );
};

export default DraggableVisualDirectionCard;
