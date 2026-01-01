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
const PAN_SPEED = 0.3;
const ZOOM_SPEED = 0.02;


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

  const [showAddScriptModal, setShowAddScriptModal] = React.useState(false);
  const [showScriptGenerationModal, setShowScriptGenerationModal] = React.useState(false);

  // Compute minimum zoom so canvas always covers viewport
  const getMinZoom = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Math.max(vw / CANVAS_SIZE, vh / CANVAS_SIZE, 0.01);
  };
  
  // Zoom display remapping: 0.6 internal = 100% displayed
  const ZOOM_DISPLAY_BASE = 0.6; // Internal zoom that displays as 100%
  const getDisplayZoom = (internalZoom: number) => {
    return Math.round((internalZoom / ZOOM_DISPLAY_BASE) * 100);
  };
  
  const [zoom, setZoom] = React.useState(() => {
    const minZoom = getMinZoom();
    return Math.max(0.6, minZoom);
  });

  // Viewport offset (for panning)
  const [offset, setOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStart = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStart = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Imperative refs for smooth pan/zoom (SOURCE OF TRUTH)
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const zoomRef = React.useRef(zoom);
  const offsetRef = React.useRef(offset);
  const rafRef = React.useRef<number | null>(null);

  // Grid refs for two-tier infinite grid
  const minorGridRef = React.useRef<HTMLDivElement | null>(null);
  const majorGridRef = React.useRef<HTMLDivElement | null>(null);

  // Calculate grid opacity based on zoom level for smooth LOD transitions
  const getGridOpacity = React.useCallback((zoom: number, gridType: 'minor' | 'major') => {
    if (gridType === 'minor') {
      // Minor grid (20px) - visible at normal zoom levels
      if (zoom < 0.3) return 0;
      if (zoom < 0.5) return (zoom - 0.3) / 0.2 * 0.4; // Fade in 0 → 0.4
      if (zoom < 2.0) return 0.4 + (zoom - 0.5) / 1.5 * 0.3; // Fade in 0.4 → 0.7
      return 0.7; // Full visibility when zoomed in
    } else {
      // Major grid (100px) 
      if (zoom < 0.2) return 0.5; // Always visible when very zoomed out
      if (zoom < 0.6) return 0.5 + (zoom - 0.2) / 0.4 * 0.3; // Fade in 0.5 → 0.8
      if (zoom < 1.5) return 0.8; // Peak visibility at normal zoom
      if (zoom < 3.0) return 0.8 - (zoom - 1.5) / 1.5 * 0.5; // Fade out 0.8 → 0.3
      return 0.3; // Slightly visible when very zoomed in
    }
  }, []);

  // Snap to grid helper (optional - set to false to disable snapping)
  const SNAP_TO_GRID = false; // Set to true to enable snap-to-grid
  const GRID_SIZE = 20; // Base grid size in pixels
  const SNAP_THRESHOLD = 10; // Snap if within this distance (world space)
  
  const snapToGrid = React.useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);
  
  const maybeSnapToGrid = React.useCallback((value: number) => {
    if (!SNAP_TO_GRID) return value;
    
    const snapped = snapToGrid(value);
    const distance = Math.abs(value - snapped);
    
    // Only snap if close enough
    return distance < SNAP_THRESHOLD ? snapped : value;
  }, [snapToGrid]);

  // Centralized transform apply (industry-grade)
  const applyTransform = () => {
    const { x, y } = offsetRef.current;
    const z = zoomRef.current;
    
    // Apply transform to content layer
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
    }
    
    // Industry-grade two-tier grid with smooth LOD transitions
    const gridX = x * z;
    const gridY = y * z;
    
    if (minorGridRef.current) {
      minorGridRef.current.style.backgroundPosition = `${gridX}px ${gridY}px`;
      minorGridRef.current.style.opacity = String(getGridOpacity(z, 'minor'));
    }
    
    if (majorGridRef.current) {
      majorGridRef.current.style.backgroundPosition = `${gridX}px ${gridY}px`;
      majorGridRef.current.style.opacity = String(getGridOpacity(z, 'major'));
    }
  };

  // RAF scheduler
  const scheduleTransform = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  };

  // Keep refs in sync with React state
  React.useEffect(() => {
    zoomRef.current = zoom;
    offsetRef.current = offset;
    scheduleTransform();
    // eslint-disable-next-line
  }, [zoom, offset]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  // Track if we're currently in a drag operation (not just card selected)
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active?.id as string;
    if (id) {
      setActiveId(id);
      setIsDragging(true);
      setActiveDragDelta(null); // Clear any stale drag state
    }
  };

  // Track active drag delta in WORLD SPACE
  const [activeDragDelta, setActiveDragDelta] = React.useState<{ x: number; y: number } | null>(null);

  const handleDragMove = (event: DragMoveEvent) => {
    if (!event.delta) return;
    
    // CRITICAL: Convert screen-space delta to world-space delta ONCE
    // DndKit gives us cumulative screen pixels moved
    // We divide by zoom to get world units
    const worldDelta = {
      x: event.delta.x / zoomRef.current,
      y: event.delta.y / zoomRef.current
    };
    
    setActiveDragDelta(worldDelta);
  };

  // Handle drag end - persist the position change
  const HEADER_HEIGHT = 64;
  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const id = active.id as string;
    const minY = HEADER_HEIGHT / zoom;
    
    // activeDragDelta is already in world space
    const worldDelta = activeDragDelta || { x: 0, y: 0 };
    
    if (positions[id]) {
      // ScriptCard - simple addition in world space
      const oldPos = positions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      
      // Apply snap-to-grid if enabled
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      
      handleCardPositionChange(id, newX, newY);
    } else if (segColPositions[id]) {
      // SegmentCollectionCard - simple addition in world space
      const oldPos = segColPositions[id];
      const rawX = oldPos.x + worldDelta.x;
      const rawY = oldPos.y + worldDelta.y;
      
      // Apply snap-to-grid if enabled
      const newX = maybeSnapToGrid(rawX);
      const newY = Math.max(minY, maybeSnapToGrid(rawY));
      
      handleSegColPositionChange(id, newX, newY);
    }
    
    // Clear drag state
    setActiveDragDelta(null);
    setIsDragging(false);
    // Note: Don't clear activeId here - card should stay selected after drag
  };

  // Helper to get the center of a card for curve drawing
  // All coordinates in world space - simple addition
  const getCardCenter = (id: string, isScript: boolean) => {
    const basePos = isScript ? positions[id] : segColPositions[id];
    if (!basePos) return { x: 0, y: 0 };
    
    // Only apply drag delta if this card is actively being dragged (not just selected)
    const delta = (id === activeId && isDragging && activeDragDelta) ? activeDragDelta : { x: 0, y: 0 };
    
    // Simple addition - all in world space
    return {
      x: basePos.x + delta.x + CARD_WIDTH / 2,
      y: basePos.y + delta.y + 90, // Approximate vertical center
    };
  };

  // Prepare links: for each segment collection, draw a curve to its parent script
  const links = Object.values(segmentCollections)
    .map((col) => {
      const segColId = col.id || "";
      const parentId = col.parentScriptId;
      
      // Validate IDs exist
      if (!parentId || !segColId) return null;
      
      // Validate positions exist
      const scriptPos = positions[parentId];
      const segColPos = segColPositions[segColId];
      
      if (!scriptPos || !segColPos) return null;
      
      // Validate positions are valid numbers
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

      // Get card centers (accounts for drag transforms)
      const from = getCardCenter(parentId, true);
      const to = getCardCenter(segColId, false);
      
      // Validate computed centers
      if (!isValidPos(from) || !isValidPos(to)) return null;

      // Avoid zero-length curves
      let adjustedTo = { ...to };
      if (Math.abs(from.x - to.x) < 1 && Math.abs(from.y - to.y) < 1) {
        adjustedTo.x += 40;
        adjustedTo.y += 40;
      }

      // Clamp to canvas bounds for safety
      const clamp = (val: number, min: number, max: number) => 
        Math.max(min, Math.min(max, val));
      
      const CANVAS_MIN = -1000; // Allow some overflow for smooth dragging
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
    .filter(Boolean); // Remove null entries

  // Handler for clicking the canvas background to deactivate cards
  const handleCanvasBackgroundClick = () => {
    if (activeId !== null) {
      setActiveId(null);
    }
  };

  // Helper to prevent background click from firing when clicking on a card
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Center canvas on mount
  React.useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = (CANVAS_SIZE * zoom - vw) / 2 / zoom;
    const centerY = (CANVAS_SIZE * zoom - vh) / 2 / zoom;
    setOffset({ x: -centerX, y: -centerY });
    // eslint-disable-next-line
  }, []);

  // No clamping for infinite grid
  const clampOffset = (x: number, y: number) => ({ x, y });

  // Right-click panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsPanning(true);
      panStart.current = { ...offsetRef.current };
      mouseStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = ((e.clientX - mouseStart.current.x) / zoomRef.current) * PAN_SPEED;
    const dy = ((e.clientY - mouseStart.current.y) / zoomRef.current) * PAN_SPEED;
    offsetRef.current = clampOffset(
      panStart.current.x + dx,
      panStart.current.y + dy
    );
    scheduleTransform();
  };
  
  const endPan = () => {
    if (isPanning) {
      setIsPanning(false);
      // Sync state ONCE at the end
      setOffset(offsetRef.current);
    }
  };
  
const handleMouseUp = () => {
  endPan();
};
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Scroll-to-zoom handler (FIXED: no setTimeout)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) return;
    
    const minZoom = getMinZoom();
    const delta = e.deltaY < 0 ? ZOOM_SPEED : -ZOOM_SPEED;
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom + delta));
    
    if (prevZoom === nextZoom) return;
    
    // Zoom to center of screen
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;
    
    offsetRef.current = clampOffset(
      cx - ((cx - ox) / prevZoom) * nextZoom,
      cy - ((cy - oy) / prevZoom) * nextZoom
    );
    zoomRef.current = nextZoom;
    
    scheduleTransform();
    
    // ✅ CRITICAL FIX: Don't sync state immediately during wheel
    // State sync happens via debounce or wheel end
  };

  // Zoom button handlers (match wheel behavior - zoom to center)
  const handleZoomIn = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom + ZOOM_SPEED * 5)); // 5x for button
    
    if (prevZoom === nextZoom) return;
    
    // Zoom to center of screen (same as wheel)
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;
    
    offsetRef.current = clampOffset(
      cx - ((cx - ox) / prevZoom) * nextZoom,
      cy - ((cy - oy) / prevZoom) * nextZoom
    );
    zoomRef.current = nextZoom;
    
    scheduleTransform();
    
    // Sync state immediately for buttons (no debounce needed)
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, []);

  const handleZoomOut = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom - ZOOM_SPEED * 5)); // 5x for button
    
    if (prevZoom === nextZoom) return;
    
    // Zoom to center of screen (same as wheel)
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;
    
    offsetRef.current = clampOffset(
      cx - ((cx - ox) / prevZoom) * nextZoom,
      cy - ((cy - oy) / prevZoom) * nextZoom
    );
    zoomRef.current = nextZoom;
    
    scheduleTransform();
    
    // Sync state immediately for buttons (no debounce needed)
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, []);
  
  // Debounced state sync for wheel zoom
  const wheelEndTimerRef = React.useRef<number | null>(null);
  
  React.useEffect(() => {
    const handleWheelEnd = () => {
      if (wheelEndTimerRef.current) {
        clearTimeout(wheelEndTimerRef.current);
      }
      wheelEndTimerRef.current = window.setTimeout(() => {
        setOffset(offsetRef.current);
        setZoom(zoomRef.current);
      }, 150); // Sync state 150ms after last wheel event
    };
    
    const wheelHandler = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        handleWheelEnd();
      }
    };
    
    window.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      window.removeEventListener('wheel', wheelHandler);
      if (wheelEndTimerRef.current) {
        clearTimeout(wheelEndTimerRef.current);
      }
    };
  }, []);

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
