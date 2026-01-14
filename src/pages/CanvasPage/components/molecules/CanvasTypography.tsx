import React from "react";
import { useTheme } from "@mui/material/styles";

type CanvasTypographyVariant = "projectName" | "organizationName" | "projectDescription";

interface CanvasTypographyProps {
  variant: CanvasTypographyVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

const CanvasTypography: React.FC<CanvasTypographyProps> = ({
  variant,
  children,
  style,
  className,
  title,
}) => {
  const theme = useTheme();

  const base: React.CSSProperties = {
    fontFamily: "'SF Pro Text', 'San Francisco', Arial, sans-serif",
    fontStyle: "normal",
    letterSpacing: 0,
    lineHeight: 1.2,
  };

  const variantStyles: Record<CanvasTypographyVariant, React.CSSProperties> = {
    projectName: {
      ...base,
      fontWeight: 700,
      fontSize: "16px",
      color: theme.palette.text.primary,
    },
    organizationName: {
      ...base,
      fontWeight: 700,
      fontSize: "8px",
      color: theme.palette.text.secondary,
    },
    projectDescription: {
      ...base,
      fontWeight: 400,
      fontSize: "8px",
      color: theme.palette.text.secondary,
    },
  };

  return (
    <span
      style={{ ...variantStyles[variant], ...style }}
      className={className}
      title={title}
    >
      {children}
    </span>
  );
};

export default CanvasTypography;
