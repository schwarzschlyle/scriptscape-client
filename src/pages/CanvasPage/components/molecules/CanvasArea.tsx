import React from "react";
import Box from "@mui/material/Box";
import ScriptCard from "./ScriptCard";
import AddScriptButton from "./AddScriptButton";
import LoadingSpinner from "@components/LoadingSpinner";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { Script } from "@api/scripts/types";
import { useCanvasAreaLogic } from "@hooks/useCanvasAreaLogic";
import { DndContext, useDraggable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

interface CanvasAreaProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

const CARD_WIDTH = 340;
const CANVAS_SIZE = 10000;

function DraggableScriptCard({
  script,
  position,
  onPositionChange,
  ...props
}: {
  script: Script;
  position: { x: number; y: number };
  onPositionChange: (id: string, x: number, y: number) => void;
  organizationId: string;
  projectId: string;
  isNew: boolean;
  onSavedOrCancel: () => void;
  onSave: (name: string, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: script.id,
  });

  // Calculate the current position (drag offset + base position)
  const x = position.x + (transform?.x ?? 0);
  const y = position.y + (transform?.y ?? 0);

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
        zIndex: 1,
        boxShadow: 2,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        {...attributes}
        {...listeners}
        tabIndex={0}
        title="Drag to move"
        aria-label="Drag to move"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          color: "#1976d2",
          fontSize: 28,
          background: "#e3f2fd",
          borderRadius: 6,
          padding: 8,
          outline: "none",
          width: 40,
          height: 40,
          marginLeft: "auto",
          marginRight: 8,
          marginTop: 8,
          marginBottom: 0,
          border: "2px solid #90caf9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <DragIndicatorIcon fontSize="large" />
      </button>
      <ScriptCard
        script={script}
        organizationId={props.organizationId}
        projectId={props.projectId}
        isNew={props.isNew}
        onSavedOrCancel={props.onSavedOrCancel}
        onSave={props.onSave}
        onDelete={props.onDelete}
      />
    </Box>
  );
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  const {
    scripts,
    positions,
    loading,
    error,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
    handleCardPositionChange,
  } = useCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Handle drag end to update position
  const HEADER_HEIGHT = 64;
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    const pos = positions[id];
    if (!pos) return;
    // Clamp y so card top does not go above header
    const newX = pos.x + delta.x;
    const newY = Math.max(HEADER_HEIGHT, pos.y + delta.y);
    handleCardPositionChange(id, newX, newY);
  };

  // Debug: log script IDs and positions
  console.log("Rendering CanvasArea: scripts", scripts.map(s => s.id), "positions", positions);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "#f0f4fa",
        p: 0,
        m: 0,
        overflow: "scroll",
      }}
    >
      <DndContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            border: "2px dashed #90caf9",
            bgcolor: "#fff",
            backgroundImage:
              "radial-gradient(rgba(120,120,120,0.35) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
            cursor: "default",
          }}
        >
          {scripts.map((script: Script) => (
            <DraggableScriptCard
              key={script.id}
              script={script}
              position={positions[script.id] || { x: 200, y: 200 }}
              onPositionChange={handleCardPositionChange}
              organizationId={organizationId}
              projectId={projectId}
              isNew={script.id.startsWith("temp-")}
              onSavedOrCancel={() => handleRemoveNewScript(script.id)}
              onSave={(name, text) =>
                script.id.startsWith("temp-")
                  ? handleSaveNewScript(script.id, name, text)
                  : handleEditScript(script.id, name, text)
              }
              onDelete={() => handleDeleteScript(script.id)}
            />
          ))}
        </Box>
      </DndContext>
      <AddScriptButton onClick={handleAddScript} />
      {loading && scripts.length === 0 && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <LoadingSpinner size={32} label="" />
        </Box>
      )}
      {error && (
        <Box color="error.main" sx={{ mt: 2 }}>
          {error}
        </Box>
      )}
    </Box>
  );
};

export default CanvasArea;
