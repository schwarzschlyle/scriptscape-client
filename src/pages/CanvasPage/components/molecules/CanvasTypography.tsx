import React from "react";

type CanvasTypographyVariant = "projectName" | "organizationName" | "projectDescription";

interface CanvasTypographyProps {
  variant: CanvasTypographyVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

const variantStyles: Record<CanvasTypographyVariant, React.CSSProperties> = {
  projectName: {
    fontFamily: "'SF Pro Text', 'San Francisco', Arial, sans-serif",
    fontWeight: 700,
    fontStyle: "normal",
    fontSize: "16px",
    color: "#FFFFFF",
    letterSpacing: 0,
    lineHeight: 1.2,
  },
  organizationName: {
    fontFamily: "'SF Pro Text', 'San Francisco', Arial, sans-serif",
    fontWeight: 700,
    fontStyle: "normal",
    fontSize: "8px",
    color: "#4B5563",
    letterSpacing: 0,
    lineHeight: 1.2,
  },
  projectDescription: {
    fontFamily: "'SF Pro Text', 'San Francisco', Arial, sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: "8px",
    color: "#9CA3AF",
    letterSpacing: 0,
    lineHeight: 1.2,
  },
};

const CanvasTypography: React.FC<CanvasTypographyProps> = ({
  variant,
  children,
  style,
  className,
  title,
}) => (
  <span
    style={{ ...variantStyles[variant], ...style }}
    className={className}
    title={title}
  >
    {children}
  </span>
);

export default CanvasTypography;
