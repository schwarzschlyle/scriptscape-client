import React from "react";
import Box from "@mui/material/Box";

interface CardActionsAreaProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
}

const CardActionsArea: React.FC<CardActionsAreaProps> = ({
  children,
  align = "right",
  style,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent:
        align === "left"
          ? "flex-start"
          : align === "center"
          ? "center"
          : "flex-end",
      alignItems: "center",
      mt: 1,
      mb: 0,
      width: "100%",
      ...style,
    }}
  >
    {children}
  </Box>
);

export default CardActionsArea;
