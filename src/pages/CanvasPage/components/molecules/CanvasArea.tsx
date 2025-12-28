import React from "react";
import Box from "@mui/material/Box";
import ScriptCard from "./ScriptCard";
import SegmentCollectionCard from "./SegmentCollectionCard";
import AddScriptButton from "./AddScriptButton";
import LoadingSpinner from "@components/LoadingSpinner";
import type { Script } from "@api/scripts/types";
import { useCanvasAreaLogic } from "@hooks/useCanvasAreaLogic";
import { DndContext, useDraggable } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";
import ZoomControls from "./ZoomControls";

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
  active,
  setActive,
  onAddSegmentCollection,
  isSaving,
  deleting,
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
  active: boolean;
  setActive: (id: string) => void;
  onAddSegmentCollection?: (name: string, numSegments: number) => void;
  isSaving?: boolean;
  deleting?: boolean;
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
        zIndex: active ? 100 : 1,
        boxShadow: 2,
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScriptCard
        script={script}
        organizationId={props.organizationId}
        projectId={props.projectId}
        isNew={props.isNew}
        onSavedOrCancel={props.onSavedOrCancel}
        onSave={props.onSave}
        onDelete={props.onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        onClick={() => setActive(script.id)}
        onAddSegmentCollection={onAddSegmentCollection}
        isSaving={isSaving}
        deleting={deleting}
      />
    </Box>
  );
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  const {
    scripts,
    positions,
    segmentCollections,
    segColPositions,
    loading,
    error,
    syncing,
    handleAddScript,
    handleSaveNewScript,
    handleEditScript,
    handleDeleteScript,
    handleRemoveNewScript,
    handleCardPositionChange,
    handleAddSegmentCollection,
    handleSaveNewSegmentCollection,
    handleRemoveNewSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
  } = useCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Canvas zoom state (1.0 = 100%)
  const [zoom, setZoom] = React.useState(1.0);

  // Active card state
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // Track drag transforms for all cards
  const [dragTransforms, setDragTransforms] = React.useState<{ [id: string]: { x: number; y: number } }>({});

  // Handle drag start to set active card
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active?.id as string;
    if (id) setActiveId(id);
  };

  // Handle drag move to update dragTransforms
  const handleDragMove = (event: DragMoveEvent) => {
    const id = event.active?.id as string;
    if (id && event.delta) {
      setDragTransforms((prev) => ({
        ...prev,
        [id]: { x: event.delta.x, y: event.delta.y },
      }));
    }
  };

  // Handle drag end to update position and clear dragTransforms
  const HEADER_HEIGHT = 64;
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    if (positions[id]) {
      // ScriptCard
      const pos = positions[id];
      const newX = pos.x + delta.x;
      const newY = Math.max(HEADER_HEIGHT, pos.y + delta.y);
      handleCardPositionChange(id, newX, newY);
    } else if (segColPositions[id]) {
      // SegmentCollectionCard
      const pos = segColPositions[id];
      const newX = pos.x + delta.x;
      const newY = Math.max(HEADER_HEIGHT, pos.y + delta.y);
      handleSegColPositionChange(id, newX, newY);
    }
    setDragTransforms((prev) => {
      const newTransforms = { ...prev };
      delete newTransforms[id];
      return newTransforms;
    });
  };

  // Debug: log script and segment collection IDs and positions
  console.log("Rendering CanvasArea: scripts", scripts.map(s => s.id), "positions", positions, "segmentCollections", Object.keys(segmentCollections), "segColPositions", segColPositions);

  // Helper to get the center of a card for curve drawing, using dragTransforms if dragging
  const getCardCenter = (id: string, isScript: boolean) => {
    const basePos = isScript ? positions[id] : segColPositions[id];
    if (!basePos) return { x: 0, y: 0 };
    const drag = dragTransforms[id] || { x: 0, y: 0 };
    return {
      x: basePos.x + drag.x + CARD_WIDTH / 2,
      y: basePos.y + drag.y + 90, // Approximate vertical center
    };
  };

  // Prepare links: for each segment collection, draw a curve to its parent script
  const links = Object.values(segmentCollections).map((col) => {
    if (!col.parentScriptId || !positions[col.parentScriptId] || !segColPositions[col.id || col.tempId || ""]) return null;
    const from = getCardCenter(col.parentScriptId, true);
    const to = getCardCenter(col.id || col.tempId || "", false);
    const midX = (from.x + to.x) / 2;
    return (
      <path
        key={`link-${col.id || col.tempId}`}
        d={`M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`}
        stroke="#2F312F"
        strokeWidth={2}
        fill="none"
        opacity={0.7}
      />
    );
  });

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
      <DndContext
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            bgcolor: "#111211",
            backgroundImage:
              "radial-gradient(#646564 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            cursor: "default",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.2s",
          }}
        >
          {/* SVG for curves */}
          <svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 0 }}>
            {links}
          </svg>
          {/* ScriptCards */}
          {scripts.map((script: any) => (
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
              active={activeId === script.id}
              setActive={setActiveId}
              onAddSegmentCollection={(name: string, numSegments: number) =>
                handleAddSegmentCollection(script.id, name, numSegments)
              }
              isSaving={!!script.isSaving}
              deleting={!!script.deleting}
            />
          ))}
          {/* SegmentCollectionCards */}
          {Object.values(segmentCollections).map((col: any) => {
            const isNew = !!col.tempId && !col.id;
            return (
              <DraggableSegmentCollectionCard
                key={col.id || col.tempId}
                col={col}
                position={segColPositions[col.id || col.tempId || ""] || { x: 600, y: 200 }}
                onPositionChange={handleSegColPositionChange}
                active={activeId === (col.id || col.tempId)}
                setActive={setActiveId}
                onNameChange={handleEditSegmentCollectionName}
                onSegmentChange={handleEditSegmentText}
                onDelete={handleDeleteSegmentCollection}
                onSavedOrCancel={
                  isNew && col.tempId
                    ? () => handleRemoveNewSegmentCollection(col.tempId as string)
                    : undefined
                }
                onSave={
                  isNew && col.tempId
                    ? (name, segments) =>
                        handleSaveNewSegmentCollection(col.tempId as string, name, segments)
                    : undefined
                }
                isSaving={!!col.isSaving}
                deleting={!!col.deleting}
              />
            );
          })}
        </Box>
      </DndContext>
      <AddScriptButton onClick={handleAddScript} />
      <ZoomControls zoom={zoom} setZoom={setZoom} />
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

/** Draggable wrapper for SegmentCollectionCard */
function DraggableSegmentCollectionCard({
  col,
  position,
  active,
  setActive,
  onNameChange,
  onSegmentChange,
  onDelete,
  onSavedOrCancel,
  onSave,
  isSaving,
  deleting,
}: {
  col: any;
  position: { x: number; y: number };
  onPositionChange: (id: string, x: number, y: number) => void;
  active: boolean;
  setActive: (id: string) => void;
  onNameChange: (colId: string, newName: string) => void;
  onSegmentChange: (colId: string, segmentId: string, newText: string, index: number) => void;
  onDelete: (colId: string) => void;
  onSavedOrCancel?: () => void;
  onSave?: (name: string, segments: { text: string }[]) => Promise<void>;
  isSaving?: boolean;
  deleting?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: col.id || col.tempId,
  });

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
        zIndex: 50,
        boxShadow: 2,
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SegmentCollectionCard
        id={col.id}
        tempId={col.tempId}
        name={col.name}
        segments={col.segments}
        isSaving={isSaving}
        deleting={deleting}
        error={col.error}
        dragAttributes={attributes}
        dragListeners={listeners}
        active={active}
        editable={!isSaving && !deleting}
        onClick={() => setActive(col.id || col.tempId)}
        onNameChange={(newName) => onNameChange(col.id || col.tempId, newName)}
        onSegmentChange={(segmentId, newText, idx) => onSegmentChange(col.id || col.tempId, segmentId, newText, idx)}
        onDelete={() => onDelete(col.id || col.tempId)}
        isNew={!!col.tempId && !col.id}
        onSavedOrCancel={onSavedOrCancel}
        onSave={onSave}
      />
    </Box>
  );
}

export default CanvasArea;
