import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export interface CardFooterProps {
  /** Left slot for future text/status. */
  left?: React.ReactNode;
  /** Center slot (e.g., expand/collapse control). */
  center?: React.ReactNode;
  /** Right slot for buttons (generate, expand, etc.). */
  right?: React.ReactNode;
  height?: number;
}

/**
 * Sticky-looking footer area for canvas cards.
 *
 * Usage: place this OUTSIDE the scroll container so it stays visible
 * while the card body scrolls.
 */
const CardFooter: React.FC<CardFooterProps> = ({
  left,
  center,
  right,
  height = 34,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height,
        minHeight: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1,
        gap: 1,
        borderTop: `1px solid ${theme.palette.card.footerBorder}`,
        background: theme.palette.card.footerBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>{left}</Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{center}</Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
        }}
      >
        {right}
      </Box>
    </Box>
  );
};

export default CardFooter;
