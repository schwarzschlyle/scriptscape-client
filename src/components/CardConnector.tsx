import React from "react";

interface CardConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  canvasSize?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

/**
 * Draws a cubic Bezier curve between two points, with robust edge case handling.
 */
const CardConnector: React.FC<CardConnectorProps> = ({
  from,
  to,
  canvasSize = 10000,
  stroke = "#fff",
  strokeWidth = 2,
  opacity = 0.92,
  style = {},
}) => {
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
  const CANVAS_MAX = canvasSize;
  const fx = clamp(from.x, CANVAS_MIN, CANVAS_MAX);
  const fy = clamp(from.y, CANVAS_MIN, CANVAS_MAX);
  const tx = clamp(adjustedTo.x, CANVAS_MIN, CANVAS_MAX);
  const ty = clamp(adjustedTo.y, CANVAS_MIN, CANVAS_MAX);

  // Use a cubic Bezier curve with a horizontal midpoint
  const midX = (fx + tx) / 2;

  return (
    <path
      d={`M${fx},${fy} C${midX},${fy} ${midX},${ty} ${tx},${ty}`}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
      opacity={opacity}
      style={{
        filter: "drop-shadow(0 1px 2px #0008)",
        strokeLinejoin: "round",
        ...style,
      }}
    />
  );
};

export default CardConnector;
