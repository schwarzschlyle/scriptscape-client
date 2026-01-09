import React from "react";
import Box from "@mui/material/Box";
import { useDraggable } from "@dnd-kit/core";
import StoryboardSketchCard from "./StoryboardSketchCard";

const BASE_CARD_WIDTH = 340;

interface DraggableStoryboardSketchCardProps {
  storyboard: any;
  position: { x: number; y: number };
  active: boolean;
  setActive: (id: string) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onNameChange: (storyboardId: string, newName: string) => void;
  onDelete: (storyboardId: string) => void;
  isSaving?: boolean;
  deleting?: boolean;
  dragDelta?: { x: number; y: number } | null;
  generating?: boolean;
}

const DraggableStoryboardSketchCard: React.FC<DraggableStoryboardSketchCardProps> = ({
  storyboard,
  position,
  active,
  setActive,
  expanded,
  onExpandedChange,
  onNameChange,
  onDelete,
  isSaving,
  deleting,
  dragDelta,
  generating,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: storyboard.id,
  });

  // Width is controlled by the card itself (collapsed=340, expanded=340*cols)
  const cardWidth = BASE_CARD_WIDTH;

  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      onPointerDown={() => setActive(storyboard.id)}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: cardWidth,
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
      <StoryboardSketchCard
        name={storyboard.name || "Storyboard Sketches"}
        sketches={storyboard.sketches || []}
        isSaving={isSaving}
        deleting={deleting}
        error={storyboard.error}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        editable={!isSaving && !deleting}
        onClick={() => setActive(storyboard.id)}
        onNameChange={(newName: string) => onNameChange(storyboard.id, newName)}
        onDelete={() => onDelete(storyboard.id)}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        generating={generating}
      />
    </Box>
  );
};

export default DraggableStoryboardSketchCard;
