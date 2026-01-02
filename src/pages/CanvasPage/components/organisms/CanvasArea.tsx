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
import { useCreateVisualSet } from "@api/visual_sets/mutations";
import { useStoryboardCanvasAreaLogic } from "@hooks/useStoryboardCanvasAreaLogic";
import DraggableStoryboardSketchCard from "../molecules/DraggableStoryboardSketchCard";

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
  const getScriptById = (id: string) => scripts.find((s: any) => s.id === id);
  const {
    collections,
    positions: segColPositions,
    pendingSegmentCollection,
    loading: segsLoading,
    error: segsError,
    syncing: segsSyncing,
    handleAddCollection,
    handleEditCollectionName,
    handleEditSegmentText,
    handleDeleteCollection,
    handleCollectionPositionChange,
  } = useSegmentsCanvasAreaLogic({ organizationId, projectId, onSyncChange, getScriptById });

  // Visual Directions logic
  const {
    directions: visualDirections,
    positions: visualDirectionsPositions,
    pendingVisualDirection,
    loading: visualsLoading,
    error: visualsError,
    syncing: visualsSyncing,
    handleAdd,
    handleEdit,
    handleDelete,
    handlePositionChange,
  } = useVisualDirectionCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Storyboards / Sketches logic
  const {
    storyboards,
    positions: storyboardPositions,
    pendingStoryboard,
    loading: storyboardsLoading,
    error: storyboardsError,
    syncing: storyboardsSyncing,
    handleAddStoryboardWithSketches,
    handleEditStoryboardName,
    handleDeleteStoryboard,
    handleStoryboardPositionChange,
  } = useStoryboardCanvasAreaLogic({
    organizationId,
    projectId,
    visualSetIds: Array.from(
      new Set(
        Object.values(visualDirections)
          .flatMap((vd: any) => vd?.visuals?.map((v: any) => v?.visualSetId) || [])
          .filter(Boolean)
      )
    ),
    onSyncChange,
  });

  // Visual Set creation mutation
  const createVisualSet = useCreateVisualSet();

  // Local pending state for visual set creation
  const [pendingVisualSet, setPendingVisualSet] = React.useState<{ [colId: string]: boolean }>({});

  // Compose loading and error states
  const loading = scriptsLoading || segsLoading || visualsLoading || storyboardsLoading;
  const error = scriptsError || segsError || visualsError || storyboardsError;
  const anyPendingVisualSet = Object.values(pendingVisualSet).some(Boolean);
  const syncing = scriptsSyncing || segsSyncing || visualsSyncing || storyboardsSyncing || anyPendingVisualSet;

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
      handleCollectionPositionChange(id, newX, newY);
    } else if (visualDirectionsPositions[id]) {
      const oldPos = visualDirectionsPositions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      handlePositionChange(id, newX, newY);
    } else if (storyboardPositions[id]) {
      const oldPos = storyboardPositions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      handleStoryboardPositionChange(id, newX, newY);
    }
    setActiveDragDelta(null);
    setIsDragging(false);
  };

const getCardCenter = (id: string, type: "script" | "segmentCollection" | "visualDirection" | "storyboard") => {
  let basePos;
  if (type === "script") {
    basePos = positions[id];
  } else if (type === "segmentCollection") {
    basePos = segColPositions[id];
  } else if (type === "visualDirection") {
    basePos = visualDirectionsPositions[id];
  } else if (type === "storyboard") {
    basePos = storyboardPositions[id];
  }
  if (!basePos) return { x: 0, y: 0 };
  const delta = (id === activeId && isDragging && activeDragDelta) ? activeDragDelta : { x: 0, y: 0 };
  return {
    x: basePos.x + delta.x + CARD_WIDTH / 2,
    y: basePos.y + delta.y + 90,
  };
};

  const links = [
    // Script to SegmentCollection connectors
    ...Object.values(collections)
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
        const from = getCardCenter(parentId, "script");
        const to = getCardCenter(segColId, "segmentCollection");
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
      .filter(Boolean),
    // SegmentCollection to VisualDirection connectors
    ...Object.values(visualDirections)
      .map((vd: any) => {
        const parentId = vd.parentSegmentCollectionId;
        if (!parentId) return null;
        const from = getCardCenter(parentId, "segmentCollection");
        const to = getCardCenter(vd.id, "visualDirection");
        return (
          <CardConnector
            key={`connector-vd-${vd.id}`}
            from={from}
            to={to}
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
      .filter(Boolean),
    // VisualDirection to StoryboardSketch connectors
    ...Object.values(storyboards)
      .map((sb: any) => {
        const parentId = sb.parentVisualDirectionId;
        if (!parentId) return null;
        const from = getCardCenter(parentId, "visualDirection");
        const to = getCardCenter(sb.id, "storyboard");
        return (
          <CardConnector
            key={`connector-sb-${sb.id}`}
            from={from}
            to={to}
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
      .filter(Boolean),
  ];

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
          {/* SVG for all connectors */}
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
                onAddSegmentCollection={async (name: string, numSegments: number) => {
                  console.log("Attempting to add segment collection", { scriptId: script.id, name, numSegments, position: positions[script.id] });
                  await handleAddCollection(script.id, name, numSegments, positions[script.id]);
                  console.log("Segment collection add complete");
                }}
                isSaving={!!script.isSaving}
                deleting={!!script.deleting}
                dragDelta={activeId === script.id && isDragging ? activeDragDelta : null}
                pendingSegmentCollection={!!pendingSegmentCollection[script.id]}
              />
            </div>
          ))}
          
          {/* SegmentCollectionCards */}
          {Object.values(collections).map((col: any) => (
            <div key={col.id} onClick={stopPropagation}>
              <DraggableSegmentCollectionCard
                col={col}
                position={segColPositions[col.id] || { x: 600, y: 200 }}
                active={activeId === col.id}
                setActive={setActiveId}
                onNameChange={handleEditCollectionName}
                onSegmentChange={handleEditSegmentText}
                onDelete={handleDeleteCollection}
                isSaving={!!col.isSaving}
                deleting={!!col.deleting}
                dragDelta={activeId === col.id && isDragging ? activeDragDelta : null}
                pendingVisualDirection={!!pendingVisualDirection[col.id] || !!pendingVisualSet[col.id]}
                onGenerateVisualDirections={async () => {
                  if (!col.segments || col.segments.length === 0) return;
                  setPendingVisualSet(prev => ({ ...prev, [col.id]: true }));
                  try {
                    const parentPos = segColPositions[col.id] || { x: 600, y: 200 };
                    const offsetX = 380;
                    const offsetY = 120;
                    const visualSet = await createVisualSet.mutateAsync({
                      collectionId: col.id,
                      name: "Visual Set",
                      description: "",
                      metadata: {},
                    });
                    // Use real segment text for AI visual generation
                    const contents = col.segments.map((segment: any) => segment.text);
                    const segmentIds = col.segments.map((segment: any) => segment.id);
                    await handleAdd(
                      col.id,
                      segmentIds,
                      contents,
                      { x: parentPos.x + offsetX, y: parentPos.y + offsetY },
                      visualSet.id
                    );
                  } finally {
                    setPendingVisualSet(prev => ({ ...prev, [col.id]: false }));
                  }
                }}
                // pendingVisualDirection={!!pendingVisualDirection[col.id]} // Remove or refactor as needed
              />
              {/* Render all VisualDirectionCards for this collection */}
              {Object.values(visualDirections)
                .filter((vd: any) => vd.parentSegmentCollectionId === col.id)
                .map((vd: any) => (
                  <DraggableVisualDirectionCard
                    key={vd.id}
                    visual={vd}
                    position={visualDirectionsPositions[vd.id] || { x: (segColPositions[col.id]?.x || 600) + 380, y: (segColPositions[col.id]?.y || 200) + 120 }}
                    active={activeId === vd.id}
                    setActive={setActiveId}
                    onNameChange={() => {}}
                    onVisualChange={handleEdit}
                    onDelete={handleDelete}
                    isSaving={!!vd.isSaving}
                    deleting={!!vd.deleting}
                    dragDelta={activeId === vd.id && isDragging ? activeDragDelta : null}
                    pendingStoryboardSketches={!!pendingStoryboard[vd.id]}
                    onGenerateStoryboardSketches={async (instructions?: string) => {
                      // Place storyboard card to the right of the visual direction card
                      const parentPos = visualDirectionsPositions[vd.id] || {
                        x: (segColPositions[col.id]?.x || 600) + 380,
                        y: (segColPositions[col.id]?.y || 200) + 120,
                      };
                      const offsetX = 380;
                      const offsetY = 120;
                      const visualSetId = vd?.visuals?.[0]?.visualSetId || projectId;
                      await handleAddStoryboardWithSketches(
                        vd.id,
                        visualSetId,
                        vd.visuals || [],
                        instructions,
                        { x: parentPos.x + offsetX, y: parentPos.y + offsetY }
                      );
                    }}
                  />
                ))}

              {Object.values(visualDirections)
                .filter((vd: any) => vd.parentSegmentCollectionId === col.id)
                .flatMap((vd: any) =>
                  Object.values(storyboards)
                    .filter((sb: any) => sb.parentVisualDirectionId === vd.id)
                    .map((sb: any) => (
                      <DraggableStoryboardSketchCard
                        key={sb.id}
                        storyboard={sb}
                        position={storyboardPositions[sb.id] || { x: (visualDirectionsPositions[vd.id]?.x || 980) + 380, y: (visualDirectionsPositions[vd.id]?.y || 320) + 120 }}
                        active={activeId === sb.id}
                        setActive={setActiveId}
                        onNameChange={handleEditStoryboardName}
                        onDelete={handleDeleteStoryboard}
                        isSaving={!!sb.isSaving}
                        deleting={!!sb.deleting}
                        dragDelta={activeId === sb.id && isDragging ? activeDragDelta : null}
                        pendingSketches={!!pendingStoryboard[vd.id]}
                      />
                    ))
                )}
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
        onCreate={(title, text) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const left = (-offset.x) / zoom;
          const top = (-offset.y) / zoom;
          const right = left + vw / zoom - CARD_WIDTH;
          const bottom = top + vh / zoom - 220;
          const randX = left + Math.random() * Math.max(0, right - left);
          const randY = top + Math.random() * Math.max(0, bottom - top);
          handleAddScript(title, text, { x: randX, y: randY });
          setShowScriptGenerationModal(false);
        }}
      />
      
      <ZoomControls zoom={getDisplayZoom(zoom)} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      
      {loading && scripts.length === 0 && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <LoadingSpinner size={32} label="" />
        </Box>
      )}
      
      {error && Object.keys(collections).length === 0 && scripts.length === 0 && (
        <Box color="error.main" sx={{ mt: 2 }}>
          {error}
        </Box>
      )}
    </Box>
    </>
  );
};

export default CanvasArea;
