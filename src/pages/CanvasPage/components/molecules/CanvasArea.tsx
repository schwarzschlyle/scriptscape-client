import React from "react";
import Box from "@mui/material/Box";
import ScriptCard from "./ScriptCard";
import SegmentCollectionCard from "./SegmentCollectionCard";
import AddScriptButton from "./AddScriptButton";
import LoadingSpinner from "@components/LoadingSpinner";
import type { Script } from "@api/scripts/types";
import { useScriptsCanvasAreaLogic } from "@hooks/useScriptsCanvasAreaLogic";
import { useSegmentsCanvasAreaLogic } from "@hooks/useSegmentsCanvasAreaLogic";
import { useCanvasAreaNavigation } from "@hooks/useCanvasAreaNavigation";
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
  zoom,
  dragDelta,
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
  zoom: number;
  dragDelta?: { x: number; y: number } | null;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: script.id,
  });

  // CRITICAL: Simple addition in world space
  // position is world coordinates
  // dragDelta is world coordinates (converted from screen in handleDragMove)
  // Canvas transform will handle scaling for display
  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "absolute",
        left: x,   // World space
        top: y,    // World space
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
  // Scripts logic
  const {
    scripts,
    draftScripts,
    positions,
    loading: scriptsLoading,
    error: scriptsError,
    syncing: scriptsSyncing,
    handleAddScript,
    handleAddDraftScript,
    handleSaveDraftScript,
    handleRemoveDraftScript,
    handleEditScript,
    handleDeleteScript,
    handleCardPositionChange,
    clearError: clearScriptsError,
  } = useScriptsCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Segments logic
  const {
    segmentCollections,
    segColPositions,
    loading: segsLoading,
    error: segsError,
    syncing: segsSyncing,
    pendingSegmentCollection,
    handleAddSegmentCollection,
    handleEditSegmentCollectionName,
    handleEditSegmentText,
    handleDeleteSegmentCollection,
    handleSegColPositionChange,
    clearError: clearSegsError,
  } = useSegmentsCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Compose loading and error states
  const loading = scriptsLoading || segsLoading;
  const error = scriptsError || segsError;

  const [showAddScriptModal, setShowAddScriptModal] = React.useState(false);
  const [showScriptGenerationModal, setShowScriptGenerationModal] = React.useState(false);

  // Navigation logic extracted to hook
  const {
    zoom,
    offset,
    isPanning,
    canvasRef,
    zoomRef,
    minorGridRef,
    majorGridRef,
    getDisplayZoom,
    maybeSnapToGrid,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    endPan,
  } = useCanvasAreaNavigation();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active?.id as string;
    if (id) {
      setActiveId(id);
      setIsDragging(true);
      setActiveDragDelta(null);
    }
  };

  const [activeDragDelta, setActiveDragDelta] = React.useState<{ x: number; y: number } | null>(null);

  const handleDragMove = (event: DragMoveEvent) => {
    if (!event.delta) return;
    const worldDelta = {
      x: event.delta.x / zoomRef.current,
      y: event.delta.y / zoomRef.current,
    };
    setActiveDragDelta(worldDelta);
  };

  const HEADER_HEIGHT = 64;
  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const id = active.id as string;
    const minY = HEADER_HEIGHT / zoom;
    const worldDelta = activeDragDelta || { x: 0, y: 0 };

    if (positions[id]) {
      const oldPos = positions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      handleCardPositionChange(id, newX, newY);
    } else if (segColPositions[id]) {
      const oldPos = segColPositions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      handleSegColPositionChange(id, newX, newY);
    }
    setActiveDragDelta(null);
    setIsDragging(false);
  };

  const getCardCenter = (id: string, isScript: boolean) => {
    const basePos = isScript ? positions[id] : segColPositions[id];
    if (!basePos) return { x: 0, y: 0 };
    const delta = (id === activeId && isDragging && activeDragDelta) ? activeDragDelta : { x: 0, y: 0 };
    return {
      x: basePos.x + delta.x + CARD_WIDTH / 2,
      y: basePos.y + delta.y + 90,
    };
  };

  const links = Object.values(segmentCollections)
    .map((col) => {
      const segColId = col.id || "";
      const parentId = col.parentScriptId;
      if (!parentId || !segColId) return null;
      const scriptPos = positions[parentId];
      const segColPos = segColPositions[segColId];
      if (!scriptPos || !segColPos) return null;
      const isValidPos = (pos: any) => {
        return (
          pos &&
          typeof pos.x === "number" &&
          typeof pos.y === "number" &&
          isFinite(pos.x) &&
          isFinite(pos.y)
        );
      };
      if (!isValidPos(scriptPos) || !isValidPos(segColPos)) return null;
      const from = getCardCenter(parentId, true);
      const to = getCardCenter(segColId, false);
      if (!isValidPos(from) || !isValidPos(to)) return null;
      let adjustedTo = { ...to };
      if (Math.abs(from.x - to.x) < 1 && Math.abs(from.y - to.y) < 1) {
        adjustedTo.x += 40;
        adjustedTo.y += 40;
      }
      const clamp = (val: number, min: number, max: number) =>
        Math.max(min, Math.min(max, val));
      const CANVAS_MIN = -1000;
      const CANVAS_MAX = CANVAS_SIZE + 1000;
      const fx = clamp(from.x, CANVAS_MIN, CANVAS_MAX);
      const fy = clamp(from.y, CANVAS_MIN, CANVAS_MAX);
      const tx = clamp(adjustedTo.x, CANVAS_MIN, CANVAS_MAX);
      const ty = clamp(adjustedTo.y, CANVAS_MIN, CANVAS_MAX);

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
    })
    .filter(Boolean);

  const handleCanvasBackgroundClick = () => {
    if (activeId !== null) {
      setActiveId(null);
    }
  };

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
        bgcolor: "#111211",
        p: 0,
        m: 0,
        overflow: "hidden",
        userSelect: isPanning ? "none" : "auto",
        cursor: isPanning ? "grabbing" : "default",
      }}
      onClick={handleCanvasBackgroundClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={endPan}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <DndContext
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* Two-tier infinite grid system (Figma/Miro style) */}
        
        {/* Minor grid layer (20px) - fine precision grid */}
        <Box
          ref={minorGridRef}
          sx={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            backgroundColor: "transparent",
            backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.35) 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
            opacity: 0.8,
            zIndex: 0,
          }}
        />
        
        {/* Major grid layer (100px) - section markers */}
        <Box
          ref={majorGridRef}
          sx={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            backgroundColor: "transparent",
            backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)",
            backgroundSize: "100px 100px",
            opacity: 0.85,
            zIndex: 0,
          }}
        />
        
        {/* Scaled content layer */}
        <Box
          ref={canvasRef}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            bgcolor: "transparent",
            cursor: isPanning ? "grabbing" : "default",
            willChange: "transform",
            transformOrigin: "top left",
            zIndex: 1,
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
                zoom={zoom}
                dragDelta={activeId === script.id && isDragging ? activeDragDelta : null}
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
                zoom={zoom}
                dragDelta={activeId === col.id && isDragging ? activeDragDelta : null}
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
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const left = (-offset.x) / zoom;
          const top = (-offset.y) / zoom;
          const right = left + vw / zoom - CARD_WIDTH;
          const bottom = top + vh / zoom - 220;
          const randX = left + Math.random() * Math.max(0, right - left);
          const randY = top + Math.random() * Math.max(0, bottom - top);
          handleAddScript(name, text, { x: randX, y: randY });
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
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const left = (-offset.x) / zoom;
          const top = (-offset.y) / zoom;
          const right = left + vw / zoom - CARD_WIDTH;
          const bottom = top + vh / zoom - 220;
          const randX = left + Math.random() * Math.max(0, right - left);
          const randY = top + Math.random() * Math.max(0, bottom - top);
          const id = Math.floor(1000 + Math.random() * 9000).toString();
          handleAddScript(`Generated-Script-Title-${id}`, `Generated-Script-Text=${id}`, { x: randX, y: randY });
          setShowScriptGenerationModal(false);
        }}
      />
      
      <ZoomControls zoom={getDisplayZoom(zoom)} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      
      {loading && scripts.length === 0 && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <LoadingSpinner size={32} label="" />
        </Box>
      )}
      
      {error && Object.keys(segmentCollections).length === 0 && scripts.length === 0 && (
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
  dragDelta,
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
  zoom: number;
  dragDelta?: { x: number; y: number } | null;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: col.id,
  });

  // Simple addition in world space
  const x = position.x + (dragDelta?.x ?? 0);
  const y = position.y + (dragDelta?.y ?? 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "absolute",
        left: x,   // World space
        top: y,    // World space
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
