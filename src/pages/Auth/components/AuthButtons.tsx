import React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

type AuthButtonProps = Omit<ButtonProps, "size"> & { size?: never };

/**
 * Auth submit button styled to match the canvas modal buttons (compact + clean).
 */
export const AuthPrimaryButton: React.FC<AuthButtonProps> = (props) => {
  const theme = useTheme();
  const bg = theme.palette.success.main;
  const fg = theme.palette.mode === "dark" ? "#111211" : "#ffffff";
  return (
    <Button
      {...props}
      fullWidth
      variant={props.variant ?? "contained"}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        height: 40,
        px: 2,
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: 0.02,
        whiteSpace: "nowrap",
        backgroundColor: bg,
        color: fg,
        boxShadow: "none",
        "&:hover": {
          backgroundColor: bg,
          filter: "brightness(0.96)",
          boxShadow: "none",
        },
        "&:disabled": {
          opacity: 0.6,
          color: fg,
        },
        ...(props.sx as any),
      }}
    />
  );
};
