import React from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";

export interface CustomCardProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
  minHeight?: number | string;
  height?: number | string;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any;
}

const CustomCard: React.FC<CustomCardProps> = ({
  header,
  body,
  children,
  minHeight = 220,
  height,
  active = false,
  onClick,
  style,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ position: "relative" }} style={style}>
      <Card
        className="canvas-card"
        sx={{
          minHeight: height ?? minHeight,
          height: height ?? "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: 2,
          outline: active ? `1.5px solid ${theme.palette.card.outlineActive}` : "none",
          outlineOffset: "0px",
          borderRadius: 2,
          transition: "outline 0.15s",
          backgroundColor: theme.palette.card.background,
          overflow: "hidden",
          p: 0,
        }}
        onClick={onClick}
        {...rest}
      >
        {header}
        {header && <Divider sx={{ mb: 0, bgcolor: theme.palette.card.divider, height: 2 }} />}
        {body ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0, overflow: "hidden" }}>
            {body}
          </Box>
        ) : (
          children
        )}
      </Card>
    </Box>
  );
};

export default CustomCard;
