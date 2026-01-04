import React from "react";
import Box from "@mui/material/Box";

export interface CustomCardBodyProps {
  editable?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const CustomCardBody: React.FC<CustomCardBodyProps> = ({
  editable = false,
  children,
  className,
  style,
  ...rest
}) => (
  <Box
    sx={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      boxSizing: "border-box",
      background: "#2F312F",
      border: "1.5px solid #1f211f",
      borderRadius: 2,
      minHeight: 60,
      mt: 0,
      mb: 0,
      cursor: editable ? "text" : "pointer",
      // Card bodies should be text-friendly by default.
      textAlign: "left",
      alignItems: "stretch",
      justifyContent: "flex-start",
      overflow: "auto",
      wordBreak: "break-word",
      maxWidth: "100%",
      fontFamily: "monospace",
      fontSize: 14,
      color: "#fff",
      padding: "12px",
      ...style,
    }}
    className={className}
    {...rest}
  >
    {children}
  </Box>
);

export default CustomCardBody;
