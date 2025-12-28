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
      p: 2,
      boxSizing: "border-box",
      background: "#2F312F",
      border: "1.5px solid #1f211f",
      borderRadius: 4,
      minHeight: 60,
      mt: 2,
      mb: 2,
      cursor: editable ? "text" : "pointer",
      textAlign: !editable ? "center" : "left",
      alignItems: !editable ? "center" : "stretch",
      justifyContent: !editable ? "center" : "flex-start",
      ...style,
    }}
    className={className}
    {...rest}
  >
    {children}
  </Box>
);

export default CustomCardBody;
