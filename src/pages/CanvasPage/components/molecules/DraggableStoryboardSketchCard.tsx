import React from "react";
import Box from "@mui/material/Box";
import { useDraggable } from "@dnd-kit/core";
import StoryboardSketchCard from "./StoryboardSketchCard";

const CARD_WIDTH = 340;

interface DraggableStoryboardSketchCardProps {
  storyboard: any;
  position: { x: number; y: number };
  active: boolean;
  setActive: (id: string) => void;
  onNameChange: (storyboardId: string, newName: string) => void;
  onDelete: (storyboardId: string) => void;
  isSaving?: boolean;
  deleting?: boolean;
  dragDelta?: { x: number; y: number } | null;
  pendingSketches?: boolean;
}

const DraggableStoryboardSketchCard: React.FC<DraggableStoryboardSketchCardProps> = ({
  storyboard,
  position,
  active,
  setActive,
  onNameChange,
  onDelete,
  isSaving,
  deleting,
  dragDelta,
  pendingSketches,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: storyboard.id,
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
      <StoryboardSketchCard
        name={storyboard.name || "Storyboard"}
        sketches={storyboard.sketches || []}
        isSaving={isSaving}
        deleting={deleting}
        error={storyboard.error}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        editable={!isSaving && !deleting}
        onClick={() => setActive(storyboard.id)}
        onNameChange={(newName) => onNameChange(storyboard.id, newName)}
        onDelete={() => onDelete(storyboard.id)}
        pendingSketches={pendingSketches}
      />
    </Box>
  );
};

export default DraggableStoryboardSketchCard;

