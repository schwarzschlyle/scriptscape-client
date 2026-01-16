import React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

type CardModalButtonProps = Omit<ButtonProps, "size"> & {
  /** Keep buttons compact to match canvas-card UI density. */
  size?: never;
};

export const CardModalSecondaryButton: React.FC<CardModalButtonProps> = (props) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      variant={props.variant ?? "outlined"}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        height: 30,
        px: 1.5,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.02,
        whiteSpace: "nowrap",
        minWidth: 0,
        borderColor: theme.palette.card.footerBorder,
        color: theme.palette.text.primary,
        boxShadow: "none",
        "&:hover": {
          borderColor: theme.palette.card.footerBorder,
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.04)",
          boxShadow: "none",
        },
        ...(props.sx as any),
      }}
    />
  );
};

export const CardModalPrimaryButton: React.FC<CardModalButtonProps> = (props) => {
  const theme = useTheme();

  // In this app, success.main is used as the “canvas accent”, which is green
  // in dark mode and neutral in light mode.
  const bg = theme.palette.success.main;
  const fg = theme.palette.mode === "dark" ? "#111211" : "#ffffff";

  return (
    <Button
      {...props}
      variant={props.variant ?? "contained"}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        height: 30,
        px: 1.75,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.02,
        whiteSpace: "nowrap",
        minWidth: 0,
        backgroundColor: bg,
        color: fg,
        boxShadow: "none",
        "&:hover": {
          backgroundColor: bg,
          filter: theme.palette.mode === "dark" ? "brightness(0.96)" : "brightness(0.98)",
          boxShadow: "none",
        },
        "&:disabled": {
          opacity: 0.55,
          color: fg,
        },
        ...(props.sx as any),
      }}
    />
  );
};

export const CardModalLinkButton: React.FC<CardModalButtonProps> = (props) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      variant={props.variant ?? "text"}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        height: 30,
        px: 1,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        minWidth: 0,
        color: theme.palette.text.secondary,
        boxShadow: "none",
        "&:hover": {
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.04)",
          boxShadow: "none",
        },
        ...(props.sx as any),
      }}
    />
  );
};
