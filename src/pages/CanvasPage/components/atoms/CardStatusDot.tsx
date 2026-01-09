import React from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";

export type CardStatusDotStatus = "idle" | "active" | "saving" | "pending" | "generating";

export interface CardStatusDotProps {
  status: CardStatusDotStatus;
  size?: number;
}

const blink = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0.3; }
`;

/**
 * Standardized status indicator dot used across all Canvas card headers.
 *
 * - pending: animated blue gradient (used on PARENT while a child is being AI-generated)
 * - generating: animated orange (used on CHILD while its AI content is generating)
 * - saving: solid orange (used for ordinary save operations)
 * - active: green
 * - idle: gray
 */
const CardStatusDot: React.FC<CardStatusDotProps> = ({ status, size = 10 }) => {
  if (status === "pending") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2196f3 60%, #21cbf3 100%)",
          marginRight: 0,
          border: "1.5px solid #232523",
          animation: `${blink} 1s infinite alternate`,
          transition: "background 0.2s",
          display: "inline-block",
        }}
      />
    );
  }

  if (status === "generating") {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff9800 60%, #ffc107 100%)",
          marginRight: 0,
          border: "1.5px solid #232523",
          animation: `${blink} 1s infinite alternate`,
          transition: "background 0.2s",
          display: "inline-block",
        }}
      />
    );
  }

  const background =
    status === "saving" ? "#ff9800" : status === "active" ? "#abf43e" : "#6a6967";

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        marginRight: 0,
        border: "1.5px solid #232523",
        transition: "background 0.2s",
        display: "inline-block",
      }}
    />
  );
};

export default CardStatusDot;
