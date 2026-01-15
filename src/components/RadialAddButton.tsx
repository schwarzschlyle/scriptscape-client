import React from "react";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/material/styles";

export type RadialAddButtonSide = "top" | "right" | "bottom" | "left";

export interface RadialAddButtonProps {
  side: RadialAddButtonSide;
  visible: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onClick: (e: React.MouseEvent) => void;
}

/**
 * Hover-only circular add button that can be anchored on a card edge.
 *
 * Design:
 * - Dark mode: gray background + brand green plus
 * - Light mode: white background + brand accent plus
 */
const RadialAddButton: React.FC<RadialAddButtonProps> = ({
  side,
  visible,
  disabled = false,
  ariaLabel,
  onClick,
}) => {
  const theme = useTheme();

  const size = 32;
  const offset = -size / 2; // sit half outside the card

  const positionSx =
    side === "top"
      ? { top: offset, left: "50%", transform: "translateX(-50%)" }
      : side === "bottom"
        ? { bottom: offset, left: "50%", transform: "translateX(-50%)" }
        : side === "left"
          ? { left: offset, top: "50%", transform: "translateY(-50%)" }
          : { right: offset, top: "50%", transform: "translateY(-50%)" };

  // Palette contracts:
  // - theme.palette.success.main is the “brand green (dark mode accent)” in this app.
  // - theme.palette.card.background is the “brand gray in dark mode”.
  const isDark = theme.palette.mode === "dark";
  const bg = isDark ? theme.palette.card.background : theme.palette.common.white;
  // In both modes we want the “accent” color (defined as success.main in this app).
  const fg = theme.palette.success.main;

  return (
    <IconButton
      size="small"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      sx={{
        position: "absolute",
        zIndex: 5,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.12)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 140ms ease, transform 140ms ease",
        "&:hover": {
          backgroundColor: bg,
        },
        ...positionSx,
      }}
    >
      <AddIcon sx={{ color: fg, fontSize: 20 }} />
    </IconButton>
  );
};

export default RadialAddButton;
