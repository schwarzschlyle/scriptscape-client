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
import { useTheme } from "@mui/material/styles";
import { computeSpawnPoint } from "../molecules/cardSpawn";
import type { SpawnSide } from "../molecules/cardSpawn";

interface CanvasAreaProps {
  organizationId: string;
  projectId: string;
  onSyncChange?: (syncing: boolean) => void;
}

const CARD_WIDTH = 340;
const STORYBOARD_BASE_CARD_WIDTH = 340;
const DEFAULT_CARD_HEIGHT = Math.round((CARD_WIDTH * 3) / 4);
const CANVAS_SIZE = 10000;


const CanvasArea: React.FC<CanvasAreaProps> = ({ organizationId, projectId, onSyncChange }) => {
  const theme = useTheme();
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
    handleDeleteScriptPosition,
    handleCardPositionChange,
  } = useScriptsCanvasAreaLogic({ organizationId, projectId, onSyncChange });

  // Segments logic
  const getScriptById = (id: string) => scripts.find((s: any) => s.id === id);
  const {
    collections,
    positions: segColPositions,
    pendingSegmentCollection,
    generatingCollections,
    loading: segsLoading,
    error: segsError,
    syncing: segsSyncing,
    handleAddCollection,
    handleEditCollectionName,
    handleEditSegmentText,
    handleDeleteCollection,
    handleDeleteCollectionsByScriptId,
    handleCollectionPositionChange,
  } = useSegmentsCanvasAreaLogic({ organizationId, projectId, onSyncChange, getScriptById });

  // Visual Directions logic
  const {
    directions: visualDirections,
    positions: visualDirectionsPositions,
    pendingVisualDirection,
    generatingDirections,
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
    generatingStoryboards,
    loading: storyboardsLoading,
    error: storyboardsError,
    syncing: storyboardsSyncing,
    handleAddStoryboardWithSketches,
    handleEditStoryboardName,
    handleDeleteStoryboard,
    handleDeleteStoryboardsByParentVisualDirectionId,
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
    getVisualDirectionPosition: (id: string) => visualDirectionsPositions[id],
  });

  // Visual Set creation mutation
  const createVisualSet = useCreateVisualSet();

  // Local pending state for visual set creation
  const [pendingVisualSet, setPendingVisualSet] = React.useState<{ [colId: string]: boolean }>({});

  // Compose loading and error states
  const loading = scriptsLoading || segsLoading || visualsLoading || storyboardsLoading;
  const error = scriptsError || segsError || visualsError || storyboardsError;
  const anyPendingVisualSet = Object.values(pendingVisualSet).some(Boolean);
  // We currently surface sync state via the CanvasPage header.
  // This local computation is kept only to ensure the individual syncing flags are "used"
  // (they can be useful for debugging and future UI affordances).
  void (scriptsSyncing || segsSyncing || visualsSyncing || storyboardsSyncing || anyPendingVisualSet);

  const [showAddScriptModal, setShowAddScriptModal] = React.useState(false);
  const [showScriptGenerationModal, setShowScriptGenerationModal] = React.useState(false);

  const getCardRect = React.useCallback(
    (x: number, y: number, width = CARD_WIDTH, height = DEFAULT_CARD_HEIGHT) => ({ x, y, width, height }),
    []
  );

  // Navigation logic extracted to hook
  const {
    zoom,
    offset,
    isPanning,
    viewportRef,
    canvasRef,
    zoomRef,
    minorGridRef,
    majorGridRef,
    getDisplayZoom,
    maybeSnapToGrid,
    handleZoomIn,
    handleZoomOut,
    endPan,
  } = useCanvasAreaNavigation();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Tracks expanded state for StoryboardSketch cards so connector math stays correct.
  const [storyboardExpanded, setStoryboardExpanded] = React.useState<Record<string, boolean>>({});

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active?.id as string;
    if (id) {
      // Always activate the card on drag start (so you can drag without pre-click).
      setActiveId(id);
      setIsDragging(true);
      setActiveDragDelta(null);
    }
  };

  const [activeDragDelta, setActiveDragDelta] = React.useState<{ x: number; y: number } | null>(null);

  // --- Cascading deletion orchestrators (script -> collections -> visual directions -> storyboards) ---
  const deleteStoryboardsForVisualDirection = React.useCallback(
    async (visualDirectionId: string) => {
      await handleDeleteStoryboardsByParentVisualDirectionId(visualDirectionId).catch(() => undefined);
      // Clear expand-state cache
      setStoryboardExpanded((prev) => {
        const next = { ...prev };
        Object.values(storyboards)
          .filter((sb: any) => sb.parentVisualDirectionId === visualDirectionId)
          .forEach((sb: any) => {
            if (sb?.id) delete next[sb.id];
          });
        return next;
      });
    },
    [handleDeleteStoryboardsByParentVisualDirectionId, storyboards]
  );

  const deleteVisualDirectionWithChildren = React.useCallback(
    async (visualDirectionId: string) => {
      // Delete storyboards first
      await deleteStoryboardsForVisualDirection(visualDirectionId);
      // Then delete the VisualDirection card (deletes all visuals under it)
      await handleDelete(visualDirectionId);
    },
    [deleteStoryboardsForVisualDirection, handleDelete]
  );

  const deleteScriptCascade = React.useCallback(
    async (scriptId: string) => {
      // Find segment collections for this script (before we remove them).
      const collectionIds = Object.values(collections)
        .filter((c: any) => c?.parentScriptId === scriptId)
        .map((c: any) => c?.id)
        .filter(Boolean) as string[];

      // Find VisualDirection ids tied to those collections.
      const visualDirectionIds = Object.values(visualDirections)
        .filter((vd: any) => collectionIds.includes(vd?.parentSegmentCollectionId))
        .map((vd: any) => vd?.id)
        .filter(Boolean) as string[];

      // Delete storyboards for each VisualDirection, then delete those visual directions.
      await Promise.all(
        visualDirectionIds.map(async (vdId) => {
          await deleteVisualDirectionWithChildren(vdId).catch(() => undefined);
        })
      );

      // Delete segment collections (backend should cascade segments)
      await handleDeleteCollectionsByScriptId(scriptId).catch(() => undefined);

      // Finally delete the script and its saved position.
      handleDeleteScriptPosition(scriptId);
      await handleDeleteScript(scriptId);
    },
    [
      collections,
      visualDirections,
      deleteVisualDirectionWithChildren,
      handleDeleteCollectionsByScriptId,
      handleDeleteScriptPosition,
      handleDeleteScript,
    ]
  );

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
  let width = CARD_WIDTH;
  if (type === "script") {
    basePos = positions[id];
  } else if (type === "segmentCollection") {
    basePos = segColPositions[id];
  } else if (type === "visualDirection") {
    basePos = visualDirectionsPositions[id];
  } else if (type === "storyboard") {
    basePos = storyboardPositions[id];
    const sketchesLen = Array.isArray((storyboards as any)?.[id]?.sketches) ? (storyboards as any)[id].sketches.length : 0;
    const cols = Math.max(1, Math.min(3, sketchesLen || 1));
    // In compact mode, storyboard cards are fixed-width like other cards.
    // In expanded mode, the card grows to show multiple columns.
    const isExpanded = !!storyboardExpanded[id];
    width = isExpanded ? STORYBOARD_BASE_CARD_WIDTH * cols : STORYBOARD_BASE_CARD_WIDTH;
  }
  if (!basePos) return { x: 0, y: 0 };
  const delta = (id === activeId && isDragging && activeDragDelta) ? activeDragDelta : { x: 0, y: 0 };
  return {
    x: basePos.x + delta.x + width / 2,
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
            stroke={theme.palette.canvas.connectorStroke}
            strokeWidth={1}
            opacity={0.92}
            style={{
              filter: theme.palette.canvas.connectorShadow,
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
            stroke={theme.palette.canvas.connectorStroke}
            strokeWidth={1}
            opacity={0.92}
            style={{
              filter: theme.palette.canvas.connectorShadow,
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
            stroke={theme.palette.canvas.connectorStroke}
            strokeWidth={1}
            opacity={0.92}
            style={{
              filter: theme.palette.canvas.connectorShadow,
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
      <Box
      ref={viewportRef}
      sx={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: theme.palette.canvas.background,
        p: 0,
        m: 0,
        overflow: "hidden",
        userSelect: isPanning ? "none" : "auto",
        cursor: isPanning ? "grabbing" : "default",
        // Required for PointerEvent touch gestures (otherwise the browser will steal
        // two-finger panning/zooming).
        touchAction: "none",
      }}
      onClick={handleCanvasBackgroundClick}
      onMouseLeave={endPan}
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
            backgroundImage: `radial-gradient(circle, ${theme.palette.canvas.gridMinorDot} 0.5px, transparent 0.5px)`,
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
            backgroundImage: `radial-gradient(circle, ${theme.palette.canvas.gridMajorDot} 1.5px, transparent 1.5px)`,
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
                onDelete={() => deleteScriptCascade(script.id)}
                active={activeId === script.id}
                setActive={setActiveId}
                onAddSegmentCollectionAt={async (side: SpawnSide, name: string, numSegments: number) => {
                  const parentPos = positions[script.id] || { x: 200, y: 200 };
                  const spawn = computeSpawnPoint(
                    getCardRect(parentPos.x, parentPos.y),
                    { width: CARD_WIDTH, height: DEFAULT_CARD_HEIGHT },
                    side,
                    40
                  );
                  await handleAddCollection(script.id, name, numSegments, {
                    parentScriptPosition: parentPos,
                    spawnPosition: spawn,
                  });
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
                generating={!!generatingCollections[col.id]}
                onGenerateVisualDirectionsAt={async (side: SpawnSide) => {
                  if (!col.segments || col.segments.length === 0) return;
                  setPendingVisualSet(prev => ({ ...prev, [col.id]: true }));
                  try {
                    const parentPos = segColPositions[col.id] || { x: 600, y: 200 };
                    const spawn = computeSpawnPoint(
                      getCardRect(parentPos.x, parentPos.y),
                      { width: CARD_WIDTH, height: DEFAULT_CARD_HEIGHT },
                      side,
                      40
                    );
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
                      spawn,
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
                    onDelete={(visualDirectionId: string) => deleteVisualDirectionWithChildren(visualDirectionId)}
                    isSaving={!!vd.isSaving}
                    deleting={!!vd.deleting}
                    dragDelta={activeId === vd.id && isDragging ? activeDragDelta : null}
                    pendingStoryboardSketches={!!pendingStoryboard[vd.id]}
                    generating={!!generatingDirections[vd.id]}
                    onGenerateStoryboardSketchesAt={async (side: SpawnSide, instructions?: string) => {
                      const parentPos = visualDirectionsPositions[vd.id] || {
                        x: (segColPositions[col.id]?.x || 600) + 380,
                        y: (segColPositions[col.id]?.y || 200) + 120,
                      };
                      const spawn = computeSpawnPoint(
                        getCardRect(parentPos.x, parentPos.y),
                        { width: CARD_WIDTH, height: DEFAULT_CARD_HEIGHT },
                        side,
                        40
                      );
                      const visualSetId = vd?.visuals?.[0]?.visualSetId || projectId;
                      await handleAddStoryboardWithSketches(
                        vd.id,
                        visualSetId,
                        vd.visuals || [],
                        instructions,
                        spawn
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
                      <div key={sb.id} onClick={stopPropagation}>
                      <DraggableStoryboardSketchCard
                        storyboard={sb}
                        position={storyboardPositions[sb.id] || { x: (visualDirectionsPositions[vd.id]?.x || 980) + 380, y: (visualDirectionsPositions[vd.id]?.y || 320) + 120 }}
                        active={activeId === sb.id}
                        setActive={setActiveId}
                        onNameChange={handleEditStoryboardName}
                        onDelete={handleDeleteStoryboard}
                        isSaving={!!sb.isSaving}
                        deleting={!!sb.deleting}
                        dragDelta={activeId === sb.id && isDragging ? activeDragDelta : null}
                        expanded={!!storyboardExpanded[sb.id]}
                        onExpandedChange={(expanded) =>
                          setStoryboardExpanded((prev) => ({ ...prev, [sb.id]: expanded }))
                        }
                        generating={!!generatingStoryboards[sb.id]}
                      />
                      </div>
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
