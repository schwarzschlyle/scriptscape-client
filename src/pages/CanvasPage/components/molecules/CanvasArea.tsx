
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
import CardConnector from "../../../../components/CardConnector";
import ScriptAdditionModal from "./ScriptAdditionModal";
import ScriptGenerationModal from "./ScriptGenerationModal";

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
  pendingSegmentCollection,
  ...props
}: {
  script: Script;
  position: { x: number; y: number };
  onPositionChange: (id: string, x: number, y: number) => void;
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
        onSave={props.onSave}
        onDelete={props.onDelete}
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
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  const {
    scripts,
    positions,
    segmentCollections,
    segColPositions,
    loading,
    error,
    pendingSegmentCollection,
    handleAddScript,
    handleEditScript,
    handleDeleteScript,
    handleCardPositionChange,
    handleAddSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
  } = useCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Modal state for adding a script
  const [showAddScriptModal, setShowAddScriptModal] = React.useState(false);
  const [showScriptGenerationModal, setShowScriptGenerationModal] = React.useState(false);


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
    // Robustly resolve IDs and positions
    const segColId = col.id || "";
    const parentId = col.parentScriptId;
    const scriptPos = positions[parentId];
    const segColPos = segColPositions[segColId];

    // Validate positions
    function isValidPos(pos: any) {
      return (
        pos &&
        typeof pos.x === "number" &&
        typeof pos.y === "number" &&
        isFinite(pos.x) &&
        isFinite(pos.y)
      );
    }

    if (!parentId || !isValidPos(scriptPos) || !isValidPos(segColPos)) return null;

    const from = getCardCenter(parentId, true);
    const to = getCardCenter(segColId, false);

    // If from and to are the same, offset to avoid zero-length curve
    let adjustedTo = { ...to };
    if (from.x === to.x && from.y === to.y) {
      adjustedTo.x += 40;
      adjustedTo.y += 40;
    }

    // Clamp coordinates to canvas bounds
    function clamp(val: number, min: number, max: number) {
      return Math.max(min, Math.min(max, val));
    }
    const CANVAS_MIN = 0;
    const CANVAS_MAX = CANVAS_SIZE;
    const fx = clamp(from.x, CANVAS_MIN, CANVAS_MAX);
    const fy = clamp(from.y, CANVAS_MIN, CANVAS_MAX);
    const tx = clamp(adjustedTo.x, CANVAS_MIN, CANVAS_MAX);
    const ty = clamp(adjustedTo.y, CANVAS_MIN, CANVAS_MAX);

    // Use a cubic Bezier curve with a horizontal midpoint

    return (
      <CardConnector
        key={`link-${segColId}`}
        from={{ x: fx, y: fy }}
        to={{ x: tx, y: ty }}
        canvasSize={CANVAS_SIZE}
        stroke="#fff"
        strokeWidth={1}
        opacity={0.92}
        style={{
          filter: "drop-shadow(0 1px 2px #0008)",
          strokeLinejoin: "round",
        }}
      />
    );
  });

  // Handler for clicking the canvas background to deactivate cards
  const handleCanvasBackgroundClick = () => {
    // Only deactivate if there is an active card
    if (activeId !== null) {
      setActiveId(null);
    }
  };

  // Helper to prevent background click from firing when clicking on a card
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
      onClick={handleCanvasBackgroundClick}
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
          onClick={handleCanvasBackgroundClick}
        >
          {/* SVG for curves */}
          <svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 0 }}>
            {links}
          </svg>
          {/* ScriptCards */}
          {scripts.map((script: any) => (
            <div key={script.id} onClick={stopPropagation}>
              <DraggableScriptCard
                script={script}
                position={positions[script.id] || { x: 200, y: 200 }}
                onPositionChange={handleCardPositionChange}
                organizationId={organizationId}
                projectId={projectId}
                onSave={(name, text) => handleEditScript(script.id, name, text)}
                onDelete={() => handleDeleteScript(script.id)}
                active={activeId === script.id}
                setActive={setActiveId}
                onAddSegmentCollection={(name: string, numSegments: number) =>
                  handleAddSegmentCollection(script.id, name, numSegments)
                }
                isSaving={!!script.isSaving}
                deleting={!!script.deleting}
                pendingSegmentCollection={!!pendingSegmentCollection[script.id]}
              />
            </div>
          ))}
          {/* SegmentCollectionCards */}
          {Object.values(segmentCollections).map((col: any) => (
            <div key={col.id} onClick={stopPropagation}>
              <DraggableSegmentCollectionCard
                col={col}
                position={segColPositions[col.id] || { x: 600, y: 200 }}
                onPositionChange={handleSegColPositionChange}
                active={activeId === col.id}
                setActive={setActiveId}
                onNameChange={handleEditSegmentCollectionName}
                onSegmentChange={handleEditSegmentText}
                onDelete={handleDeleteSegmentCollection}
                isSaving={!!col.isSaving}
                deleting={!!col.deleting}
              />
            </div>
          ))}
        </Box>
      </DndContext>
      <AddScriptButton onClick={() => setShowAddScriptModal(true)} />
      <ScriptAdditionModal
        open={showAddScriptModal}
        onClose={() => setShowAddScriptModal(false)}
        onCreate={(name, text) => {
          handleAddScript(name, text);
          setShowAddScriptModal(false);
        }}
        onGenerate={() => {
          setShowAddScriptModal(false);
          setShowScriptGenerationModal(true);
        }}
      />
      <ScriptGenerationModal
        open={showScriptGenerationModal}
        onClose={() => setShowScriptGenerationModal(false)}
        onGenerate={() => {
          const id = Math.floor(1000 + Math.random() * 9000).toString();
          handleAddScript(`Generated-Script-Title-${id}`, `Generated-Script-Text=${id}`);
          setShowScriptGenerationModal(false);
        }}
      />
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
  isSaving?: boolean;
  deleting?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: col.id,
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
      />
    </Box>
  );
}

export default CanvasArea;
