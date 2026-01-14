// useCanvasAreaNavigation.ts
import React from "react";

/**
 * Production-grade pan/zoom for a large canvas area.
 *
 * Supported controls:
 * - Trackpad: two-finger scroll pans; pinch zooms (browser emits ctrlKey+wheel in most cases)
 * - Mouse: Ctrl/Cmd + wheel zooms; middle mouse drag pans; Space + left-drag pans
 * - Touch: two-finger drag pans; pinch zooms
 */

const CANVAS_SIZE = 10000;
const ZOOM_DISPLAY_BASE = 0.6; // Internal zoom that displays as 100%

// Zoom tuning
const ZOOM_MIN_HARD = 0.01;
const ZOOM_MAX = 4;
const ZOOM_WHEEL_EXP_SENSITIVITY = 0.0015; // exponential zoom sensitivity

// Wheel/pan heuristics
const TRACKPAD_WHEEL_DELTA_THRESHOLD = 50; // typical mouse-wheel step is often >= 53/100

type Point = { x: number; y: number };

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (el as any).isContentEditable === true ||
    el.closest?.("[contenteditable='true']") != null
  );
}

function isCanvasCardTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el?.closest?.(".canvas-card");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useCanvasAreaNavigation() {
  // Compute minimum zoom so canvas always covers viewport.
  // NOTE: we keep a hard floor so the canvas doesn't disappear at tiny viewports.
  const getMinZoom = React.useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Math.max(vw / CANVAS_SIZE, vh / CANVAS_SIZE, ZOOM_MIN_HARD);
  }, []);

  const getDisplayZoom = React.useCallback((internalZoom: number) => {
    return Math.round((internalZoom / ZOOM_DISPLAY_BASE) * 100);
  }, []);

  const [zoom, setZoom] = React.useState(() => {
    const minZoom = getMinZoom();
    return Math.max(ZOOM_DISPLAY_BASE, minZoom);
  });

  // Viewport offset (for panning) in screen pixels.
  const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);

  // --- Imperative refs for smooth pan/zoom (SOURCE OF TRUTH) ---
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
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
    // Keep the grid aligned to world space:
    // - backgroundSize scales with zoom
    // - backgroundPosition follows screen-space offset
    const minorSize = 20 * z;
    const majorSize = 100 * z;
    if (minorGridRef.current) {
      minorGridRef.current.style.backgroundSize = `${minorSize}px ${minorSize}px`;
      minorGridRef.current.style.backgroundPosition = `${x}px ${y}px`;
      minorGridRef.current.style.opacity = String(getGridOpacity(z, 'minor'));
    }
    if (majorGridRef.current) {
      majorGridRef.current.style.backgroundSize = `${majorSize}px ${majorSize}px`;
      majorGridRef.current.style.backgroundPosition = `${x}px ${y}px`;
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

  // --- Core pan/zoom math helpers ---
  const zoomAt = React.useCallback(
    (nextZoomUnclamped: number, clientX: number, clientY: number) => {
      const minZoom = getMinZoom();
      const prevZoom = zoomRef.current;
      const nextZoom = clamp(nextZoomUnclamped, minZoom, ZOOM_MAX);
      if (prevZoom === nextZoom) return;

      const ox = offsetRef.current.x;
      const oy = offsetRef.current.y;

      // Keep world point under cursor fixed.
      const nx = clientX - ((clientX - ox) / prevZoom) * nextZoom;
      const ny = clientY - ((clientY - oy) / prevZoom) * nextZoom;
      offsetRef.current = clampOffset(nx, ny);
      zoomRef.current = nextZoom;
      scheduleTransform();
    },
    [clampOffset, getMinZoom, scheduleTransform]
  );

  const panBy = React.useCallback(
    (dx: number, dy: number) => {
      offsetRef.current = clampOffset(offsetRef.current.x + dx, offsetRef.current.y + dy);
      scheduleTransform();
    },
    [clampOffset, scheduleTransform]
  );

  // --- Pointer-based panning (mouse + spacebar / middle mouse) + touch gestures ---
  const spacePressedRef = React.useRef(false);
  const panPointerIdRef = React.useRef<number | null>(null);
  const panStartOffsetRef = React.useRef<Point>({ x: 0, y: 0 });
  const panStartClientRef = React.useRef<Point>({ x: 0, y: 0 });

  // Touch gesture state
  const activeTouchPointersRef = React.useRef<Map<number, Point>>(new Map());
  const touchGestureStartRef = React.useRef<{
    distance: number;
    midpoint: Point;
    zoom: number;
    offset: Point;
  } | null>(null);

  const endPan = React.useCallback(() => {
    // Always commit (pointerup can race with state updates from pointerdown).
    setIsPanning(false);
    // Commit back into React state (used by other logic like spawning cards).
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, []);

  // Zoom button handlers
  const handleZoomIn = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(ZOOM_MAX, prevZoom * 1.1));
    zoomAt(nextZoom, window.innerWidth / 2, window.innerHeight / 2);
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, [getMinZoom, zoomAt]);

  const handleZoomOut = React.useCallback(() => {
    const minZoom = getMinZoom();
    const prevZoom = zoomRef.current;
    const nextZoom = Math.max(minZoom, Math.min(ZOOM_MAX, prevZoom / 1.1));
    zoomAt(nextZoom, window.innerWidth / 2, window.innerHeight / 2);
    setOffset(offsetRef.current);
    setZoom(zoomRef.current);
  }, [getMinZoom, zoomAt]);

  // --- Attach production-grade listeners (non-passive wheel, pointer gestures, keyboard shortcuts) ---
  const wheelEndTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;

    const commitSoon = () => {
      if (wheelEndTimerRef.current) window.clearTimeout(wheelEndTimerRef.current);
      wheelEndTimerRef.current = window.setTimeout(() => {
        setOffset(offsetRef.current);
        setZoom(zoomRef.current);
      }, 120);
    };

    const onWheel = (e: WheelEvent) => {
      // Allow scrolling inside cards.
      const isCard = isCanvasCardTarget(e.target);

      const isZoomGesture = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + wheel => zoom.
      if (isZoomGesture) {
        e.preventDefault();
        // Use exponential zoom so it feels consistent across zoom levels.
        const zoomFactor = Math.exp(-e.deltaY * ZOOM_WHEEL_EXP_SENSITIVITY);
        zoomAt(zoomRef.current * zoomFactor, e.clientX, e.clientY);
        commitSoon();
        return;
      }

      // Two-finger pan (trackpad) => wheel without modifiers.
      // Heuristic: treat small deltas or presence of deltaX as trackpad.
      const looksLikeTrackpad =
        Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < TRACKPAD_WHEEL_DELTA_THRESHOLD;

      if (!isCard && looksLikeTrackpad) {
        e.preventDefault();
        // Pan like normal scrolling: wheel delta moves the viewport.
        // (This matches most users' expectations on trackpads.)
        panBy(-e.deltaX, -e.deltaY);
        commitSoon();
      }
    };

    const onPointerDownCapture = (e: PointerEvent) => {
      // Ignore panning shortcuts when user is editing text.
      if (isEditableTarget(e.target)) return;

      const isMouse = e.pointerType === "mouse";
      const isTouch = e.pointerType === "touch";

      // Touch gestures (two-finger only)
      if (isTouch) {
        activeTouchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchPointersRef.current.size === 2) {
          const pts = Array.from(activeTouchPointersRef.current.values());
          const dx = pts[0].x - pts[1].x;
          const dy = pts[0].y - pts[1].y;
          const distance = Math.hypot(dx, dy);
          const midpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
          touchGestureStartRef.current = {
            distance,
            midpoint,
            zoom: zoomRef.current,
            offset: { ...offsetRef.current },
          };
          setIsPanning(true);
          // Prevent native browser panning/zooming.
          e.preventDefault();
        }
        return;
      }

      if (!isMouse) return;

      const isMiddleMouse = e.button === 1;
      const isSpacePan = e.button === 0 && spacePressedRef.current;
      if (!isMiddleMouse && !isSpacePan) return;

      // Start panning.
      panPointerIdRef.current = e.pointerId;
      panStartOffsetRef.current = { ...offsetRef.current };
      panStartClientRef.current = { x: e.clientX, y: e.clientY };
      setIsPanning(true);
      // Capture pointer so pan continues even if cursor leaves.
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // no-op
      }
      e.preventDefault();
      e.stopPropagation();
    };

    const onPointerMove = (e: PointerEvent) => {
      const isTouch = e.pointerType === "touch";
      if (isTouch) {
        if (!activeTouchPointersRef.current.has(e.pointerId)) return;
        activeTouchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Only gesture with two active pointers.
        if (activeTouchPointersRef.current.size !== 2) return;
        const start = touchGestureStartRef.current;
        if (!start) return;

        const pts = Array.from(activeTouchPointersRef.current.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const distance = Math.hypot(dx, dy);
        const midpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

        // Pan based on midpoint translation.
        const mdx = midpoint.x - start.midpoint.x;
        const mdy = midpoint.y - start.midpoint.y;
        offsetRef.current = clampOffset(start.offset.x + mdx, start.offset.y + mdy);

        // Zoom based on distance ratio.
        const ratio = distance / Math.max(1, start.distance);
        zoomRef.current = clamp(start.zoom * ratio, getMinZoom(), ZOOM_MAX);

        // Keep the midpoint anchored while zooming.
        const prevZoom = start.zoom;
        const nextZoom = zoomRef.current;
        const ox = offsetRef.current.x;
        const oy = offsetRef.current.y;
        offsetRef.current = clampOffset(
          midpoint.x - ((midpoint.x - ox) / prevZoom) * nextZoom,
          midpoint.y - ((midpoint.y - oy) / prevZoom) * nextZoom
        );

        scheduleTransform();
        return;
      }

      // Mouse panning
      if (panPointerIdRef.current == null || e.pointerId !== panPointerIdRef.current) return;
      const dx = e.clientX - panStartClientRef.current.x;
      const dy = e.clientY - panStartClientRef.current.y;
      offsetRef.current = clampOffset(panStartOffsetRef.current.x + dx, panStartOffsetRef.current.y + dy);
      scheduleTransform();
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      const isTouch = e.pointerType === "touch";
      if (isTouch) {
        activeTouchPointersRef.current.delete(e.pointerId);
        if (activeTouchPointersRef.current.size < 2) {
          touchGestureStartRef.current = null;
          if (isPanning) endPan();
        }
        return;
      }

      if (panPointerIdRef.current != null && e.pointerId === panPointerIdRef.current) {
        panPointerIdRef.current = null;
        endPan();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        // Only intercept Space when not typing.
        if (!isEditableTarget(document.activeElement)) {
          e.preventDefault();
          spacePressedRef.current = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = false;
      }
    };

    viewportEl.addEventListener("wheel", onWheel, { passive: false });
    viewportEl.addEventListener("pointerdown", onPointerDownCapture, { capture: true });
    viewportEl.addEventListener("pointermove", onPointerMove);
    viewportEl.addEventListener("pointerup", onPointerUpOrCancel);
    viewportEl.addEventListener("pointercancel", onPointerUpOrCancel);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      viewportEl.removeEventListener("wheel", onWheel);
      viewportEl.removeEventListener("pointerdown", onPointerDownCapture, { capture: true });
      viewportEl.removeEventListener("pointermove", onPointerMove);
      viewportEl.removeEventListener("pointerup", onPointerUpOrCancel);
      viewportEl.removeEventListener("pointercancel", onPointerUpOrCancel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (wheelEndTimerRef.current) window.clearTimeout(wheelEndTimerRef.current);
    };
  }, [endPan, getMinZoom, panBy, scheduleTransform, zoomAt]);

  return {
    zoom,
    setZoom,
    offset,
    setOffset,
    isPanning,
    setIsPanning,
    viewportRef,
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
    handleZoomIn,
    handleZoomOut,
    endPan,
  };
}
