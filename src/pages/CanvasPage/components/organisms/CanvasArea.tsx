import React from "react";
import Box from "@mui/material/Box";
import AddScriptButton from "../molecules/AddScriptButton";
import LoadingSpinner from "@components/LoadingSpinner";
import { useScriptsCanvasAreaLogic } from "@hooks/useScriptsCanvasAreaLogic";
import { useSegmentsCanvasAreaLogic } from "@hooks/useSegmentsCanvasAreaLogic";
import { useCanvasAreaNavigation } from "@hooks/useCanvasAreaNavigation";
import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";
import ZoomControls from "../molecules/ZoomControls";
import CardConnector from "../../../../components/CardConnector";
import ScriptAdditionModal from "../molecules/ScriptAdditionModal";
import ScriptGenerationModal from "../molecules/ScriptGenerationModal";
import DraggableScriptCard from "../molecules/DraggableScriptCard";
import DraggableSegmentCollectionCard from "../molecules/DraggableSegmentCollectionCard";
import DraggableVisualDirectionCard from "../molecules/DraggableVisualDirectionCard";
import { useVisualDirectionCanvasAreaLogic } from "@hooks/useVisualDirectionCanvasAreaLogic";

interface CanvasAreaProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

const CARD_WIDTH = 340;
const CANVAS_SIZE = 10000;

import CanvasHeader from "../molecules/CanvasHeader";

const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  // Scripts logic
  const {
    scripts,
    positions,
    loading: scriptsLoading,
    error: scriptsError,
    syncing: scriptsSyncing,
    handleAddScript,
    handleEditScript,
    handleDeleteScript,
    handleCardPositionChange,
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
  } = useSegmentsCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Visual Directions logic
  const {
    visualDirections,
    visualDirectionsPositions,
    loading: visualsLoading,
    error: visualsError,
    syncing: visualsSyncing,
    pendingVisualDirection,
    handleAddVisualDirection,
    handleEditVisualDirectionContent,
    handleDeleteVisualDirection,
    handleVisualDirectionPositionChange,
  } = useVisualDirectionCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Compose loading and error states
  const loading = scriptsLoading || segsLoading || visualsLoading;
  const error = scriptsError || segsError || visualsError;
  const syncing = scriptsSyncing || segsSyncing || visualsSyncing;

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
    } else if (visualDirectionsPositions[id]) {
      const oldPos = visualDirectionsPositions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      handleVisualDirectionPositionChange(id, newX, newY);
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
    <>
      <CanvasHeader
        orgName={""}
        projectName={""}
        projectDescription={""}
        onLogout={() => {}}
        syncing={syncing}
      />
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
                active={activeId === col.id}
                setActive={setActiveId}
                onNameChange={handleEditSegmentCollectionName}
                onSegmentChange={handleEditSegmentText}
                onDelete={handleDeleteSegmentCollection}
                isSaving={!!col.isSaving}
                deleting={!!col.deleting}
                dragDelta={activeId === col.id && isDragging ? activeDragDelta : null}
                onGenerateVisualDirection={() => {
                  // Generate a new VisualDirectionCard for this segment collection
                  const parentPos = segColPositions[col.id] || { x: 600, y: 200 };
                  const offsetX = 380;
                  const offsetY = 120;
                  handleAddVisualDirection(
                    col.id,
                    "Generated Visual Direction",
                    { x: parentPos.x + offsetX, y: parentPos.y + offsetY }
                  );
                }}
                pendingVisualDirection={!!pendingVisualDirection[col.id]}
              />
              {/* Render VisualDirectionCards for this segment collection */}
              {Object.values(visualDirections)
                .filter((vd: any) => vd.parentSegmentCollectionId === col.id)
                .map((vd: any) => (
                  <React.Fragment key={vd.id}>
                    {/* Bezier curve from SegmentCollectionCard to VisualDirectionCard */}
                    <svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 0 }}>
                      <CardConnector
                        from={{
                          x: (segColPositions[col.id]?.x || 600) + CARD_WIDTH / 2,
                          y: (segColPositions[col.id]?.y || 200) + 90,
                        }}
                        to={{
                          x: (visualDirectionsPositions[vd.id]?.x || ((segColPositions[col.id]?.x || 600) + 380)) + CARD_WIDTH / 2,
                          y: (visualDirectionsPositions[vd.id]?.y || ((segColPositions[col.id]?.y || 200) + 120)) + 90,
                        }}
                        canvasSize={CANVAS_SIZE}
                        stroke="#fff"
                        strokeWidth={1}
                        opacity={0.92}
                        style={{
                          filter: "drop-shadow(0 1px 2px #0008)",
                          strokeLinejoin: "round",
                        }}
                      />
                    </svg>
                    <DraggableVisualDirectionCard
                      visual={vd}
                      position={visualDirectionsPositions[vd.id] || { x: (segColPositions[col.id]?.x || 600) + 380, y: (segColPositions[col.id]?.y || 200) + 120 }}
                      active={activeId === vd.id}
                      setActive={setActiveId}
                      onNameChange={() => {}}
                      onVisualChange={handleEditVisualDirectionContent}
                      onDelete={handleDeleteVisualDirection}
                      isSaving={!!vd.isSaving}
                      deleting={!!vd.deleting}
                      dragDelta={activeId === vd.id && isDragging ? activeDragDelta : null}
                      pendingVisualDirection={!!pendingVisualDirection[col.id]}
                    />
                  </React.Fragment>
                ))}
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
          // TODO: [AI INTEGRATION] The following random id and generated script content will be replaced by AI-generated content from the API.
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
    </>
  );
};

export default CanvasArea;
