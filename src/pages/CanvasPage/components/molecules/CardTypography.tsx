import React from "react";
import { useTheme } from "@mui/material/styles";

type CardTypographyVariant =
  | "projectName"
  | "organizationName"
  | "projectDescription"
  | "cardType"
  | "cardTitle"
  | "cardBody";

interface CardTypographyProps {
  variant: CardTypographyVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

const CardTypography: React.FC<CardTypographyProps> = ({
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

  const variantStyles: Record<CardTypographyVariant, React.CSSProperties> = {
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
    cardType: {
      ...base,
      fontWeight: 400,
      fontSize: "16px",
      color: theme.palette.card.titleText,
    },
    cardTitle: {
      ...base,
      fontWeight: 400,
      fontSize: "16px",
      color: theme.palette.text.primary,
    },
    cardBody: {
      ...base,
      fontWeight: 400,
      fontSize: "14px",
      color: theme.palette.text.primary,
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

export default CardTypography;
