// useCanvasAreaNavigation.ts
import React from "react";

const CANVAS_SIZE = 10000;
const PAN_SPEED = 0.3;
const ZOOM_SPEED = 0.02;

export function useCanvasAreaNavigation() {
  // Compute minimum zoom so canvas always covers viewport
  const getMinZoom = React.useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Math.max(vw / CANVAS_SIZE, vh / CANVAS_SIZE, 0.01);
  }, []);

  // Zoom display remapping: 0.6 internal = 100% displayed
  const ZOOM_DISPLAY_BASE = 0.6; // Internal zoom that displays as 100%
  const getDisplayZoom = React.useCallback((internalZoom: number) => {
    return Math.round((internalZoom / ZOOM_DISPLAY_BASE) * 100);
  }, []);

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
      if (zoom < 0.3) return 0;
      if (zoom < 0.5) return (zoom - 0.3) / 0.2 * 0.4;
      if (zoom < 2.0) return 0.4 + (zoom - 0.5) / 1.5 * 0.3;
      return 0.7;
    } else {
      if (zoom < 0.2) return 0.5;
      if (zoom < 0.6) return 0.5 + (zoom - 0.2) / 0.4 * 0.3;
      if (zoom < 1.5) return 0.8;
      if (zoom < 3.0) return 0.8 - (zoom - 1.5) / 1.5 * 0.5;
      return 0.3;
    }
  }, []);

  // Snap to grid helper (optional - set to false to disable snapping)
  const SNAP_TO_GRID = false;
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 10;

  const snapToGrid = React.useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const maybeSnapToGrid = React.useCallback((value: number) => {
    if (!SNAP_TO_GRID) return value;
    const snapped = snapToGrid(value);
    const distance = Math.abs(value - snapped);
    return distance < SNAP_THRESHOLD ? snapped : value;
  }, [snapToGrid]);

  // Centralized transform apply
  const applyTransform = React.useCallback(() => {
    const { x, y } = offsetRef.current;
    const z = zoomRef.current;
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
    }
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
  }, [getGridOpacity]);

  // RAF scheduler
  const scheduleTransform = React.useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  // Keep refs in sync with React state
  React.useEffect(() => {
    zoomRef.current = zoom;
    offsetRef.current = offset;
    scheduleTransform();
    // eslint-disable-next-line
  }, [zoom, offset, scheduleTransform]);

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
  const clampOffset = React.useCallback((x: number, y: number) => ({ x, y }), []);

  // Right-click panning handlers
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      setIsPanning(true);
      panStart.current = { ...offsetRef.current };
      mouseStart.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = ((e.clientX - mouseStart.current.x) / zoomRef.current) * PAN_SPEED;
    const dy = ((e.clientY - mouseStart.current.y) / zoomRef.current) * PAN_SPEED;
    offsetRef.current = clampOffset(
      panStart.current.x + dx,
      panStart.current.y + dy
    );
    scheduleTransform();
  }, [isPanning, clampOffset, scheduleTransform]);

  const endPan = React.useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setOffset(offsetRef.current);
    }
  }, [isPanning]);

  const handleMouseUp = React.useCallback(() => {
    endPan();
  }, [endPan]);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Scroll-to-zoom handler
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    // If wheel happens while pointer is inside any canvas card, don't zoom the canvas.
    // (We want the card scroll to be independent from canvas navigation.)
    const target = e.target as HTMLElement | null;
    if (target && target.closest && target.closest(".canvas-card")) {
      return;
    }
    if (e.ctrlKey) return;
    const minZoom = getMinZoom();
    const delta = e.deltaY < 0 ? ZOOM_SPEED : -ZOOM_SPEED;
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom + delta));
    if (prevZoom === nextZoom) return;
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
  }, [getMinZoom, clampOffset, scheduleTransform]);

  // Zoom button handlers
  const handleZoomIn = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom + ZOOM_SPEED * 5));
    if (prevZoom === nextZoom) return;
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
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, [getMinZoom, clampOffset, scheduleTransform]);

  const handleZoomOut = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(2.0, prevZoom - ZOOM_SPEED * 5));
    if (prevZoom === nextZoom) return;
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
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, [getMinZoom, clampOffset, scheduleTransform]);

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
      }, 150);
    };

    const wheelHandler = (e: WheelEvent) => {
      // Skip syncing while user is interacting with card scroll areas.
      const target = e.target as HTMLElement | null;
      if (target && target.closest && target.closest(".canvas-card")) {
        return;
      }
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

  return {
    zoom,
    setZoom,
    offset,
    setOffset,
    isPanning,
    setIsPanning,
    canvasRef,
    zoomRef,
    offsetRef,
    rafRef,
    minorGridRef,
    majorGridRef,
    getMinZoom,
    getDisplayZoom,
    getGridOpacity,
    snapToGrid,
    maybeSnapToGrid,
    applyTransform,
    scheduleTransform,
    clampOffset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    endPan,
  };
}
