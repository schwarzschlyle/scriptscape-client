export type SpawnSide = "top" | "right" | "bottom" | "left";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute a spawn point for a child card based on a parent card rect and a clicked side.
 *
 * Assumptions:
 * - Coordinates are in canvas/world space (the same coordinate system used for card positions)
 * - Parent rect is the *rendered* card dimensions (width/height)
 * - Child is placed with a fixed gap and centered to the clicked side
 */
export function computeSpawnPoint(
  parent: Rect,
  child: { width: number; height: number },
  side: SpawnSide,
  gap = 40
): Point {
  const cx = parent.x + parent.width / 2;
  const cy = parent.y + parent.height / 2;

  if (side === "right") {
    return { x: parent.x + parent.width + gap, y: cy - child.height / 2 };
  }
  if (side === "left") {
    return { x: parent.x - gap - child.width, y: cy - child.height / 2 };
  }
  if (side === "bottom") {
    return { x: cx - child.width / 2, y: parent.y + parent.height + gap };
  }
  // top
  return { x: cx - child.width / 2, y: parent.y - gap - child.height };
}

