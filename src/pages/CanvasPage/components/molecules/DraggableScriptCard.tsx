import React from "react";
import Box from "@mui/material/Box";
import ScriptCard from "./ScriptCard";
import { useDraggable } from "@dnd-kit/core";
import type { Script } from "@api/scripts/types";

const CARD_WIDTH = 340;

interface DraggableScriptCardProps {
  script: Script;
  position: { x: number; y: number };
  organizationId: string;
  projectId: string;
  onSave: (name: string, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
  active: boolean;
  setActive: (id: string) => void;
  onAddSegmentCollection?: (name: string, numSegments: number) => void;
  isSaving?: boolean;
  deleting?: boolean;
  pendingSegmentCollection?: boolean;
  dragDelta?: { x: number; y: number } | null;
}

const DraggableScriptCard: React.FC<DraggableScriptCardProps> = ({
  script,
  position,
  organizationId,
  projectId,
  onSave,
  onDelete,
  active,
  setActive,
  onAddSegmentCollection,
  isSaving,
  deleting,
  pendingSegmentCollection,
  dragDelta,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: script.id,
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
        zIndex: active ? 100 : 1,
        boxShadow: 2,
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScriptCard
        script={script}
        organizationId={organizationId}
        projectId={projectId}
        onSave={onSave}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        onClick={() => setActive(script.id)}
        onAddSegmentCollection={onAddSegmentCollection}
        isSaving={isSaving}
        deleting={deleting}
        pendingSegmentCollection={pendingSegmentCollection}
      />
    </Box>
  );
};

export default DraggableScriptCard;
