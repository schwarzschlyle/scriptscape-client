import React from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

export interface CustomCardProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
  minHeight?: number | string;
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
  active = false,
  onClick,
  style,
  ...rest
}) => (
  <Box sx={{ position: "relative" }} style={style}>
    <Card
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        outline: active ? "2.5px solid #abf43e" : "none",
        outlineOffset: "0px",
        borderRadius: 2,
        transition: "outline 0.15s",
        backgroundColor: "#272927",
        overflow: "hidden",
        p: 0,
      }}
      onClick={onClick}
      {...rest}
    >
      {header}
      {header && <Divider sx={{ mb: 0, bgcolor: "#1f211f", height: 2 }} />}
      {body ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
          {body}
        </Box>
      ) : (
        children
      )}
    </Card>
  </Box>
);

export default CustomCard;
